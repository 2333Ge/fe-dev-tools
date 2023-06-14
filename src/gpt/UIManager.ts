import * as vscode from "vscode";
import {
  IWebMsg,
  IChatMessage,
  IExtCommonMsg,
  IWebChatMsg,
  IWebChangeCurPromptMsg,
  IWebDelPromptMsg,
} from "./data";
import { gptManager } from "./GPTManager";
import path = require("path");
import fs = require("fs");
import { DEFAULT_PROMPTS } from "./prompts";
import { IWebAddPromptMsg } from "./data";

function getWebViewContent(
  context: vscode.ExtensionContext,
  templatePath: string,
  webView: vscode.Webview
) {
  const resourcePath = path.join(context.extensionPath, templatePath);
  const dirPath = path.dirname(resourcePath);
  let html = fs.readFileSync(resourcePath, "utf-8");

  html = html.replace(
    /(<link[\s\S]+?href="|<script[\s\S]+?src="|<img[\s\S]+?src=")(.+?)"/g,
    (m, $1, $2) => {
      const newPath = vscode.Uri.file(path.resolve(dirPath, $2));
      return $1 + webView.asWebviewUri(newPath) + '"';
    }
  );
  return html;
}

class UIManager {
  private _statusBar!: vscode.StatusBarItem;
  private _currentPanel?: vscode.WebviewPanel;
  private _messages: IChatMessage[] = [];
  private _curPromptKey?: string;
  private _prompts: Map<string, string> = new Map();

  private _context!: vscode.ExtensionContext;

  public init(context: vscode.ExtensionContext) {
    this._context = context;
    this._initStatusBar();
    this._initConfiguration();
  }

  private get _curPrompt() {
    return this._prompts.get(this._curPromptKey || "") || "";
  }

  private get _promptsObj() {
    const obj: Record<string, string> = {};
    this._prompts.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  private _initConfiguration = () => {
    this._curPromptKey = vscode.workspace
      .getConfiguration("fe-dev-tools")
      .get("curPromptKey", "");

    if (
      Object.keys(
        vscode.workspace.getConfiguration("fe-dev-tools").get("prompts", {})
      ).length === 0
    ) {
      this._prompts = new Map(Object.entries(DEFAULT_PROMPTS));
      vscode.workspace
        .getConfiguration("fe-dev-tools")
        .update("prompts", DEFAULT_PROMPTS);
    } else {
      this._prompts = new Map(
        Object.entries(
          vscode.workspace.getConfiguration("fe-dev-tools").get("prompts", {})
        )
      );
    }
  };

  private _initStatusBar = () => {
    this._statusBar = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right
    );
    this._statusBar.command = "fe-dev-tools.showTools";
    this._statusBar.text = "DEVTools";
    this._statusBar.tooltip = "打开工具面板";
    this._statusBar.show();
  };

  private sendCommonMsgToWebView = () => {
    this._currentPanel?.webview.postMessage({
      command: "common",
      data: {
        prompts: this._promptsObj,
        curPromptKey: this._curPromptKey,
        messages: this._messages,
      },
    } as IExtCommonMsg);
  };

  private handleChatMessage = (message: IWebChatMsg) => {
    const { data } = message;
    this._messages = [
      { role: "user", content: data.content, status: "success" },
      { role: "assistant", content: "", status: "pending" },
    ];
    this.sendCommonMsgToWebView();
    gptManager
      .getSingleCompletion(this._curPrompt, data.content)
      .then((res) => {
        this._messages[1].content = res;
        this._messages[1].status = "success";
        this.sendCommonMsgToWebView();
      })
      .catch((err: Error) => {
        this._messages[1].content = err.message;
        this._messages[1].status = "error";
        this.sendCommonMsgToWebView();
      });
  };

  private handleChangeCurPrompt = (message: IWebChangeCurPromptMsg) => {
    const { data } = message;
    this._curPromptKey = data.key;
    this.sendCommonMsgToWebView();
    vscode.workspace
      .getConfiguration("fe-dev-tools")
      .update("curPromptKey", this._curPromptKey);
  };

  private handleDelCurPrompt = (message: IWebDelPromptMsg) => {
    const { data } = message;
    this._curPromptKey = "";
    this._prompts.delete(data.key);
    this.sendCommonMsgToWebView();
    vscode.workspace
      .getConfiguration("fe-dev-tools")
      .update("prompts", this._promptsObj);
  };

  private handleAddPrompt = (message: IWebAddPromptMsg) => {
    const { data } = message;
    const key =
      Math.max(
        ...Object.keys(this._promptsObj).map((key) => Number(key) || 0)
      ) + 1;

    this._curPromptKey = key + "";
    this._prompts.set(this._curPromptKey, data.content);
    this.sendCommonMsgToWebView();
    vscode.workspace
      .getConfiguration("fe-dev-tools")
      .update("prompts", this._promptsObj);
    vscode.workspace
      .getConfiguration("fe-dev-tools")
      .update("curPromptKey", this._curPromptKey);
  };
  /**
   * 处理webview发来的消息
   */
  private onDidReceiveWebviewMessage = (message: IWebMsg) => {
    console.log("message====>", message);
    const { command } = message;
    switch (command) {
      case "chat":
        this.handleChatMessage(message as IWebChatMsg);
        break;
      case "change-cur-prompt":
        this.handleChangeCurPrompt(message as IWebChangeCurPromptMsg);
        break;
      case "delete-prompt":
        this.handleDelCurPrompt(message as IWebDelPromptMsg);
        break;
      case "add-prompt":
        this.handleAddPrompt(message as IWebAddPromptMsg);
        break;
    }
  };

  public show = () => {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    if (this._currentPanel) {
      this._currentPanel.reveal(columnToShowIn);
    } else {
      this._currentPanel = vscode.window.createWebviewPanel(
        "fe-dev-tools",
        "chat",
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );
      this._currentPanel.webview.html = getWebViewContent(
        this._context,
        "source/siderbar.html",
        this._currentPanel.webview
      );
      this._currentPanel.webview.onDidReceiveMessage(
        this.onDidReceiveWebviewMessage,
        undefined
      );
      this._currentPanel.onDidDispose(() => {
        this._currentPanel = undefined;
      });

      this.sendCommonMsgToWebView();
    }
  };
}

export const uiManager = new UIManager();
