import * as vscode from 'vscode';

import { settingsTarget } from '../shared/settingsTarget';
import { COLOR_ROLES } from './constants/colorPalette';
import { AUTO_PALETTE } from './constants/colorPalettes';
import { addFasmRules, defaultRoleColor, hasFasmRules, removeFasmRules } from './colorRules';
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

export function currentPalette(): string {
    return fasmConfig().get<string>('colors.palette', AUTO_PALETTE);
}

function inspected() {
    return vscode.workspace.getConfiguration('editor').inspect<TokenColorCustomizations>(SETTING);
}

export function isColorsOn(): boolean {
    const values = inspected();
    return hasFasmRules(values?.workspaceValue) || hasFasmRules(values?.globalValue);
}

export function colorRoleValues(): Record<ColorRole, string> {
    const current = overrides();
    const light = isLightTheme();
    return Object.fromEntries(COLOR_ROLES.map((role) => [role, current[role] ?? defaultRoleColor(role, light, currentPalette())])) as Record<ColorRole, string>;
}

async function applyColors(): Promise<void> {
    const config = vscode.workspace.getConfiguration('editor');
    const values = inspected();
    const targets: readonly (readonly [vscode.ConfigurationTarget, TokenColorCustomizations | undefined])[] = [
        [vscode.ConfigurationTarget.Workspace, values?.workspaceValue],
        [vscode.ConfigurationTarget.Global, values?.globalValue]
    ];

    const active = targets.filter(([, value]) => hasFasmRules(value));
    if (active.length === 0) {
        const target = settingsTarget();
        const current = target === vscode.ConfigurationTarget.Workspace ? values?.workspaceValue : values?.globalValue;
        await config.update(SETTING, addFasmRules(current, isLightTheme(), overrides(), currentPalette()), target);
        return;
    }
    for (const [target, value] of active) {
        await config.update(SETTING, addFasmRules(value, isLightTheme(), overrides(), currentPalette()), target);
    }
}

export async function setPalette(id: string): Promise<void> {
    await fasmConfig().update('colors.palette', id, vscode.ConfigurationTarget.Global);
    await fasmConfig().update('colors.overrides', undefined, vscode.ConfigurationTarget.Global);
    await applyColors();
}

export async function setRoleColor(role: ColorRole, color: string): Promise<void> {
    await fasmConfig().update('colors.overrides', { ...overrides(), [role]: color }, vscode.ConfigurationTarget.Global);
    await applyColors();
}

export async function resetColors(): Promise<void> {
    await fasmConfig().update('colors.overrides', undefined, vscode.ConfigurationTarget.Global);
    const config = vscode.workspace.getConfiguration('editor');
    const values = inspected();
    if (values?.workspaceValue) {
        await config.update(SETTING, removeFasmRules(values.workspaceValue), vscode.ConfigurationTarget.Workspace);
    }
    if (values?.globalValue) {
        await config.update(SETTING, removeFasmRules(values.globalValue), vscode.ConfigurationTarget.Global);
    }
}

export function registerPaletteCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('fasm.setPalette', setPalette);
}
