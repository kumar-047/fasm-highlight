export interface ColorRule {
    readonly name: string;
    readonly scope: readonly string[];
    readonly settings: { readonly foreground: string; readonly fontStyle?: string };
}

export type TokenColorCustomizations = Record<string, unknown> & { textMateRules?: unknown };

export type ColorRole = 'comment' | 'string' | 'label' | 'section' | 'data' | 'directive' | 'helper' | 'instruction' | 'register' | 'number' | 'operator';

export type ColorOverrides = Partial<Record<ColorRole, string>>;
