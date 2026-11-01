import * as vscode from 'vscode';

import { convertNumber, numberAt } from '../tools/numberConverter';
import type { ConvertedNumber } from '../tools/types';

const COPY_COMMAND = 'fasm.copyValue';

export function numberValuesText(text: string, number: ConvertedNumber): string {
    const values = [number.decimal, number.hex, number.binary, number.octal].map((value) => {
        const query = encodeURIComponent(JSON.stringify([value]));
        return `[\`${value}\`](command:${COPY_COMMAND}?${query} "Copy")`;
    });
    return `**${text}** = ${values.join(' &nbsp; ')}`;
}

export function numberHover(line: string, character: number): vscode.MarkdownString | undefined {
    const text = numberAt(line, character);
    const number = text ? convertNumber(text) : undefined;
    if (!text || !number) {
        return undefined;
    }
    const markdown = new vscode.MarkdownString(numberValuesText(text, number));
    markdown.supportHtml = true;
    markdown.isTrusted = { enabledCommands: [COPY_COMMAND] };
    return markdown;
}

export function registerCopyCommand(): vscode.Disposable {
    return vscode.commands.registerCommand(COPY_COMMAND, async (value: string) => {
        await vscode.env.clipboard.writeText(String(value));
        void vscode.window.setStatusBarMessage(`Copied ${value}`, 2000);
    });
}
