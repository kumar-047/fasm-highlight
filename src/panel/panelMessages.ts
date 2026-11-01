import { COLOR_ROLES } from '../colors/constants/colorPalette';
import type { ColorRole } from '../colors/types';
import { COMPILER_KINDS } from '../compiler/constants/compilers';
import type { CompilerKind } from '../compiler/types';
import { PANEL_COMMANDS, PANEL_SETTINGS } from './constants/panelSettings';
import { PROJECT_LINKS } from './constants/projectLinks';
import type { PanelCommand, PanelMessage, PanelSetting, ProjectLinkId } from './types';

export function parsePanelMessage(raw: unknown): PanelMessage | undefined {
    if (!raw || typeof raw !== 'object') {
        return undefined;
    }
    const message = raw as Record<string, unknown>;

    switch (message.type) {
        case 'ready':
            return { type: 'ready' };
        case 'command':
            return typeof message.command === 'string' && PANEL_COMMANDS.includes(message.command)
                ? { type: 'command', command: message.command as PanelCommand }
                : undefined;
        case 'setSetting': {
            const setting = PANEL_SETTINGS.find((candidate) => candidate.id === message.id);
            return setting && isValidValue(setting, message.value) ? { type: 'setSetting', id: setting.id, value: message.value } : undefined;
        }
        case 'resetSetting':
            return PANEL_SETTINGS.some((candidate) => candidate.id === message.id) ? { type: 'resetSetting', id: message.id as string } : undefined;
        case 'setScope':
            return message.scope === 'workspace' || message.scope === 'user' ? { type: 'setScope', scope: message.scope } : undefined;
        case 'browseCompiler':
            return COMPILER_KINDS.includes(message.kind as CompilerKind) ? { type: 'browseCompiler', kind: message.kind as CompilerKind } : undefined;
        case 'openLink':
            return typeof message.link === 'string' && Object.prototype.hasOwnProperty.call(PROJECT_LINKS, message.link)
                ? { type: 'openLink', link: message.link as ProjectLinkId }
                : undefined;
        case 'reportIssue':
            return message.issue === 'bug' || message.issue === 'request' ? { type: 'reportIssue', issue: message.issue } : undefined;
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
            return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10_000_000;
        case 'boolean':
            return typeof value === 'boolean';
        case 'enum':
            return typeof value === 'string' && (setting.options ?? []).includes(value);
    }
}
