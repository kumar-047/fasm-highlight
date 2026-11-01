import { DARK_COLORS, FONT_STYLES, LIGHT_COLORS, ROLE_LABELS, SCOPES } from './constants/colorPalette';
import type { ColorOverrides, ColorRole, ColorRule, TokenColorCustomizations } from './types';

export function roleLabel(role: ColorRole): string {
    return ROLE_LABELS[role];
}

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
