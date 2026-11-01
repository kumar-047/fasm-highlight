import * as vscode from 'vscode';

import { COLOR_ROLES } from './constants/colorPalette';
import { AUTO_PALETTE } from './constants/colorPalettes';
import { addFasmRules, defaultRoleColor, hasFasmRules, isHexColor, orderedPalettes, removeFasmRules, roleLabel } from './colorRules';
import type { ColorOverrides, ColorRole, TokenColorCustomizations } from './types';

const SETTING = 'tokenColorCustomizations';

function isLightTheme(): boolean {
    const kind = vscode.window.activeColorTheme.kind;
    return kind === vscode.ColorThemeKind.Light || kind === vscode.ColorThemeKind.HighContrastLight;
}

function fasmConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('fasm');
}

function overrides(): ColorOverrides {
    return fasmConfig().get<ColorOverrides>('colors.overrides', {});
}

function paletteId(): string {
    return fasmConfig().get<string>('colors.palette', AUTO_PALETTE);
}

function inspected() {
    return vscode.workspace.getConfiguration('editor').inspect<TokenColorCustomizations>(SETTING);
}

function areColorsOn(): boolean {
    const values = inspected();
    return hasFasmRules(values?.workspaceValue) || hasFasmRules(values?.globalValue);
}

async function chooseTarget(): Promise<vscode.ConfigurationTarget | undefined> {
    if (!vscode.workspace.workspaceFolders?.length) {
        return vscode.ConfigurationTarget.Global;
    }

    const choice = await vscode.window.showQuickPick(
        [
            { label: 'This workspace', description: 'Saved in .vscode/settings.json', target: vscode.ConfigurationTarget.Workspace },
            { label: 'All windows', description: 'Saved in your user settings', target: vscode.ConfigurationTarget.Global }
        ],
        { placeHolder: 'Where should FASM Colors apply?' }
    );
    return choice?.target;
}

async function turnOn(): Promise<boolean> {
    const target = await chooseTarget();
    if (target === undefined) {
        return false;
    }
    const values = inspected();
    const current = target === vscode.ConfigurationTarget.Workspace ? values?.workspaceValue : values?.globalValue;
    await vscode.workspace.getConfiguration('editor').update(SETTING, addFasmRules(current, isLightTheme(), overrides(), paletteId()), target);
    return true;
}

async function turnOff(): Promise<void> {
    const config = vscode.workspace.getConfiguration('editor');
    const values = inspected();
    if (values?.workspaceValue) {
        await config.update(SETTING, removeFasmRules(values.workspaceValue), vscode.ConfigurationTarget.Workspace);
    }
    if (values?.globalValue) {
        await config.update(SETTING, removeFasmRules(values.globalValue), vscode.ConfigurationTarget.Global);
    }
}

async function reapply(): Promise<void> {
    const config = vscode.workspace.getConfiguration('editor');
    const values = inspected();
    if (hasFasmRules(values?.workspaceValue)) {
        await config.update(SETTING, addFasmRules(values?.workspaceValue, isLightTheme(), overrides(), paletteId()), vscode.ConfigurationTarget.Workspace);
    }
    if (hasFasmRules(values?.globalValue)) {
        await config.update(SETTING, addFasmRules(values?.globalValue, isLightTheme(), overrides(), paletteId()), vscode.ConfigurationTarget.Global);
    }
}

async function choosePalette(id: string): Promise<void> {
    await fasmConfig().update('colors.palette', id, vscode.ConfigurationTarget.Global);
    await fasmConfig().update('colors.overrides', undefined, vscode.ConfigurationTarget.Global);
    if (areColorsOn()) {
        await reapply();
    } else {
        await turnOn();
    }
}

async function changeRoleColor(role: ColorRole): Promise<void> {
    const color = await vscode.window.showInputBox({
        title: `${roleLabel(role)} color`,
        prompt: 'Enter a color like #ff8f6b',
        value: overrides()[role] ?? defaultRoleColor(role, isLightTheme(), paletteId()),
        validateInput: (value) => (isHexColor(value) ? undefined : 'Enter a color like #ff8f6b.')
    });
    if (color) {
        await fasmConfig().update('colors.overrides', { ...overrides(), [role]: color }, vscode.ConfigurationTarget.Global);
        await reapply();
    }
}

async function changeColors(): Promise<void> {
    const light = isLightTheme();
    const on = areColorsOn();
    const current = paletteId();
    const palettes = orderedPalettes(light).map((palette) => ({
        label: palette.label,
        description: `${palette.kind === 'light' ? 'For light themes' : 'For dark themes'}${on && current === palette.id ? ', current' : ''}`,
        run: () => choosePalette(palette.id)
    }));
    const separator = (label: string) => ({ label, kind: vscode.QuickPickItemKind.Separator, description: '', run: async () => undefined });
    const custom = on
        ? [
            separator('Your own colors'),
            ...COLOR_ROLES.map((role) => ({
                label: roleLabel(role),
                description: overrides()[role] ?? defaultRoleColor(role, light, current),
                run: () => changeRoleColor(role)
            })),
            separator(''),
            { label: 'Turn Off FASM Colors', description: 'Back to your theme\'s colors', run: turnOff }
        ]
        : [];

    const choice = await vscode.window.showQuickPick([...palettes, ...custom], {
        title: 'Color Palette',
        placeHolder: 'Only changes FASM text. Your theme and other languages stay the same.'
    });
    await choice?.run();
}

export function registerColorCommands(): vscode.Disposable[] {
    return [
        vscode.commands.registerCommand('fasm.changeColors', changeColors),
        vscode.commands.registerCommand('fasm.turnOnColors', turnOn),
        vscode.commands.registerCommand('fasm.turnOffColors', turnOff)
    ];
}
