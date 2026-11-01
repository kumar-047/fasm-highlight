import * as vscode from 'vscode';
import { analyzeDocument } from '../architecture/documentAnalysis';
import type { SourceAnalysis } from '../architecture/types';
import { maskCommentsAndStrings } from '../shared/sourceText';
import { FASMG_OPERATORS, MACRO_DEFINITION, TOKEN_TYPES } from './constants/keywords';
import type { SemanticToken, SemanticType } from './types';

function localMacros(text: string): Set<string> {
    return new Set([...text.matchAll(MACRO_DEFINITION)].map((match) => match[1].toLowerCase()));
}

export function computeSemanticTokens(text: string, analysis: SourceAnalysis): SemanticToken[] {
    const tokens: SemanticToken[] = [];
    const { architecture, dialect, scanned } = analysis;
    const macros = localMacros(text);

    text.split(/\r?\n/).forEach((rawLine, line) => {
        const code = maskCommentsAndStrings(rawLine);
        const isDefinition = /^\s*(?:macro|struc|calminstruction)\b/i.test(code);
        let position = 0;
        for (const match of code.matchAll(/[A-Za-z_.][\w.]*/g)) {
            const word = match[0].toLowerCase();
            const previous = code[match.index - 1];
            const isLabel = code[match.index + word.length] === ':';
            const add = (type: SemanticType) => tokens.push({ line, character: match.index, length: word.length, type });

            if (isLabel && position === 0) {
                continue;
            }
            if (previous !== '.' && previous !== '@' && !isDefinition) {
                if (position <= 1 && macros.has(word)) {
                    add('function');
                } else if (position === 0) {
                    if ((architecture.id !== 'x86' && architecture.instructions.has(word)) || scanned.has(word)) {
                        add('keyword');
                    }
                } else if (architecture.registers.has(word)) {
                    add('variable');
                } else if (dialect === 'fasmg' && FASMG_OPERATORS.has(word)) {
                    add('operator');
                }
            }
            position += 1;
        }
    });

    return tokens;
}

export const semanticLegend = new vscode.SemanticTokensLegend([...TOKEN_TYPES]);

export class FasmSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    provideDocumentSemanticTokens(document: vscode.TextDocument): vscode.SemanticTokens {
        const builder = new vscode.SemanticTokensBuilder(semanticLegend);
        for (const token of computeSemanticTokens(document.getText(), analyzeDocument(document))) {
            builder.push(token.line, token.character, token.length, TOKEN_TYPES.indexOf(token.type));
        }
        return builder.build();
    }
}
