import * as vscode from "vscode";
import { IWebViewMessage, IChatMessage } from "./data";
import { getWebViewContent } from "./webviewContent";
import { gptManager } from "./GPTManager";
import { JSON_TO_TS } from "./prompts";

class UIManager {
  private _statusBar!: vscode.StatusBarItem;
  private _currentPanel?: vscode.WebviewPanel;
  private _messages: IChatMessage[] = [];

  constructor() {
    this._statusBar = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right
    );
    this._statusBar.command = "fe-dev-tools.showTools";
    this._statusBar.text = "DEVTools";
    this._statusBar.tooltip = "打开工具面板";
    this._statusBar.show();
  }

  onDidReceiveWebviewMessage = (message: IWebViewMessage) => {
    const { command, data } = message;
    switch (command) {
      case "chat":
        this._messages = [
          { role: "user", content: data.content, status: "success" },
          { role: "assistant", content: "", status: "pending" },
        ];
        this._currentPanel!.webview.html = getWebViewContent(this._messages);
        gptManager
          .getSingleCompletion("", data.content)
          .then((res) => {
            this._messages[1].content = res;
            this._messages[1].status = "success";
            this._currentPanel!.webview.html = getWebViewContent(
              this._messages
            );
          })
          .catch((err: Error) => {
            this._messages[1].content = err.message;
            this._messages[1].status = "error";
            this._currentPanel!.webview.html = getWebViewContent(
              this._messages
            );
          });
        break;
    }
  };

  show = () => {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    if (this._currentPanel) {
      // If we already have a panel, show it in the target column
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
      this._currentPanel.webview.html = getWebViewContent(this._messages);
      this._currentPanel.webview.onDidReceiveMessage(
        this.onDidReceiveWebviewMessage,
        undefined
      );
      this._currentPanel.onDidDispose(() => {
        this._currentPanel = undefined;
      });
    }
  };
}

export const uiManager = new UIManager();
