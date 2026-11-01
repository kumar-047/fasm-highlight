import * as vscode from 'vscode';

import { settingsTarget } from '../shared/settingsTarget';
import { FONT_PALETTE, FONT_SIZES } from './constants/fontPalette';
import { validateFontSize } from './fontSettings';

function editorConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('editor', { languageId: 'fasm' });
}

async function saveFontSetting(key: string, value: string | number | undefined): Promise<void> {
    await editorConfig().update(key, value, settingsTarget(), true);
}

async function chooseCustomFont(): Promise<void> {
    const value = await vscode.window.showInputBox({
        title: 'Custom Font',
        prompt: 'For example: Consolas, monospace',
        value: editorConfig().get<string>('fontFamily', '')
    });
    if (value) {
        await saveFontSetting('fontFamily', value);
    }
}

async function chooseFontSize(): Promise<void> {
    const current = editorConfig().get<number>('fontSize', 14);
    const choice = await vscode.window.showQuickPick(
        [
            ...FONT_SIZES.map((size) => ({ label: String(size), description: size === current ? 'Current' : '' })),
            { label: 'Custom Size', description: '' }
        ],
        { title: 'Font Size' }
    );
    if (!choice) {
        return;
    }
    if (choice.label !== 'Custom Size') {
        await saveFontSetting('fontSize', Number(choice.label));
        return;
    }
    const value = await vscode.window.showInputBox({ title: 'Custom Font Size', value: String(current), validateInput: validateFontSize });
    if (value) {
        await saveFontSetting('fontSize', Number(value));
    }
}

async function resetFont(): Promise<void> {
    await saveFontSetting('fontFamily', undefined);
    await saveFontSetting('fontSize', undefined);
}

export function registerFontCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('fasm.changeFont', async () => {
        const current = editorConfig().get<string>('fontFamily', '');
        const choice = await vscode.window.showQuickPick(
            [
                ...FONT_PALETTE.map((font) => ({
                    label: font.label,
                    description: current === font.family ? 'Current' : '',
                    run: () => saveFontSetting('fontFamily', font.family)
                })),
                { label: 'Custom Font', description: 'Type any font installed on your computer', run: chooseCustomFont },
                { label: 'Font Size', description: String(editorConfig().get<number>('fontSize', 14)), run: chooseFontSize },
                { label: 'Reset', description: 'Use your normal editor font', run: resetFont }
            ],
            { title: 'Font Palette', placeHolder: 'Only changes FASM files. A font must be installed to appear.' }
        );
        await choice?.run();
    });
}
