import type { ConvertedNumber } from './types';

export function parseFasmNumber(text: string): bigint | undefined {
    const value = text.trim().replace(/[_']/g, '');
    const lower = value.toLowerCase();

    if (/^0x[0-9a-f]+$/.test(lower)) {
        return BigInt(lower);
    }
    if (/^\$[0-9a-f]+$/.test(lower)) {
        return BigInt(`0x${lower.slice(1)}`);
    }
    if (/^[0-9][0-9a-f]*h$/.test(lower)) {
        return BigInt(`0x${lower.slice(0, -1)}`);
    }
    if (/^[01]+b$/.test(lower)) {
        return BigInt(`0b${lower.slice(0, -1)}`);
    }
    if (/^[0-7]+[oq]$/.test(lower)) {
        return BigInt(`0o${lower.slice(0, -1)}`);
    }
    if (/^[0-9]+d?$/.test(lower)) {
        return BigInt(lower.replace(/d$/, ''));
    }
    return undefined;
}

export function numberAt(line: string, character: number): string | undefined {
    for (const match of line.matchAll(/(?<![\w.$])(?:\$[0-9a-fA-F][\w']*|[0-9][\w']*)/g)) {
        if (character >= match.index && character <= match.index + match[0].length) {
            return match[0];
        }
    }
    return undefined;
}

export function convertNumber(text: string): ConvertedNumber | undefined {
    const value = parseFasmNumber(text);
    if (value === undefined) {
        return undefined;
    }

    const hex = value.toString(16).toUpperCase();
    return {
        decimal: value.toString(10),
        hex: `${/^[A-F]/.test(hex) ? '0' : ''}${hex}h`,
        binary: `${value.toString(2)}b`,
        octal: `${value.toString(8)}o`
    };
}
