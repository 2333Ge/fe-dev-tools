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

  context.subscriptions.push(showTools);
}

export function deactivate() {}
