// Minimal stand-in for the editor API, so pure logic can be tested without launching an editor.

export class MarkdownString {
    value: string;
    isTrusted = true;

    constructor(value = '') {
        this.value = value;
    }

    appendMarkdown(text: string): this {
        this.value += text;
        return this;
    }

    appendCodeblock(code: string, language = ''): this {
        this.value += `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
        return this;
    }
}

export class Hover {
    constructor(public readonly contents: MarkdownString, public readonly range?: unknown) {}
}

export class SemanticTokensLegend {
    constructor(public readonly tokenTypes: string[]) {}
}

export const workspace = {
    getConfiguration: () => ({
        get: <T>(_key: string, fallback: T): T => fallback
    })
};
