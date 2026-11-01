import { commentStart, maskCommentsAndStrings } from './sourceText';

export interface FormatOptions {
    readonly indent: string;
    // 0 keeps the existing spacing before comments.
    readonly commentColumn: number;
    readonly isInstruction: (word: string) => boolean;
}

// The same block rules as language-configuration.json, which test/formatter.test.ts checks.
export const BLOCK_START = /^\s*(?:[\w.?$@]+:\s*)?(?:(?:if|while|repeat|virtual|proc|struct)\b|data\b(?!\s*(?::|=|d[bwdqtpfu]\b|r[bwdqtpf]\b|equ\b))|[^;]*\{\s*(?:;.*)?$)/;
export const BLOCK_END = /^\s*(?:end\s+\w+|endp\b|ends\b|\})/;
const BLOCK_MIDDLE = /^\s*else\b/;

// Only whitespace outside strings ever changes, so the assembled output stays the same.
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
