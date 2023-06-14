import * as vscode from "vscode";
import { gptManager } from "./gpt/GPTManager";
import { uiManager } from "./gpt/UIManager";

export function activate(context: vscode.ExtensionContext) {
  gptManager.init();
  uiManager.init(context);

  let showTools = vscode.commands.registerCommand(
    "fe-dev-tools.showTools",
    () => {
      uiManager.show();
    }
  );

  const configChange = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("fe-dev-tools")) {
      gptManager.init();
      uiManager.init(context);
    }
  });

  context.subscriptions.push(showTools, configChange);
}

export function deactivate() {}
