import * as vscode from "vscode";
import { asyncConvertSelection } from "./utils/convertUtils";
import { getCompletion } from "./gpt/json-to-ts";

export function activate(context: vscode.ExtensionContext) {
  let getTSFromJSON = vscode.commands.registerCommand(
    "fe-dev-tools.getTSFromJSON",
    () => {
      asyncConvertSelection((str) => {
        return getCompletion(str);
      });
    }
  );

  context.subscriptions.push(getTSFromJSON);
}

export function deactivate() {}
