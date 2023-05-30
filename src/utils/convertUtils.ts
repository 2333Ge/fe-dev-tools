import * as vscode from "vscode";

/**
 * 转换编辑中选中的文本
 */
export async function asyncConvertSelection(
  transform: (text: string) => Promise<string | undefined>
) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  const selection = editor.selection;
  const text = document.getText(selection);

  const convertedText = await transform(text);
  if (!convertedText) {
    return;
  }
  editor.edit((editBuilder) => {
    editBuilder.replace(selection, convertedText);
  });
}
