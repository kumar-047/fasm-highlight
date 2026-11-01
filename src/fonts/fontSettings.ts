export function validateFontSize(value: string): string | undefined {
    const size = Number(value);
    return Number.isInteger(size) && size >= 6 && size <= 72 ? undefined : 'Enter a whole number from 6 to 72.';
}
