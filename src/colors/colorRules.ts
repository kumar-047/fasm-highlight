import { DARK_COLORS, FONT_STYLES, LIGHT_COLORS, ROLE_LABELS, SCOPES } from './constants/colorPalette';
import { AUTO_PALETTE, COLOR_PALETTES } from './constants/colorPalettes';
import type { ColorOverrides, ColorPalette, ColorRole, ColorRule, TokenColorCustomizations } from './types';

export function roleLabel(role: ColorRole): string {
    return ROLE_LABELS[role];
}

function paletteColors(isLightTheme: boolean, paletteId: string): Readonly<Record<ColorRole, string>> {
    const palette = paletteId === AUTO_PALETTE ? undefined : COLOR_PALETTES.find((candidate) => candidate.id === paletteId);
    return palette?.colors ?? (isLightTheme ? LIGHT_COLORS : DARK_COLORS);
}

export function orderedPalettes(isLightTheme: boolean): ColorPalette[] {
    const matching = isLightTheme ? 'light' : 'dark';
    return [...COLOR_PALETTES].sort((a, b) => Number(b.kind === matching) - Number(a.kind === matching));
}

export function defaultRoleColor(role: ColorRole, isLightTheme: boolean, paletteId: string = AUTO_PALETTE): string {
    return paletteColors(isLightTheme, paletteId)[role];
}

export function fasmColorRules(isLightTheme: boolean, overrides: ColorOverrides = {}, paletteId: string = AUTO_PALETTE): ColorRule[] {
    const colors = paletteColors(isLightTheme, paletteId);
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

export function addFasmRules(
    customizations: TokenColorCustomizations | undefined,
    isLightTheme: boolean,
    overrides: ColorOverrides = {},
    paletteId: string = AUTO_PALETTE
): TokenColorCustomizations {
    return { ...customizations, textMateRules: [...otherRules(customizations), ...fasmColorRules(isLightTheme, overrides, paletteId)] };
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
