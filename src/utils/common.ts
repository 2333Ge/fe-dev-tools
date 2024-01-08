import * as vscode from "vscode";

export async function copyTextToClipboard(text: string) {
  await vscode.env.clipboard.writeText(text);
}

