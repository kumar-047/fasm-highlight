import type { PanelSetting } from '../types';

export const PANEL_SETTINGS: readonly PanelSetting[] = [
    { id: 'tabSize', section: 'editor', key: 'tabSize', languageScoped: true, type: 'number' },
    { id: 'insertSpaces', section: 'editor', key: 'insertSpaces', languageScoped: true, type: 'boolean' },
    { id: 'formatOnSave', section: 'editor', key: 'formatOnSave', languageScoped: true, type: 'boolean' },
    { id: 'commentColumn', section: 'fasm', key: 'format.commentColumn', languageScoped: false, type: 'number' },
    { id: 'compilerPath', section: 'fasm', key: 'compilerPath', languageScoped: false, type: 'string' }
];
