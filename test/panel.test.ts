import * as fs from 'node:fs';
import * as path from 'node:path';
import { PANEL_SETTINGS } from '../src/panel/constants/panelSettings';
import { PROJECT_LINKS } from '../src/panel/constants/projectLinks';
import { issueUrl } from '../src/panel/issueLink';
import { renderPanelHtml } from '../src/panel/panelHtml';
import { parsePanelMessage } from '../src/panel/panelMessages';

const ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

describe('panel messages', () => {
    test.each([
        [{ type: 'ready' }],
        [{ type: 'command', command: 'build' }],
        [{ type: 'setSetting', id: 'fontSize', value: 14 }],
        [{ type: 'setSetting', id: 'targetSystem', value: 'linux' }],
        [{ type: 'resetSetting', id: 'fontSize' }],
        [{ type: 'setScope', scope: 'user' }],
        [{ type: 'browseCompiler', kind: 'fasmg' }],
        [{ type: 'openLink', link: 'fasmDocs' }],
        [{ type: 'reportIssue', issue: 'bug' }],
        [{ type: 'setColors', enabled: true }],
        [{ type: 'setColor', role: 'comment', color: '#112233' }],
        [{ type: 'convertNumber', text: '255' }]
    ])('accepts %j', (message) => {
        expect(parsePanelMessage(message)).toEqual(message);
    });

    test.each([
        [null],
        ['text'],
        [{ type: 'unknown' }],
        [{ type: 'command', command: 'rm -rf' }],
        [{ type: 'setSetting', id: 'files.exclude', value: {} }],
        [{ type: 'setSetting', id: 'fontSize', value: 'big' }],
        [{ type: 'setSetting', id: 'fontSize', value: -1 }],
        [{ type: 'setSetting', id: 'targetSystem', value: 'plan9' }],
        [{ type: 'browseCompiler', kind: 'nasm' }],
        [{ type: 'installCompiler', kind: 'fasm' }],
        [{ type: 'openLink', link: 'https://evil.example' }],
        [{ type: 'openLink', link: 'constructor' }],
        [{ type: 'setColor', role: 'comment', color: 'red; x' }],
        [{ type: 'setColor', role: 'nope', color: '#112233' }],
        [{ type: 'convertNumber', text: 'x'.repeat(201) }]
    ])('rejects %j', (message) => {
        expect(parsePanelMessage(message)).toBeUndefined();
    });
});

describe('settings', () => {
    test('every extension setting in the panel exists in package.json', () => {
        const properties = manifest.contributes.configuration.properties;
        for (const setting of PANEL_SETTINGS.filter((candidate) => candidate.section === 'fasm')) {
            expect(properties[`fasm.${setting.key}`]).toBeDefined();
        }
    });

    test('font and format settings only change FASM files', () => {
        for (const setting of PANEL_SETTINGS.filter((candidate) => candidate.section === 'editor')) {
            expect(setting.languageScoped).toBe(true);
        }
    });

    test('dropdown options match package.json', () => {
        const properties = manifest.contributes.configuration.properties;
        for (const setting of PANEL_SETTINGS.filter((candidate) => candidate.type === 'enum')) {
            expect(setting.options).toEqual(properties[`fasm.${setting.key}`].enum);
        }
    });
});

describe('control tab', () => {
    const script = fs.readFileSync(path.join(ROOT, 'media', 'panel.js'), 'utf8');

    test('editor tools come first', () => {
        const control = script.slice(script.indexOf('function renderControl'), script.indexOf('function renderScope'));
        expect(control.indexOf("'Editor tools'")).toBeGreaterThan(-1);
        expect(control.indexOf("'Editor tools'")).toBeLessThan(control.indexOf("'Current file'"));
        expect(control.indexOf("'Current file'")).toBeLessThan(control.indexOf("'Compilers'"));
    });

    test('there is no download or install option', () => {
        const control = script.slice(script.indexOf('function renderControl'), script.indexOf('function renderScope'));
        expect(control).not.toContain('fasmDownload');
        expect(script).not.toMatch(/installCompiler|data-install/);
    });

    test('a missing compiler points to the Project tab', () => {
        expect(script).toContain('data-tab="project"');
    });
});

