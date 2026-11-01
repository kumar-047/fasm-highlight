export interface ColorRule {
    readonly name: string;
    readonly scope: readonly string[];
    readonly settings: { readonly foreground: string; readonly fontStyle?: string };
}

export type TokenColorCustomizations = Record<string, unknown> & { textMateRules?: unknown };

export type ColorRole = 'comment' | 'string' | 'label' | 'section' | 'data' | 'directive' | 'helper' | 'instruction' | 'register' | 'number' | 'operator';

export interface ColorPalette {
    readonly id: string;
    readonly label: string;
    readonly kind: 'dark' | 'light';
    readonly colors: Readonly<Record<ColorRole, string>>;
}

export type ColorOverrides = Partial<Record<ColorRole, string>>;
