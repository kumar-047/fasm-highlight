import * as vscode from 'vscode';
import { SourceAnalysis } from '../architecture/analysis';
import { analyzeDocument } from '../architecture/documentAnalysis';
import { maskCommentsAndStrings } from './sourceText';

export type SemanticType = 'keyword' | 'variable' | 'macro';

export interface SemanticToken {
    readonly line: number;
    readonly character: number;
    readonly length: number;
    readonly type: SemanticType;
}

const TOKEN_TYPES: readonly SemanticType[] = ['keyword', 'variable', 'macro'];

const FASMG_DIRECTIVES = new Set((
    'iterate indx calminstruction namespace rawmatch rmatch reequ redefine mvmacro mvstruc emit dbx '
    + 'restartout outscope esc retaincomments removecomments isolatelines combinelines'
).split(' '));
const CALM_COMMANDS = new Set((
    'arrange assemble call check compute exit jno jump jyes local match publish rawmatch rmatch stringify take taketext transform'
).split(' '));

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
