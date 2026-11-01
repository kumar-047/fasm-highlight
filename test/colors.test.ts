import * as fs from 'fs';
import * as path from 'path';
import { SEMANTIC_SCOPES, addFasmRules, fasmColorRules, hasFasmRules, removeFasmRules } from '../src/colors/colorRules';

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
