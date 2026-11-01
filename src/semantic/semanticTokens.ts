import * as vscode from 'vscode';
import { analyzeDocument } from '../architecture/documentAnalysis';
import type { SourceAnalysis } from '../architecture/types';
import { maskCommentsAndStrings } from '../shared/sourceText';
import { CALM_COMMANDS, FASMG_DIRECTIVES, TOKEN_TYPES } from './constants/keywords';
import type { SemanticToken, SemanticType } from './types';

export function computeSemanticTokens(text: string, analysis: SourceAnalysis): SemanticToken[] {
    const tokens: SemanticToken[] = [];
    const { architecture, dialect, scanned } = analysis;
    const instructionsUseList = architecture.id !== 'x86';
    let insideCalm = false;

    text.split(/\r?\n/).forEach((rawLine, line) => {
        const code = maskCommentsAndStrings(rawLine);
        let isFirst = true;
        for (const match of code.matchAll(/[A-Za-z_.][\w.]*/g)) {
            const word = match[0].toLowerCase();
            const previous = code[match.index - 1];
            const isLabel = code[match.index + word.length] === ':';
            const add = (type: SemanticType) => tokens.push({ line, character: match.index, length: word.length, type });

            if (isLabel && isFirst) {
                continue;
            }
            if (previous !== '.' && previous !== '@') {
                if (isFirst) {
                    if (word === 'calminstruction') {
                        insideCalm = true;
                    }
                    if (dialect === 'fasmg' && (FASMG_DIRECTIVES.has(word) || (insideCalm && CALM_COMMANDS.has(word)))) {
                        add('macro');
                    } else if (instructionsUseList && architecture.instructions.has(word)) {
                        add('keyword');
                    } else if (scanned.has(word)) {
                        add('keyword');
                    }
                } else if (architecture.registers.has(word)) {
                    add('variable');
                }
            }
            isFirst = false;
        }
        if (/^\s*end\s+calminstruction\b/i.test(code)) {
            insideCalm = false;
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
