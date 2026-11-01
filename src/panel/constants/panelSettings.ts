import { COMPILER_KINDS } from '../../compiler/constants/compilers';
import type { PanelSetting } from '../types';

export const PANEL_SETTINGS: readonly PanelSetting[] = [
    { id: 'fontFamily', section: 'editor', key: 'fontFamily', languageScoped: true, type: 'string' },
    { id: 'fontSize', section: 'editor', key: 'fontSize', languageScoped: true, type: 'number' },
    { id: 'fontLigatures', section: 'editor', key: 'fontLigatures', languageScoped: true, type: 'boolean' },
    { id: 'tabSize', section: 'editor', key: 'tabSize', languageScoped: true, type: 'number' },
    { id: 'insertSpaces', section: 'editor', key: 'insertSpaces', languageScoped: true, type: 'boolean' },
    { id: 'formatOnSave', section: 'editor', key: 'formatOnSave', languageScoped: true, type: 'boolean' },
    { id: 'commentColumn', section: 'fasm', key: 'format.commentColumn', languageScoped: false, type: 'number' },
    { id: 'panelSide', section: 'fasm', key: 'panelSide', languageScoped: false, type: 'enum', options: ['right', 'left'] },
    { id: 'targetSystem', section: 'fasm', key: 'targetSystem', languageScoped: false, type: 'enum', options: ['auto', 'windows', 'linux', 'macos'] },
    { id: 'assembler', section: 'fasm', key: 'assembler', languageScoped: false, type: 'enum', options: ['auto', ...COMPILER_KINDS] },
    { id: 'architecture', section: 'fasm', key: 'architecture', languageScoped: false, type: 'enum', options: ['auto', 'x86', '8051', 'avr', 'jvm', 'wasm', 'aarch64', 'arm'] },
    { id: 'memoryLimit', section: 'fasm', key: 'memoryLimit', languageScoped: false, type: 'number' },
    { id: 'passesLimit', section: 'fasm', key: 'passesLimit', languageScoped: false, type: 'number' },
    { id: 'generateSymbols', section: 'fasm', key: 'generateSymbols', languageScoped: false, type: 'boolean' }
];

export const PANEL_COMMANDS: readonly string[] = ['build', 'buildAndRun', 'stop', 'format', 'insertStarter', 'openOutputFolder', 'refreshCompilers'];
