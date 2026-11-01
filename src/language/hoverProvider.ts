import * as path from 'path';
import * as vscode from 'vscode';
import { SourceAnalysis } from '../architecture/analysis';
import { analyzeDocument } from '../architecture/documentAnalysis';
import { HoverEntry, PlatformContext, findHoverEntry } from '../data/hoverEntries';
import { manualUrl } from '../data/manual';

export class FasmHoverProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
        const range = document.getWordRangeAtPosition(position, /[@.]?[A-Za-z_][A-Za-z0-9_]*|@@|@[bfr]/);
        if (!range) {
            return undefined;
        }

        if (isInCommentOrString(document.lineAt(position.line).text, range.start.character)) {
            return undefined;
        }

        const rawToken = document.getText(range);
        const lookupToken = normalizeHoverToken(rawToken);
        if (!lookupToken) {
            return undefined;
        }

        const entry = findEntryForArchitecture(lookupToken, analyzeDocument(document));
        if (!entry) {
            return undefined;
        }

        const platformContext = detectPlatformContext(document.getText());
        return new vscode.Hover(buildHoverMarkdown(entry, platformContext), range);
    }
}

// x86 text must not appear on another architecture's instruction, even when the name is the same.
export function findEntryForArchitecture(token: string, analysis: SourceAnalysis): HoverEntry | undefined {
    const { architecture, scanned } = analysis;
    if (architecture.id !== 'x86') {
        if (architecture.instructions.has(token)) {
            return { symbol: token, category: 'Instruction', summary: `${architecture.label} instruction.` };
        }
        if (architecture.registers.has(token)) {
            return { symbol: token, category: 'Register', summary: `${architecture.label} register.` };
        }
    }

    const macro = scanned.get(token);
    if (macro) {
        return { symbol: macro.name, category: 'Macro helper', summary: `Defined in ${path.basename(macro.file)}, line ${macro.line}.` };
    }

    const entry = findHoverEntry(token);
    if (architecture.id !== 'x86' && (entry?.category === 'Instruction' || entry?.category === 'Register')) {
        return undefined;
    }
    return entry;
}

export function normalizeHoverToken(token: string): string | undefined {
    // Tokens starting with a dot are local labels, even when named like an instruction.
    if (token === '@@' || /^@[bfr]$/i.test(token) || token.startsWith('.')) {
        return undefined;
    }

    return token.toLowerCase();
}

export function isInCommentOrString(line: string, character: number): boolean {
    let quote: string | undefined;
    for (let index = 0; index < character && index < line.length; index += 1) {
        const current = line[index];
        if (quote) {
            quote = current === quote ? undefined : quote;
        } else if (current === ';') {
            return true;
        } else if (current === "'" || current === '"') {
            quote = current;
        }
    }
    return quote !== undefined;
}

export function buildHoverMarkdown(entry: HoverEntry, platformContext: PlatformContext): vscode.MarkdownString {
    const markdown = new vscode.MarkdownString(undefined, true);
    markdown.appendMarkdown(`**${entry.symbol}**`);
    markdown.appendMarkdown(`  \n*${entry.category}*`);
    markdown.appendMarkdown(`\n\n${entry.summary}`);

    if (entry.syntax) {
        markdown.appendMarkdown(`\n\n**Syntax**\n`);
        markdown.appendCodeblock(entry.syntax, 'fasm');
    }

    if (entry.notes && entry.notes.length > 0) {
        markdown.appendMarkdown('\n**Notes**');
        for (const note of entry.notes) {
            markdown.appendMarkdown(`\n- ${note}`);
        }
    }

    const platformNotes = entry.platformNotes?.[platformContext];
    if (platformNotes && platformNotes.length > 0) {
        markdown.appendMarkdown(`\n\n**Platform Note (${platformLabel(platformContext)})**`);
        for (const note of platformNotes) {
            markdown.appendMarkdown(`\n- ${note}`);
        }
    }

    if (entry.example) {
        markdown.appendMarkdown(`\n\n**Example**\n`);
        markdown.appendCodeblock(entry.example, 'fasm');
    }

    if (entry.section) {
        markdown.appendMarkdown(`\n\n[Manual section ${entry.section}](${manualUrl(entry.section)})`);
    }

    markdown.isTrusted = false;
    return markdown;
}

export function detectPlatformContext(text: string): PlatformContext {
    if (/^\s*format\s+PE(?:64)?\b/im.test(text)) {
        return 'pe';
    }

    if (/^\s*format\s+ELF64\b/im.test(text)) {
        return 'elf64';
    }

    if (/^\s*format\s+ELF\b/im.test(text)) {
        return 'elf32';
    }

    if (/^\s*format\s+MZ\b/im.test(text)) {
        return 'mz';
    }

    return 'generic';
}

function platformLabel(platformContext: PlatformContext): string {
    switch (platformContext) {
        case 'pe':
            return 'PE';
        case 'elf32':
            return 'ELF32';
        case 'elf64':
            return 'ELF64';
        case 'mz':
            return 'MZ';
        default:
            return 'Generic';
    }
}
