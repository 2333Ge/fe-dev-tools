import * as vscode from "vscode";
import { asyncConvertSelection } from "./utils/convertUtils";
import { getJSON, getTS } from "./gpt/json-to-ts";
import { gptManager } from "./gpt/GptManager";

export function activate(context: vscode.ExtensionContext) {
  gptManager.init();
  let getTSFromJSON = vscode.commands.registerCommand(
    "fe-dev-tools.getTSFromJSON",
    () => {
      asyncConvertSelection((str) => {
        return getJSON(str);
        // return getTS(str);
      });
    }
  );

  context.subscriptions.push(getTSFromJSON);
}

export function deactivate() {}
