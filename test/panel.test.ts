import * as fs from 'node:fs';
import * as path from 'node:path';

import { PANEL_SETTINGS } from '../src/panel/constants/panelSettings';
import { renderPanelHtml } from '../src/panel/panelHtml';
import { parsePanelMessage } from '../src/panel/panelMessages';

const ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const script = fs.readFileSync(path.join(ROOT, 'media', 'panel.js'), 'utf8');
const icons = fs.readFileSync(path.join(ROOT, 'media', 'icons.js'), 'utf8');

describe('panel messages', () => {
    test.each([
        [{ type: 'ready' }],
        [{ type: 'formatFile' }],
        [{ type: 'browseCompiler' }],
        [{ type: 'setSetting', id: 'tabSize', value: 4 }],
        [{ type: 'setSetting', id: 'compilerPath', value: 'C:\\fasm\\fasm.exe' }],
        [{ type: 'resetSetting', id: 'compilerPath' }],
        [{ type: 'setScope', scope: 'user' }],
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
        [{ type: 'buildAndRun' }],
        [{ type: 'installCompiler', kind: 'fasm' }],
        [{ type: 'setSetting', id: 'files.exclude', value: {} }],
        [{ type: 'setSetting', id: 'tabSize', value: 'big' }],
        [{ type: 'setSetting', id: 'tabSize', value: -1 }],
        [{ type: 'setColor', role: 'comment', color: 'red; x' }],
        [{ type: 'setColor', role: 'nope', color: '#112233' }],
        [{ type: 'convertNumber', text: 'x'.repeat(201) }]
    ])('rejects %j', (message) => {
        expect(parsePanelMessage(message)).toBeUndefined();
    });
});

describe('what the panel contains', () => {
    test('it has two tabs: Format and Colors', () => {
        expect(script).toContain("[['format', 'Format', 'list-flat'], ['colors', 'Colors', 'symbol-color']]");
    });

    test('the number converter and one compiler path sit below them', () => {
        expect(script).toContain('Number converter');
        expect(script).toContain('data-setting="compilerPath"');
    });

    test('it has no run, compiler list or links', () => {
        expect(script).not.toMatch(/buildAndRun|data-install|renderCompilers|data-link|data-issue|Donate/);
    });

    test('every icon it asks for exists', () => {
        for (const name of ['list-flat', 'symbol-color', 'symbol-numeric', 'folder-opened', 'discard']) {
            expect(icons).toContain(`"${name}":`);
        }
    });
});

describe('settings', () => {
    test('every extension setting in the panel exists in package.json', () => {
        const properties = manifest.contributes.configuration.properties;
        for (const setting of PANEL_SETTINGS.filter((candidate) => candidate.section === 'fasm')) {
            expect(properties[`fasm.${setting.key}`]).toBeDefined();
        }
    });

    test('format settings only change FASM files', () => {
        for (const setting of PANEL_SETTINGS.filter((candidate) => candidate.section === 'editor')) {
            expect(setting.languageScoped).toBe(true);
        }
    });
});

describe('panel page', () => {
    const html = renderPanelHtml({ cspSource: 'vscode-resource:', nonce: 'abc123', scriptUri: 'panel.js', iconsUri: 'icons.js', styleUri: 'panel.css' });

    test('its security policy blocks everything except its own files', () => {
        expect(html).toContain("default-src 'none'");
        expect(html).toContain("script-src 'nonce-abc123'");
        expect(html).not.toMatch(/unsafe-(inline|eval)/);
    });

    test('the scripts load nothing from outside', () => {
        expect(script).not.toMatch(/\bfetch\(|XMLHttpRequest|https?:\/\/|\beval\(/);
        expect(icons).not.toMatch(/<script|on[a-z]+=|\bfetch\(/);
    });
});

describe('manifest', () => {
    test('the button is inside the file, not in the editor toolbar', () => {
        expect(manifest.contributes.menus).toBeUndefined();
        expect(manifest.contributes.configuration.properties['fasm.showPanelButton'].default).toBe(true);
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
});
