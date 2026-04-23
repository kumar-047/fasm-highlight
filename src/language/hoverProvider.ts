import * as vscode from 'vscode';
import { HoverEntry, PlatformContext, hoverEntries } from '../data/fasmReferenceData';

export class FasmHoverProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
        const range = document.getWordRangeAtPosition(position, /[@.]?[A-Za-z_][A-Za-z0-9_]*|@@|@[bfr]/);
        if (!range) {
            return undefined;
        }

        const rawToken = document.getText(range);
        const lookupToken = normalizeHoverToken(rawToken);
        if (!lookupToken) {
            return undefined;
        }

        const entry = hoverEntries.get(lookupToken);
        if (!entry) {
            return undefined;
        }

        const platformContext = detectPlatformContext(document);
        return new vscode.Hover(buildHoverMarkdown(entry, platformContext), range);
    }
}

function normalizeHoverToken(token: string): string | undefined {
    if (token === '@@' || /^@[bfr]$/i.test(token)) {
        return undefined;
    }

    const trimmed = token.startsWith('.') ? token.slice(1) : token;
    return trimmed.toLowerCase();
}

function buildHoverMarkdown(entry: HoverEntry, platformContext: PlatformContext): vscode.MarkdownString {
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

    if (entry.referenceSource) {
        markdown.appendMarkdown(`\n\n**Local Reference**\n- \`${entry.referenceSource}\``);
    }

    markdown.isTrusted = false;
    return markdown;
}

function detectPlatformContext(document: vscode.TextDocument): PlatformContext {
    const text = document.getText();

    if (/^\s*format\s+PE64?\b/im.test(text)) {
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
