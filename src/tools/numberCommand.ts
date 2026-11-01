import * as vscode from 'vscode';

import { convertNumber, numberAt } from './numberConverter';

function selectedNumber(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return undefined;
    }
    const selected = editor.document.getText(editor.selection).trim();
    if (selected) {
        return selected;
    }
    const position = editor.selection.active;
    return numberAt(editor.document.lineAt(position.line).text, position.character);
}

export function registerNumberCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('fasm.checkNumber', async () => {
        const text = selectedNumber() ?? await vscode.window.showInputBox({
            title: 'Check Number Value',
            prompt: 'Try 255, 0FFh, 0xFF, $FF, 11111111b or 377o',
            validateInput: (value) => (!value.trim() || convertNumber(value) ? undefined : "That isn't a number fasm can read.")
        });
        if (!text) {
            return;
        }

        const result = convertNumber(text);
        if (!result) {
            void vscode.window.showWarningMessage(`"${text}" isn't a number fasm can read.`);
            return;
        }

        const choice = await vscode.window.showQuickPick(
            [
                { label: result.decimal, description: 'Decimal' },
                { label: result.hex, description: 'Hex' },
                { label: result.binary, description: 'Binary' },
                { label: result.octal, description: 'Octal' }
            ],
            { title: `Value of ${text}`, placeHolder: 'Choose a value to copy it' }
        );
        if (choice) {
            await vscode.env.clipboard.writeText(choice.label);
            void vscode.window.setStatusBarMessage(`Copied ${choice.label}`, 2000);
        }
    });
}
