import * as vscode from 'vscode';
import { OLD_THEME_NAME } from './constants/colorPalette';

const SHOWN_KEY = 'fasm.oldThemeNoticeShown';

export function usesOldTheme(theme: string | undefined): boolean {
    return theme === OLD_THEME_NAME;
}

export function offerThemeReplacement(context: vscode.ExtensionContext): void {
    const theme = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');
    if (!usesOldTheme(theme) || context.globalState.get<boolean>(SHOWN_KEY)) {
        return;
    }

    void context.globalState.update(SHOWN_KEY, true);
    void vscode.window.showInformationMessage(
        `${OLD_THEME_NAME} has been removed from FASM Highlight. FASM Colors gives FASM files similar colours without changing the rest of your editor.`,
        'Use FASM Colors',
        'Choose a Theme'
    ).then((choice) => {
        if (choice === 'Use FASM Colors') {
            void vscode.commands.executeCommand('fasm.setPalette', 'auto');
        } else if (choice === 'Choose a Theme') {
            void vscode.commands.executeCommand('workbench.action.selectTheme');
        }
    });
}
