export interface ConvertedNumber {
    readonly decimal: string;
    readonly hex: string;
    readonly binary: string;
    readonly octal: string;
}

// Reads the number forms in the fasm manual, such as 255, 0FFh, 0xFF, $FF, 11111111b and 377o.
export function parseFasmNumber(text: string): bigint | undefined {
    const value = text.trim().replace(/_/g, '');
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
