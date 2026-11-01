import * as vscode from 'vscode';

import { settingsTarget } from '../shared/settingsTarget';

export const FONT_SIZE_DEFAULT = 14;

async function saveFontSetting(key: string, value: string | number | undefined): Promise<void> {
    await vscode.workspace.getConfiguration('editor', { languageId: 'fasm' }).update(key, value, settingsTarget(), true);
}

export function registerFontCommands(afterChange: () => Promise<void>): vscode.Disposable[] {
    return [
        vscode.commands.registerCommand('fasm.setFont', async (family: string) => {
            await saveFontSetting('fontFamily', family);
            await afterChange();
        }),
        vscode.commands.registerCommand('fasm.setFontSize', async (size: number) => {
            await saveFontSetting('fontSize', size);
            await afterChange();
        }),
        vscode.commands.registerCommand('fasm.resetFont', async () => {
            await saveFontSetting('fontFamily', undefined);
            await saveFontSetting('fontSize', undefined);
            await afterChange();
        })
    ];
}
