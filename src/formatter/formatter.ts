import { commentStart, maskCommentsAndStrings } from '../shared/sourceText';
import { BLOCK_END, BLOCK_MIDDLE, BLOCK_START } from './constants/blockPatterns';
import type { FormatOptions } from './types';

export function formatFasmSource(text: string, options: FormatOptions): string {
    const lineEnding = text.includes('\r\n') ? '\r\n' : '\n';
    let depth = 0;
    let continuesPrevious = false;

    const lines = text.split(/\r?\n/).map((line) => {
        if (continuesPrevious) {
            continuesPrevious = maskCommentsAndStrings(line).trimEnd().endsWith('\\');
            return line.trimEnd();
        }

        const commentIndex = commentStart(line);
        const code = line.slice(0, commentIndex).trim();
        const comment = line.slice(commentIndex).trimEnd();
        const masked = maskCommentsAndStrings(line);
        continuesPrevious = masked.trimEnd().endsWith('\\');

        if (!code && !comment) {
            return '';
        }

        const closes = BLOCK_END.test(masked);
        if (closes) {
            depth = Math.max(depth - 1, 0);
        }

        const firstWord = /^[^\s,:;]+/.exec(code)?.[0] ?? '';
        const isInstruction = options.isInstruction(firstWord.toLowerCase());
        const level = BLOCK_MIDDLE.test(masked) ? Math.max(depth - 1, 0) : depth + (isInstruction ? 1 : 0);
        const indent = options.indent.repeat(level);
        const statement = isInstruction ? `${firstWord}${code.slice(firstWord.length).replace(/^[ \t]+/, ' ')}` : code;

        if (!closes && BLOCK_START.test(masked)) {
            depth += 1;
        }

        if (!comment) {
            return `${indent}${statement}`;
        }
        if (!statement) {
            return `${indent}${comment}`;
        }
        return `${indent}${statement}${commentGap(line, commentIndex, indent.length + statement.length, options.commentColumn)}${comment}`;
    });

    return lines.join(lineEnding);
}

function commentGap(line: string, commentIndex: number, width: number, commentColumn: number): string {
    if (commentColumn > 0) {
        return ' '.repeat(Math.max(commentColumn - width, 1));
    }
    return /[ \t]*$/.exec(line.slice(0, commentIndex))?.[0] || ' ';
}
