import * as vscode from "vscode";
import { asyncConvertSelection } from "./utils/convertUtils";
import { getJSON, getTS } from "./gpt/json-to-ts";
import { gptManager } from "./gpt/GPTManager";
import { uiManager } from "./gpt/UIManager";

export function activate(context: vscode.ExtensionContext) {
  gptManager.init();

  let showTools = vscode.commands.registerCommand(
    "fe-dev-tools.showTools",
    () => {
      uiManager.show();
    }
  );

  context.subscriptions.push(showTools);
}

export function deactivate() {}
