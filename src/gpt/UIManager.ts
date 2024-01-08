import * as vscode from "vscode";
import {
  IWebMsg,
  IChatMessage,
  IExtCommonMsg,
  IWebChatMsg,
  IWebChangeCurPromptMsg,
  IWebDelPromptMsg,
  IWebCopyPromptMsg,
} from "./data";
import { gptManager } from "./GPTManager";
import path = require("path");
import fs = require("fs");
import { DEFAULT_PROMPTS } from "./prompts";
import { IWebAddPromptMsg } from "./data";
import { IStoppablePromiseRes, stoppablePromise } from "../utils/promise";
import { copyTextToClipboard } from "../utils/common";

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
  private curChatPromise?: IStoppablePromiseRes<string>;

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
        .update("prompts", DEFAULT_PROMPTS, vscode.ConfigurationTarget.Global);
    } else {
      this._prompts = new Map(
        Object.entries(
          vscode.workspace.getConfiguration("fe-dev-tools").get("prompts", {})
        )
      );
    }
  };

  private _initStatusBar = () => {
    if (this._statusBar) {
      return;
    }
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

  private clearInvalidMessage() {
    this._messages = this._messages.filter((item) => item.status !== "success");
  }

  private handleChatMessage = (message: IWebChatMsg) => {
    const { data } = message;
    this.clearInvalidMessage();
    this._messages.push(
      { role: "user", content: data.content, status: "success" },
      { role: "assistant", content: "", status: "pending" }
    );
    this.sendCommonMsgToWebView();
    // 中断上次正在请求的
    this.curChatPromise?.stop();
    this.curChatPromise = stoppablePromise(() =>
      gptManager.getCompletion(this._messages, this._curPrompt)
    );
    this.curChatPromise.promise
      .then((res) => {
        this._messages[this._messages.length - 1] = {
          content: res,
          role: "assistant",
          status: "success",
        };
        this.sendCommonMsgToWebView();
      })
      .catch((err: Error) => {
        this._messages[this._messages.length - 1] = {
          content: err.message,
          role: "assistant",
          status: "error",
        };
        this.sendCommonMsgToWebView();
      });
  };

  private handleChangeCurPrompt = (message: IWebChangeCurPromptMsg) => {
    const { data } = message;
    this._curPromptKey = data.key;
    this.sendCommonMsgToWebView();
    vscode.workspace
      .getConfiguration("fe-dev-tools")
      .update(
        "curPromptKey",
        this._curPromptKey,
        vscode.ConfigurationTarget.Global
      );
  };

  private handleDelCurPrompt = (message: IWebDelPromptMsg) => {
    const { data } = message;
    this._curPromptKey = "";
    this._prompts.delete(data.key);
    this.sendCommonMsgToWebView();
    vscode.workspace
      .getConfiguration("fe-dev-tools")
      .update("prompts", this._promptsObj, vscode.ConfigurationTarget.Global);
  };

  private handleCopyPrompt = (message: IWebCopyPromptMsg) => {
    const { data } = message;
    // 没key则表示没展开状态，复制当前的
    const copyStr = this._prompts.get(data.key || this._curPromptKey!);
    if (!copyStr) {
      return;
    }
    copyTextToClipboard(copyStr).then(() => {
      vscode.window.showInformationMessage("复制成功");
    });
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
      .update("prompts", this._promptsObj, vscode.ConfigurationTarget.Global);
    vscode.workspace
      .getConfiguration("fe-dev-tools")
      .update(
        "curPromptKey",
        this._curPromptKey,
        vscode.ConfigurationTarget.Global
      );
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
      case "copy-prompt":
        this.handleCopyPrompt(message as IWebCopyPromptMsg);
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
        "CHAT",
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
