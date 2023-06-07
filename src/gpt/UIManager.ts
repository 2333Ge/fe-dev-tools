import * as vscode from "vscode";
import { IWebMsg, IChatMessage, IExtCommonMsg } from "./data";
import { gptManager } from "./GPTManager";
import path = require("path");
import fs = require("fs");
import { DEFAULT_PROMPTS } from "./prompts";

function getWebViewContent(
  context: vscode.ExtensionContext,
  templatePath: string
) {
  const resourcePath = path.join(context.extensionPath, templatePath);
  const dirPath = path.dirname(resourcePath);
  let html = fs.readFileSync(resourcePath, "utf-8");
  // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
  html = html.replace(
    /(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g,
    (m, $1, $2) => {
      return (
        $1 +
        vscode.Uri.file(path.resolve(dirPath, $2))
          .with({ scheme: "vscode-resource" })
          .toString() +
        '"'
      );
    }
  );
  return html;
}

class UIManager {
  private _statusBar!: vscode.StatusBarItem;
  private _currentPanel?: vscode.WebviewPanel;
  private _messages: IChatMessage[] = [];
  private _curPromptKey?: string;
  private _prompts: Record<string, string>;

  private _context!: vscode.ExtensionContext;

  constructor() {
    this._initStatusBar();

    this._prompts = vscode.workspace
      .getConfiguration("fe-dev-tools")
      .get("prompts", {});
    this._curPromptKey = vscode.workspace
      .getConfiguration("fe-dev-tools")
      .get("curPromptKey", "");
    if (Object.keys(this._prompts).length === 0) {
      this._prompts = DEFAULT_PROMPTS;
      vscode.workspace
        .getConfiguration("fe-dev-tools")
        .update("prompts", DEFAULT_PROMPTS);
    }
  }

  private get _curPrompt() {
    return this._prompts[this._curPromptKey || ""] || "";
  }

  private _initStatusBar = () => {
    this._statusBar = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right
    );
    this._statusBar.command = "fe-dev-tools.showTools";
    this._statusBar.text = "DEVTools";
    this._statusBar.tooltip = "打开工具面板";
    this._statusBar.show();
  };

  public init(context: vscode.ExtensionContext) {
    this._context = context;
  }

  private sendMsgToWebView = () => {
    this._currentPanel?.webview.postMessage({
      command: "common",
      data: {
        prompts: this._prompts,
        curPromptKey: this._curPromptKey,
        messages: this._messages,
      },
    } as IExtCommonMsg);
  };

  onDidReceiveWebviewMessage = (message: IWebMsg) => {
    const { command, data } = message;
    switch (command) {
      case "chat":
        this._messages = [
          { role: "user", content: data.content, status: "success" },
          { role: "assistant", content: "", status: "pending" },
        ];
        this.sendMsgToWebView();
        gptManager
          .getSingleCompletion(this._curPrompt, data.content)
          .then((res) => {
            this._messages[1].content = res;
            this._messages[1].status = "success";
            this.sendMsgToWebView();
          })
          .catch((err: Error) => {
            this._messages[1].content = err.message;
            this._messages[1].status = "error";
            this.sendMsgToWebView();
          });
        break;
      case "change-cur-prompt":
        this._curPromptKey = data.key;
        this.sendMsgToWebView();
        vscode.workspace
          .getConfiguration("fe-dev-tools")
          .update("curPromptKey", this._curPromptKey);
        break;
    }
  };

  show = () => {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    if (this._currentPanel) {
      this._currentPanel.reveal(columnToShowIn);
    } else {
      this._currentPanel = vscode.window.createWebviewPanel(
        "catCoding",
        "开发小工具",
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
        }
      );
      this._currentPanel.webview.html = getWebViewContent(
        this._context,
        "src/siderbar.html"
      );
      this._currentPanel.webview.onDidReceiveMessage(
        this.onDidReceiveWebviewMessage,
        undefined
      );
      this._currentPanel.onDidDispose(() => {
        this._currentPanel = undefined;
      });

      this.sendMsgToWebView();
    }
  };
}

export const uiManager = new UIManager();
