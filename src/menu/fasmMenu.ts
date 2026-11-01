import * as vscode from 'vscode';

import { colorRoleValues, currentPalette, isColorsOn, registerColorCommands } from '../colors/colorCommands';
import { FONT_SIZE_DEFAULT, registerFontCommands } from '../fonts/fontCommand';
import { convertNumber, numberAt } from '../tools/numberConverter';
import { MENU_COMMANDS } from './constants/menuConstants';
import { buildColorCard, buildMainCard, numberValuesText } from './menuContent';
import type { MenuCard, MenuState } from './types';

export function menuMarkdown(text: string): vscode.MarkdownString {
    const markdown = new vscode.MarkdownString(text, true);
    markdown.supportHtml = true;
    markdown.isTrusted = { enabledCommands: [...MENU_COMMANDS] };
    return markdown;
}

export function numberHover(line: string, character: number): vscode.MarkdownString | undefined {
    const text = numberAt(line, character);
    const number = text ? convertNumber(text) : undefined;
    return text && number ? menuMarkdown(numberValuesText(text, number)) : undefined;
}

function selectedNumber(editor: vscode.TextEditor): string | undefined {
    const selected = editor.document.getText(editor.selection).trim();
    if (selected && convertNumber(selected)) {
        return selected;
    }
    const position = editor.selection.active;
    return numberAt(editor.document.lineAt(position.line).text, position.character);
}

function menuState(editor: vscode.TextEditor): MenuState {
    const fontConfig = vscode.workspace.getConfiguration('editor', { languageId: 'fasm' });
    const numberText = selectedNumber(editor);
    return {
        colorsOn: isColorsOn(),
        palette: currentPalette(),
        fontFamily: fontConfig.get<string>('fontFamily', ''),
        fontSize: fontConfig.get<number>('fontSize', FONT_SIZE_DEFAULT),
        numberText,
        number: numberText ? convertNumber(numberText) : undefined,
        roleColors: colorRoleValues()
    };
}

export class FasmMenu {
    private pending: { readonly card: MenuCard; readonly uri: string; readonly state: MenuState } | undefined;

    takeCard(document: vscode.TextDocument): vscode.MarkdownString | undefined {
        const pending = this.pending;
        if (!pending || pending.uri !== document.uri.toString()) {
            return undefined;
        }
        this.pending = undefined;
        return menuMarkdown(pending.card === 'colors' ? buildColorCard(pending.state) : buildMainCard(pending.state));
    }

    private async show(card: MenuCard): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (editor?.document.languageId !== 'fasm') {
            return;
        }
        this.pending = { card, uri: editor.document.uri.toString(), state: menuState(editor) };
        await vscode.commands.executeCommand('editor.action.showHover');
    }

    register(): vscode.Disposable[] {
        const reopen = () => this.show('main');
        return [
            vscode.commands.registerCommand('fasm.openMenu', () => this.show('main')),
            vscode.commands.registerCommand('fasm.showColorCard', () => this.show('colors')),
            vscode.commands.registerCommand('fasm.copyValue', async (value: string) => {
                await vscode.env.clipboard.writeText(String(value));
                void vscode.window.setStatusBarMessage(`Copied ${value}`, 2000);
            }),
            vscode.commands.registerCommand('fasm.openSetting', (query: string) => vscode.commands.executeCommand('workbench.action.openSettings', query)),
            ...registerColorCommands(reopen, () => this.show('colors')),
            ...registerFontCommands(reopen)
        ];
    }
}
