import * as fs from 'node:fs';
import * as path from 'node:path';
import { addFasmRules, defaultRoleColor, fasmColorRules, orderedPalettes, hasFasmRules, removeFasmRules } from '../src/colors/colorRules';
import { COLOR_ROLES, SEMANTIC_SCOPES } from '../src/colors/constants/colorPalette';
import { COLOR_PALETTES } from '../src/colors/constants/colorPalettes';

const userRule = { scope: 'comment', settings: { foreground: '#111111' } };

describe('FASM colour rules', () => {
    test.each([true, false])('light theme %s: every rule only touches FASM text', (isLight) => {
        const scopes = fasmColorRules(isLight).flatMap((rule) => rule.scope);
        expect(scopes.filter((scope) => !scope.endsWith('.fasm'))).toEqual([]);
    });

    test('light and dark themes get different colours', () => {
        expect(fasmColorRules(true)[0].settings.foreground).not.toBe(fasmColorRules(false)[0].settings.foreground);
    });

    test('they match the grammar exactly', () => {
        const grammarScopes = new Set<string>();
        const collect = (value: unknown): void => {
            if (Array.isArray(value)) {
                value.forEach(collect);
            } else if (value && typeof value === 'object') {
                for (const [key, child] of Object.entries(value)) {
                    if (key === 'name' && typeof child === 'string') {
                        grammarScopes.add(child);
                    } else {
                        collect(child);
                    }
                }
            }
        };
        collect(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'syntaxes', 'fasm.tmLanguage.json'), 'utf8')).repository);

        const semantic: string[] = Object.values(SEMANTIC_SCOPES);
        const ruleScopes = fasmColorRules(false).flatMap((rule) => [...rule.scope]);
        expect(ruleScopes).toEqual(expect.arrayContaining(semantic));
        expect(ruleScopes.filter((scope) => !grammarScopes.has(scope) && !semantic.includes(scope))).toEqual([]);
        expect([...grammarScopes].filter((scope) => !ruleScopes.includes(scope))).toEqual([]);
    });
});

describe('adding and removing', () => {
    test("turning on keeps the user's own settings", () => {
        const result = addFasmRules({ comments: '#222222', textMateRules: [userRule] }, false);
        expect(result.comments).toBe('#222222');
        expect(result.textMateRules).toContain(userRule);
        expect((result.textMateRules as unknown[]).length).toBe(fasmColorRules(false).length + 1);
    });

    test('custom colours replace the defaults', () => {
        const rules = fasmColorRules(false, { comment: '#123456' });
        expect(rules.find((rule) => rule.name === 'FASM comment')?.settings.foreground).toBe('#123456');
    });

    test('it can tell when the colours are on', () => {
        expect(hasFasmRules(undefined)).toBe(false);
        expect(hasFasmRules({ textMateRules: [userRule] })).toBe(false);
        expect(hasFasmRules(addFasmRules(undefined, false))).toBe(true);
    });

    test('turning on twice does not add rules twice', () => {
        const once = addFasmRules(undefined, false);
        const twice = addFasmRules(once, true);
        expect((twice.textMateRules as unknown[]).length).toBe(fasmColorRules(false).length);
    });

    test("turning off removes only this extension's rules", () => {
        const result = removeFasmRules(addFasmRules({ comments: '#222222', textMateRules: [userRule] }, false));
        expect(result).toEqual({ comments: '#222222', textMateRules: [userRule] });
    });

    test('turning off leaves nothing behind when nothing else was set', () => {
        expect(removeFasmRules(addFasmRules(undefined, false))).toBeUndefined();
    });

    test('turning off with no settings is safe', () => {
        expect(removeFasmRules(undefined)).toBeUndefined();
    });
});

function luminance(hex: string): number {
    const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
    const [r, g, b] = channels.map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first: string, second: string): number {
    const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (light + 0.05) / (dark + 0.05);
}

describe('colour palettes', () => {
    test('there are several for dark and light themes', () => {
        expect(COLOR_PALETTES.filter((palette) => palette.kind === 'dark').length).toBeGreaterThanOrEqual(3);
        expect(COLOR_PALETTES.filter((palette) => palette.kind === 'light').length).toBeGreaterThanOrEqual(3);
    });

    test('ids are unique, and match package.json', () => {
        const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
        const ids = COLOR_PALETTES.map((palette) => palette.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(manifest.contributes.configuration.properties['fasm.colors.palette'].enum).toEqual(['auto', ...ids]);
    });

    test.each(COLOR_PALETTES.map((palette) => [palette.label, palette] as const))('%s is readable on its background', (_label, palette) => {
        const background = palette.kind === 'light' ? '#ffffff' : '#1e1e1e';
        for (const role of COLOR_ROLES) {
            expect(contrast(palette.colors[role], background)).toBeGreaterThanOrEqual(4.5);
        }
    });

    test('choosing a palette changes the colours', () => {
        const ocean = fasmColorRules(false, {}, 'ocean').find((rule) => rule.name === 'FASM instruction');
        expect(ocean?.settings.foreground).toBe(COLOR_PALETTES.find((palette) => palette.id === 'ocean')?.colors.instruction);
    });

    test('your own colour wins over the palette', () => {
        const rule = fasmColorRules(false, { comment: '#123456' }, 'ocean').find((item) => item.name === 'FASM comment');
        expect(rule?.settings.foreground).toBe('#123456');
    });

    test('automatic follows the theme, and an unknown palette falls back safely', () => {
        expect(defaultRoleColor('comment', true)).toBe(defaultRoleColor('comment', true, 'fasm-light'));
        expect(defaultRoleColor('comment', false, 'missing')).toBe(defaultRoleColor('comment', false, 'fasm-dark'));
    });

    test('palettes for your theme are listed first', () => {
        expect(orderedPalettes(true)[0].kind).toBe('light');
        expect(orderedPalettes(false)[0].kind).toBe('dark');
    });
});
