// FASM-only text colours. Every rule names `.fasm` scopes, so other languages are never affected.

export interface ColorRule {
    readonly name: string;
    readonly scope: readonly string[];
    readonly settings: { readonly foreground: string; readonly fontStyle?: string };
}

export type TokenColorCustomizations = Record<string, unknown> & { textMateRules?: unknown };

export type ColorRole = 'comment' | 'string' | 'label' | 'section' | 'data' | 'directive' | 'helper' | 'instruction' | 'register' | 'number' | 'operator';

export type ColorOverrides = Partial<Record<ColorRole, string>>;

export const COLOR_ROLES: readonly ColorRole[] = ['instruction', 'register', 'directive', 'data', 'helper', 'label', 'section', 'number', 'string', 'comment', 'operator'];

const ROLE_LABELS: Readonly<Record<ColorRole, string>> = {
    comment: 'Comments',
    string: 'Strings',
    label: 'Labels',
    section: 'Section names',
    data: 'Data and sizes',
    directive: 'Directives',
    helper: 'Macro helpers',
    instruction: 'Instructions',
    register: 'Registers',
    number: 'Numbers',
    operator: 'Operators'
};

export function roleLabel(role: ColorRole): string {
    return ROLE_LABELS[role];
}

// These scopes come from semantic tokens rather than the grammar.
export const SEMANTIC_SCOPES = {
    keyword: 'keyword.other.mnemonic.arch.fasm',
    variable: 'variable.language.register.arch.fasm',
    macro: 'keyword.control.directive.fasmg.fasm'
} as const;

const SCOPES: Readonly<Record<ColorRole, readonly string[]>> = {
    comment: ['comment.line.semicolon.fasm'],
    string: ['string.quoted.single.fasm', 'string.quoted.double.fasm'],
    label: ['entity.name.label.fasm', 'entity.name.label.local.fasm', 'entity.name.label.anonymous.fasm', 'keyword.control.label-reference.fasm'],
    section: ['entity.name.section.fasm'],
    data: ['storage.type.data.fasm', 'storage.type.size.fasm'],
    directive: [
        'keyword.control.directive.structure.fasm',
        'keyword.control.directive.macro.fasm',
        'keyword.control.directive.include.fasm',
        'keyword.control.directive.constant.fasm',
        'keyword.control.directive.format.fasm',
        'keyword.control.directive.section.fasm',
        'keyword.control.directive.entry.fasm',
        'keyword.control.directive.addressing.fasm',
        'keyword.control.directive.conditional.fasm',
        'keyword.control.directive.repeat.fasm',
        'keyword.control.directive.linkage.fasm',
        'keyword.control.directive.other.fasm',
        'keyword.control.directive.statement.fasm',
        'keyword.other.format.fasm',
        SEMANTIC_SCOPES.macro
    ],
    helper: ['support.function.macro-helper.fasm'],
    instruction: [
        'keyword.other.mnemonic.data-movement.fasm',
        'keyword.other.mnemonic.arithmetic.fasm',
        'keyword.other.mnemonic.logical.fasm',
        'keyword.other.mnemonic.control-flow.fasm',
        'keyword.other.mnemonic.string.fasm',
        'keyword.other.mnemonic.flag.fasm',
        'keyword.other.mnemonic.conditional.fasm',
        'keyword.other.mnemonic.misc.fasm',
        'keyword.other.mnemonic.system.fasm',
        'keyword.other.mnemonic.fpu.fasm',
        'keyword.other.mnemonic.mmx.fasm',
        'keyword.other.mnemonic.sse.fasm',
        'keyword.other.mnemonic.avx.fasm',
        'keyword.other.mnemonic.extension.fasm',
        SEMANTIC_SCOPES.keyword
    ],
    register: [
        'variable.language.register.general.64bit.fasm',
        'variable.language.register.general.32bit.fasm',
        'variable.language.register.general.16bit.fasm',
        'variable.language.register.general.8bit.fasm',
        'variable.language.register.instruction-pointer.fasm',
        'variable.language.register.segment.fasm',
        'variable.language.register.control.fasm',
        'variable.language.register.debug.fasm',
        'variable.language.register.test.fasm',
        'variable.language.register.fpu.fasm',
        'variable.language.register.mmx.fasm',
        'variable.language.register.xmm.fasm',
        'variable.language.register.ymm.fasm',
        'variable.language.register.zmm.fasm',
        'variable.language.register.opmask.fasm',
        'variable.language.register.bounds.fasm',
        'variable.language.register.amx.fasm',
        SEMANTIC_SCOPES.variable
    ],
    number: [
        'constant.numeric.hex.fasm',
        'constant.numeric.float.fasm',
        'constant.numeric.binary.fasm',
        'constant.numeric.octal.fasm',
        'constant.numeric.decimal.fasm'
    ],
    operator: ['keyword.operator.special.fasm', 'keyword.operator.word.fasm', 'keyword.operator.arithmetic.fasm']
};

