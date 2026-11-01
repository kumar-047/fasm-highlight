import * as path from 'node:path';
import { ARCHITECTURES } from './constants/architectures';
import { ARCHITECTURE_INCLUDES, ARM_SOURCE, FASMG_SOURCE, INCLUDE_LINE, MAX_FILE_LENGTH, MAX_INCLUDE_FILES, X86_G_INCLUDES } from './constants/includePatterns';
import type { ArchitectureId, ReadFile, ScannedSymbol, SourceAnalysis } from './types';

function includesOf(text: string): string[] {
    return [...text.matchAll(INCLUDE_LINE)].map((match) => match[2].replace(/\\/g, '/'));
}

function resolveInclude(name: string, fromDirectory: string, includePaths: readonly string[], read: ReadFile): { file: string; text: string } | undefined {
    for (const directory of [fromDirectory, ...includePaths]) {
        const file = path.resolve(directory, name);
        const text = read(file);
        if (text !== undefined && text.length <= MAX_FILE_LENGTH) {
            return { file, text };
        }
    }
    return undefined;
}

function scanSymbols(text: string, file: string, found: Map<string, ScannedSymbol>): void {
    text.split(/\r?\n/).forEach((rawLine, index) => {
        const line = rawLine.replace(/;.*$/, '');
        const definition = /^\s*(?:macro|calminstruction)\s+([A-Za-z_][\w.]*)[?!:]*/i.exec(line);
        if (definition) {
            addSymbol(definition[1], file, index + 1, found);
        }
        const iterated = /^\s*iterate\s+<[^>]+>\s*,\s*(.+)$/i.exec(line) ?? /^\s*iterate\s+[A-Za-z_]\w*\s*,\s*(.+)$/i.exec(line);
        if (iterated && /^\s*macro\s+\w+\??/im.test(text)) {
            for (const item of iterated[1].split(',')) {
                const word = item.replace(/[<>\\]/g, '').trim();
                if (/^[A-Za-z_]{2,}$/.test(word)) {
                    addSymbol(word, file, index + 1, found);
                }
            }
        }
    });
}

function addSymbol(name: string, file: string, line: number, found: Map<string, ScannedSymbol>): void {
    const key = name.toLowerCase();
    if (!found.has(key) && !key.includes('.')) {
        found.set(key, { name, file, line });
    }
}

export function analyzeSource(
    text: string,
    filePath: string,
    read: ReadFile,
    includePaths: readonly string[] = [],
    override: ArchitectureId | undefined = undefined
): SourceAnalysis {
    const seen = new Set<string>([path.resolve(filePath)]);
    const pending: { text: string; file: string }[] = [{ text, file: path.resolve(filePath) }];
    const scanned = new Map<string, ScannedSymbol>();
    const texts: string[] = [];
    let detected: ArchitectureId | undefined;
    let isFasmg = false;

    while (pending.length > 0 && seen.size <= MAX_INCLUDE_FILES) {
        const current = pending.shift() as { text: string; file: string };
        texts.push(current.text);
        isFasmg = isFasmg || FASMG_SOURCE.test(current.text);
        if (current.file !== path.resolve(filePath)) {
            scanSymbols(current.text, current.file, scanned);
        }

        for (const name of includesOf(current.text)) {
            const base = path.posix.basename(name);
            const match = ARCHITECTURE_INCLUDES.find(([pattern]) => pattern.test(base));
            if (match && !detected) {
                detected = match[1];
            }
            if (X86_G_INCLUDES.test(base)) {
                isFasmg = true;
                detected = detected ?? 'x86';
            }
            const resolved = resolveInclude(name, path.dirname(current.file), includePaths, read);
            if (resolved && !seen.has(resolved.file)) {
                seen.add(resolved.file);
                pending.push(resolved);
            }
        }
    }

    if (!detected && ARM_SOURCE.test(text)) {
        detected = 'arm';
    }
    if (!detected) {
        detected = isFasmg && scanned.size > 0 ? 'other' : 'x86';
    }

    const id = override ?? detected;
    const usesFasmg = isFasmg || (id !== 'x86' && id !== 'arm');
    return {
        dialect: usesFasmg ? 'fasmg' : 'fasm',
        architecture: ARCHITECTURES[id],
        scanned: id === 'x86' ? new Map() : scanned,
        combinedText: texts.join('\n')
    };
}
