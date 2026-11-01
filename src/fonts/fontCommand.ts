import * as vscode from 'vscode';

import { settingsTarget } from '../shared/settingsTarget';

const DEFAULT_FONT_SIZE = 14;

function fontConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('editor', { languageId: 'fasm' });
}

export function currentFontFamily(): string {
    return fontConfig().get<string>('fontFamily', '');
}

export function currentFontSize(): number {
    return fontConfig().get<number>('fontSize', DEFAULT_FONT_SIZE);
}

export async function setFontFamily(family: string): Promise<void> {
    await fontConfig().update('fontFamily', family, settingsTarget(), true);
}

export async function setFontSize(size: number): Promise<void> {
    await fontConfig().update('fontSize', size, settingsTarget(), true);
}

export async function resetFont(): Promise<void> {
    await fontConfig().update('fontFamily', undefined, settingsTarget(), true);
    await fontConfig().update('fontSize', undefined, settingsTarget(), true);
}
