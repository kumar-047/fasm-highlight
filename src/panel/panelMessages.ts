import { COLOR_ROLES } from '../colors/constants/colorPalette';
import type { ColorRole } from '../colors/types';
import { PANEL_SETTINGS } from './constants/panelSettings';
import type { PanelMessage, PanelSetting } from './types';

export function parsePanelMessage(raw: unknown): PanelMessage | undefined {
    if (!raw || typeof raw !== 'object') {
        return undefined;
    }
    const message = raw as Record<string, unknown>;

    switch (message.type) {
        case 'ready':
        case 'formatFile':
        case 'browseCompiler':
            return { type: message.type };
        case 'setSetting': {
            const setting = PANEL_SETTINGS.find((candidate) => candidate.id === message.id);
            return setting && isValidValue(setting, message.value) ? { type: 'setSetting', id: setting.id, value: message.value } : undefined;
        }
        case 'resetSetting':
            return PANEL_SETTINGS.some((candidate) => candidate.id === message.id) ? { type: 'resetSetting', id: message.id as string } : undefined;
        case 'setScope':
            return message.scope === 'workspace' || message.scope === 'user' ? { type: 'setScope', scope: message.scope } : undefined;
        case 'setColors':
            return typeof message.enabled === 'boolean' ? { type: 'setColors', enabled: message.enabled } : undefined;
        case 'setColor': {
            const validColor = message.color === undefined || (typeof message.color === 'string' && /^#[0-9a-f]{6}$/i.test(message.color));
            return COLOR_ROLES.includes(message.role as ColorRole) && validColor
                ? { type: 'setColor', role: message.role as ColorRole, color: message.color as string | undefined }
                : undefined;
        }
        case 'convertNumber':
            return typeof message.text === 'string' && message.text.length <= 200 ? { type: 'convertNumber', text: message.text } : undefined;
        default:
            return undefined;
    }
}

function isValidValue(setting: PanelSetting, value: unknown): boolean {
    switch (setting.type) {
        case 'string':
            return typeof value === 'string' && value.length <= 500;
        case 'number':
            return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 200;
        case 'boolean':
            return typeof value === 'boolean';
    }
}