const FONT_STYLES: Partial<Record<ColorRole, string>> = {
    comment: 'italic',
    label: 'bold',
    section: 'bold',
    data: 'italic',
    directive: 'italic',
    helper: 'italic',
    instruction: 'bold'
};

const DARK_COLORS: Readonly<Record<ColorRole, string>> = {
    comment: '#6e7f8f',
    string: '#d9b26f',
    label: '#7ec9c3',
    section: '#8fd0ff',
    data: '#89c37b',
    directive: '#c792ea',
    helper: '#5fb3b3',
    instruction: '#ff8f6b',
    register: '#7db2d9',
    number: '#f7c76b',
    operator: '#c0c8d0'
};

const LIGHT_COLORS: Readonly<Record<ColorRole, string>> = {
    comment: '#6a737d',
    string: '#9a6700',
    label: '#0f766e',
    section: '#0b6bcb',
    data: '#2e7d32',
    directive: '#7b3fb3',
    helper: '#0e7490',
    instruction: '#c2410c',
    register: '#1d5fa8',
    number: '#a15c00',
    operator: '#4b5563'
};

export function defaultRoleColor(role: ColorRole, isLightTheme: boolean): string {
    return (isLightTheme ? LIGHT_COLORS : DARK_COLORS)[role];
}

export function fasmColorRules(isLightTheme: boolean, overrides: ColorOverrides = {}): ColorRule[] {
    const colors = isLightTheme ? LIGHT_COLORS : DARK_COLORS;
    return (Object.keys(SCOPES) as ColorRole[]).map((role) => {
        const fontStyle = FONT_STYLES[role];
        return {
            name: `FASM ${role}`,
            scope: SCOPES[role],
            settings: { foreground: overrides[role] ?? colors[role], ...(fontStyle ? { fontStyle } : {}) }
        };
    });
}

function isFasmRule(rule: unknown): boolean {
    const name = (rule as { name?: unknown } | null)?.name;
    const roles = Object.keys(SCOPES).map((role) => `FASM ${role}`);
    return typeof name === 'string' && roles.includes(name);
}

function otherRules(customizations: TokenColorCustomizations | undefined): unknown[] {
    const rules = customizations?.textMateRules;
    return Array.isArray(rules) ? rules.filter((rule) => !isFasmRule(rule)) : [];
}

// Keeps everything the user already has, and replaces only rules this extension added.
export function addFasmRules(customizations: TokenColorCustomizations | undefined, isLightTheme: boolean, overrides: ColorOverrides = {}): TokenColorCustomizations {
    return { ...customizations, textMateRules: [...otherRules(customizations), ...fasmColorRules(isLightTheme, overrides)] };
}

export function hasFasmRules(customizations: TokenColorCustomizations | undefined): boolean {
    const rules = customizations?.textMateRules;
    return Array.isArray(rules) && rules.some(isFasmRule);
}

export function removeFasmRules(customizations: TokenColorCustomizations | undefined): TokenColorCustomizations | undefined {
    if (!customizations) {
        return undefined;
    }

    const result: TokenColorCustomizations = { ...customizations };
    const remaining = otherRules(customizations);
    if (remaining.length > 0) {
        result.textMateRules = remaining;
    } else {
        delete result.textMateRules;
    }
    return Object.keys(result).length > 0 ? result : undefined;
}