describe('links', () => {
    test('the official section only has the four main links', () => {
        const script = fs.readFileSync(path.join(ROOT, 'media', 'panel.js'), 'utf8');
        expect(script).toContain("['fasmSite', 'fasmDocs', 'fasmDownload', 'fasmForum']");
        expect(Object.keys(PROJECT_LINKS)).not.toEqual(expect.arrayContaining(['fasmRepo']));
        expect(Object.keys(PROJECT_LINKS)).not.toContain('fasmarm');
    });

    test('every icon the panel asks for exists', () => {
        const script = fs.readFileSync(path.join(ROOT, 'media', 'panel.js'), 'utf8');
        const icons = fs.readFileSync(path.join(ROOT, 'media', 'icons.js'), 'utf8');
        const names = new Set([...script.matchAll(/'([a-z]+(?:-[a-z]+)*)'/g)].map((match) => match[1]).filter((name) => icons.includes(`"${name}":`)));
        expect(names.size).toBeGreaterThan(20);
        for (const name of ['dashboard', 'settings-gear', 'info', 'tools', 'play', 'debug-stop', 'globe', 'book', 'bug']) {
            expect(icons).toContain(`"${name}":`);
        }
    });

    test('all use https', () => {
        for (const link of Object.values(PROJECT_LINKS)) {
            expect(link.url).toMatch(/^https:\/\//);
        }
    });

    test('a bug report includes what helps, and stays on the project repo', () => {
        const url = issueUrl('bug', { version: '1.2.3', system: 'win32 x64', editor: 'Antigravity 1.0', compiler: 'fasm 1.73.35' });
        expect(url.startsWith(`${PROJECT_LINKS.repository.url}/issues/new?`)).toBe(true);
        const body = new URL(url).searchParams.get('body');
        expect(body).toContain('1.2.3');
        expect(body).toContain('Antigravity 1.0');
        expect(body).toContain('fasm 1.73.35');
    });

    test('a feature request does not include system details', () => {
        const url = issueUrl('request', { version: '1', system: 'SECRET', editor: 'e', compiler: 'c' });
        expect(new URL(url).searchParams.get('body')).not.toContain('SECRET');
    });
});

describe('panel page', () => {
    const html = renderPanelHtml({ cspSource: 'vscode-resource:', nonce: 'abc123', scriptUri: 'panel.js', iconsUri: 'icons.js', styleUri: 'panel.css' });

    test('its security policy blocks everything except its own files', () => {
        expect(html).toContain("default-src 'none'");
        expect(html).toContain("script-src 'nonce-abc123'");
        expect(html).not.toMatch(/unsafe-(inline|eval)/);
        expect(html).toContain('<script nonce="abc123"');
    });

    test('the script loads nothing from outside', () => {
        const script = fs.readFileSync(path.join(ROOT, 'media', 'panel.js'), 'utf8');
        expect(script).not.toMatch(/\bfetch\(|XMLHttpRequest|https?:\/\/|\beval\(/);
        expect(fs.readFileSync(path.join(ROOT, 'media', 'icons.js'), 'utf8')).not.toMatch(/<script|on[a-z]+=|\bfetch\(/);
    });

    test('every value shown in the panel goes through escaping', () => {
        const script = fs.readFileSync(path.join(ROOT, 'media', 'panel.js'), 'utf8');
        for (const field of ['compiler.path', 'compiler.label', 'file.name', 'r.decimal']) {
            expect(script).not.toMatch(new RegExp(`\\$\\{${field.replace('.', '\\.')}\\}`));
        }
    });
});

describe('manifest', () => {
    test('the gear only shows on FASM files', () => {
        expect(manifest.contributes.menus['editor/title']).toEqual([{ command: 'fasm.openPanel', when: 'editorLangId == fasm', group: 'navigation' }]);
    });

    test('there is a panel for each side', () => {
        expect(manifest.contributes.views.fasmPanelLeft[0].id).toBe('fasm.panelLeft');
        expect(manifest.contributes.views.fasmPanelRight[0].id).toBe('fasm.panelRight');
        expect(manifest.contributes.viewsContainers.activitybar[0].id).toBe('fasmPanelLeft');
        expect(manifest.contributes.viewsContainers.secondarySidebar[0].id).toBe('fasmPanelRight');
    });

    test('the panel stays hidden until a FASM file activates the extension', () => {
        expect(manifest.contributes.views.fasmPanelLeft[0].when).toContain('fasm.panelReady');
        expect(manifest.contributes.views.fasmPanelRight[0].when).toContain('fasm.panelReady');
    });

    test('its files exist', () => {
        for (const file of ['media/icons.js', 'media/panel.js', 'media/panel.css', 'media/panel-icon.svg', 'snippets/fasm.json']) {
            expect(fs.existsSync(path.join(ROOT, file))).toBe(true);
        }
    });

    test('every command has a title', () => {
        for (const command of manifest.contributes.commands) {
            expect(command.title).toBeTruthy();
        }
    });
});
