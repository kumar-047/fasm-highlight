// Replaces strings and comments with spaces, so word positions stay correct.
export function maskCommentsAndStrings(line: string): string {
    let result = '';
    let quote: string | undefined;
    for (const character of line) {
        if (quote) {
            quote = character === quote ? undefined : quote;
            result += ' ';
        } else if (character === ';') {
            return result.padEnd(line.length);
        } else if (character === "'" || character === '"') {
            quote = character;
            result += ' ';
        } else {
            result += character;
        }
    }
    return result;
}

// Where the comment starts, or the line length when there is none.
export function commentStart(line: string): number {
    let quote: string | undefined;
    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (quote) {
            quote = character === quote ? undefined : quote;
        } else if (character === ';') {
            return index;
        } else if (character === "'" || character === '"') {
            quote = character;
        }
    }
    return line.length;
}
