import { commentStart, maskCommentsAndStrings } from '../shared/sourceText';
import { BLOCK_END, BLOCK_MIDDLE, BLOCK_START, BRACELESS_BLOCK, CALM_END, CALM_START, LABEL_ONLY } from './constants/blockPatterns';
import type { FormatOptions } from './types';

function nextCodeStartsWithBrace(lines: readonly string[], index: number): boolean {
    for (let next = index + 1; next < lines.length; next += 1) {
        const code = maskCommentsAndStrings(lines[next]).trim();
        if (code) {
            return code.startsWith('{');
        }
    }
    return false;
}

function opensBlock(masked: string, lines: readonly string[], index: number, insideCalm: boolean): boolean {
    if (insideCalm) {
        return false;
    }
    if (BLOCK_START.test(masked)) {
        return true;
    }
    return BRACELESS_BLOCK.test(masked) && !masked.includes('{') && !nextCodeStartsWithBrace(lines, index);
}

function addSpaceAfterCommas(code: string): string {
    const masked = maskCommentsAndStrings(code);
    let result = '';
    for (let index = 0; index < code.length; index += 1) {
        result += code[index];
        if (masked[index] === ',' && index + 1 < code.length && !/\s/.test(code[index + 1])) {
            result += ' ';
        }
    }
    return result;
}

function pad(width: number, column: number): string {
    return ' '.repeat(Math.max(column - width, 1));
}

function limitBlankLines(lines: readonly string[], maximum: number): string[] {
    let blanks = 0;
    return lines.filter((line) => {
        blanks = line === '' ? blanks + 1 : 0;
        return blanks <= maximum;
    });
}

export function formatFasmSource(text: string, options: FormatOptions): string {
    const lineEnding = text.includes('\r\n') ? '\r\n' : '\n';
    const source = text.split(/\r?\n/);
    let depth = 0;
    let continuesPrevious = false;
    let insideCalm = false;

    const lines = source.map((line, index) => {
        const masked = maskCommentsAndStrings(line);
        if (continuesPrevious) {
            continuesPrevious = masked.trimEnd().endsWith('\\');
            return line.trimEnd();
        }
        continuesPrevious = masked.trimEnd().endsWith('\\');

        const commentIndex = commentStart(line);
        const rawCode = line.slice(0, commentIndex).trim();
        const code = options.spaceAfterComma ? addSpaceAfterCommas(rawCode) : rawCode;
        const comment = line.slice(commentIndex).trimEnd();
        if (!code && !comment) {
            return '';
        }

        const endsCalm = CALM_END.test(masked);
        const closes = insideCalm ? endsCalm : BLOCK_END.test(masked);
        if (closes) {
            depth = Math.max(depth - 1, 0);
        }
        if (endsCalm) {
            insideCalm = false;
        }

        const firstWord = /^[^\s,:;]+/.exec(code)?.[0] ?? '';
        const isInstruction = options.isInstruction(firstWord.toLowerCase());
        const outdented = LABEL_ONLY.test(code) || (!insideCalm && BLOCK_MIDDLE.test(masked));

        let level = depth;
        if (outdented) {
            level = Math.max(depth - 1, 0);
        } else if (isInstruction || (!code && /^\s/.test(line))) {
            level = Math.max(depth, 1);
        }

        const indent = options.indent.repeat(level);
        const operands = code.slice(firstWord.length).trimStart();
        const statement = isInstruction && operands
            ? `${firstWord}${options.operandColumn > 0 ? pad(indent.length + firstWord.length, options.operandColumn) : ' '}${operands}`
            : code;

        if (!closes && opensBlock(masked, source, index, insideCalm)) {
            depth += 1;
        }
        if (CALM_START.test(masked)) {
            insideCalm = true;
        }

        if (!comment) {
            return `${indent}${statement}`;
        }
        if (!statement) {
            return `${indent}${comment}`;
        }
        const width = indent.length + statement.length;
        const gap = options.commentColumn > 0
            ? pad(width, options.commentColumn)
            : /[ \t]*$/.exec(line.slice(0, commentIndex))?.[0] || ' ';
        return `${indent}${statement}${gap}${comment}`;
    });

    return (options.maxBlankLines > 0 ? limitBlankLines(lines, options.maxBlankLines) : lines).join(lineEnding);
}
