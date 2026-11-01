import { INSTRUCTION_OR_OPERATOR_WORDS, SYMBOL_GROUPS, SymbolGroup, symbolGroupById } from '../data/symbols';

// Builds syntaxes/fasm.tmLanguage.json. Word lists come from src/data/symbols.ts; run `npm run compile` after changing them.

const WORD_START = '(?<![\\w.@$?])';
const WORD_END = '(?![\\w.@$?])';
const STATEMENT_START = '(?:^\\s*|(?<=[:{])\\s*)';
// A word followed by one of these is being used as a name, such as "stack dd 0".
const NOT_A_DEFINITION = '(?!\\s*[:=]|\\s+(?:d[bwdqtpfu]|r[bwdqtpf]|equ|fix|label)\\b)';

interface GrammarRule {
    readonly name?: string;
    readonly match?: string;
    readonly begin?: string;
    readonly end?: string;
    readonly captures?: Record<string, { readonly name: string }>;
    readonly beginCaptures?: Record<string, { readonly name: string }>;
    readonly patterns?: readonly (GrammarRule | { readonly include: string })[];
}

function alternatives(words: readonly string[]): string {
    return [...words].sort().join('|');
}

function wordRule(name: string, words: readonly string[]): GrammarRule {
    return { name, match: `(?i)${WORD_START}(?:${alternatives(words)})${WORD_END}` };
}

function groupRule(group: SymbolGroup): GrammarRule {
    const words = group.words.filter((word) => !INSTRUCTION_OR_OPERATOR_WORDS.includes(word));
    return wordRule(group.scope, words);
}

function rulesFor(prefix: string): GrammarRule[] {
    return SYMBOL_GROUPS
        .filter((group) => group.context === 'anywhere' && group.id.startsWith(prefix))
        .map(groupRule);
}

function formatLine(words: string, scope: string, extra: readonly GrammarRule[] = []): GrammarRule {
    return {
        begin: `(?i)${STATEMENT_START}(${words})${WORD_END}${NOT_A_DEFINITION}`,
        end: '$',
        beginCaptures: { 1: { name: scope } },
        patterns: [
            { include: '#comments' },
            ...extra,
            { include: '#strings' },
            { include: '#format-keywords' },
            { include: '#numbers' },
            { include: '#operators' }
        ]
    };
}

export function buildGrammar(): object {
    const logicalScope = symbolGroupById('mnemonic.logical').scope;
    const operatorScope = symbolGroupById('operator.word').scope;
    const statementGroup = symbolGroupById('directive.statement');
    const lockScope = symbolGroupById('mnemonic.misc').scope;
    const ambiguous = alternatives(INSTRUCTION_OR_OPERATOR_WORDS);

    return {
        $schema: 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
        name: 'FASM',
        scopeName: 'source.fasm',
        patterns: [
            { include: '#comments' },
            { include: '#format-lines' },
            { include: '#strings' },
            { include: '#labels' },
            { include: '#statement-words' },
            { include: '#directives' },
            { include: '#macro-helpers' },
            { include: '#instructions' },
            { include: '#registers' },
            { include: '#numbers' },
            { include: '#operators' },
            { include: '#data' }
        ],
        repository: {
            comments: {
                patterns: [{ name: 'comment.line.semicolon.fasm', match: ';.*$' }]
            },
            strings: {
                patterns: [
                    { name: 'string.quoted.double.fasm', begin: '"', end: '"|$' },
                    { name: 'string.quoted.single.fasm', begin: "'", end: "'|$" }
                ]
            },
            'format-lines': {
                patterns: [
                    formatLine('format', 'keyword.control.directive.format.fasm'),
                    formatLine('section|segment', 'keyword.control.directive.section.fasm', [
                        { name: 'entity.name.section.fasm', match: "'[^']*'" }
                    ]),
                    formatLine('data', 'keyword.control.directive.statement.fasm')
                ]
            },
            'format-keywords': {
                patterns: [groupRule(symbolGroupById('format.keyword'))]
            },
            labels: {
                patterns: [
                    { name: 'entity.name.label.anonymous.fasm', match: '^\\s*@@:' },
                    { name: 'entity.name.label.local.fasm', match: '^\\s*\\.[A-Za-z_?][\\w.?$@]*:' },
                    { name: 'entity.name.label.fasm', match: '^\\s*[A-Za-z_?][\\w.?$@]*:' },
                    { name: 'keyword.control.label-reference.fasm', match: '(?i)(?<![\\w@.])@[bfr]\\b' }
                ]
            },
            'statement-words': {
                patterns: [
                    {
                        match: `(?i)${STATEMENT_START}(end)\\s+(data)${WORD_END}`,
                        captures: { 1: { name: statementGroup.scope }, 2: { name: statementGroup.scope } }
                    },
                    {
                        match: `(?i)${STATEMENT_START}(${alternatives(statementGroup.words)})${WORD_END}${NOT_A_DEFINITION}`,
                        captures: { 1: { name: statementGroup.scope } }
                    },
                    {
                        match: `(?i)${STATEMENT_START}(${ambiguous})${WORD_END}`,
                        captures: { 1: { name: logicalScope } }
                    },
                    {
                        match: `(?i)${WORD_START}(lock)\\s+(${ambiguous})${WORD_END}`,
                        captures: { 1: { name: lockScope }, 2: { name: logicalScope } }
                    }
                ]
            },
            directives: { patterns: rulesFor('directive.') },
            'macro-helpers': { patterns: rulesFor('macro-helper') },
            instructions: { patterns: rulesFor('mnemonic.') },
            registers: { patterns: rulesFor('register.') },
            numbers: {
                patterns: [
                    {
                        name: 'constant.numeric.hex.fasm',
                        match: `${WORD_START}(?:0[xX][0-9a-fA-F_]+|[0-9][0-9a-fA-F_]*[hH]|\\$[0-9a-fA-F][0-9a-fA-F_]*)${WORD_END}`
                    },
                    {
                        name: 'constant.numeric.float.fasm',
                        match: `${WORD_START}(?:\\d+\\.\\d+(?:[eE][+-]?\\d+)?|\\d+[eE][+-]?\\d+|\\d+[fF])${WORD_END}`
                    },
                    { name: 'constant.numeric.binary.fasm', match: `${WORD_START}(?:0[bB][01_]+|[01][01_]*[bB])${WORD_END}` },
                    { name: 'constant.numeric.octal.fasm', match: `${WORD_START}(?:0[oO][0-7_]+|[0-7][0-7_]*[oOqQ])${WORD_END}` },
                    { name: 'constant.numeric.decimal.fasm', match: `${WORD_START}[0-9][0-9_]*[dD]?${WORD_END}` }
                ]
            },
            operators: {
                patterns: [
                    { name: 'keyword.operator.special.fasm', match: '\\$|#|`|%' },
                    wordRule(operatorScope, [...symbolGroupById('operator.word').words, ...INSTRUCTION_OR_OPERATOR_WORDS]),
                    { name: 'keyword.operator.arithmetic.fasm', match: '\\+|-|\\*|/' }
                ]
            },
            data: { patterns: rulesFor('data.') }
        }
    };
}
