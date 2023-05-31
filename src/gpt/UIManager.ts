import * as vscode from "vscode";

class UIManager {
  private _statusBar!: vscode.StatusBarItem;

  constructor() {
    this._statusBar = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right
    );
    this._statusBar.command = "fe-dev-tools.showTools";
    this._statusBar.text = "DEVTools";
    this._statusBar.tooltip = "打开工具面板";
    this._statusBar.show();
  }

  show() {
    const panel = vscode.window.createWebviewPanel(
      "catCoding",
      "Cat Coding",
      vscode.ViewColumn.One,
      {}
    );

    // And set its HTML content
    panel.webview.html = this.getWebviewContent();
  }

  getWebviewContent() {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cat Coding</title>
  </head>
  <body>
      <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
  </body>
  </html>`;
  }
}

export const uiManager = new UIManager();
