import { COMPILER_KINDS, CompilerKind } from '../compiler/compilerKinds';
import { COLOR_ROLES, ColorRole } from '../colors/colorRules';

// Everything here is plain data, so the rules can be tested without an editor.

export interface PanelSetting {
    readonly id: string;
    readonly section: string;
    readonly key: string;
    readonly languageScoped: boolean;
    readonly type: 'string' | 'number' | 'boolean' | 'enum';
    readonly options?: readonly string[];
}

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

export const PROJECT_LINKS = {
    fasmSite: { label: 'flat assembler website', url: 'https://flatassembler.net/' },
    fasmDocs: { label: 'Documentation', url: 'https://flatassembler.net/docs.php' },
    fasmDownload: { label: 'Downloads', url: 'https://flatassembler.net/download.php' },
    fasmForum: { label: 'Message board', url: 'https://board.flatassembler.net/' },
    fasmRepo: { label: 'fasm on GitHub', url: 'https://github.com/tgrysztar/fasm' },
    fasm2Repo: { label: 'fasm 2 on GitHub', url: 'https://github.com/tgrysztar/fasm2' },
    fasmgRepo: { label: 'fasmg on GitHub', url: 'https://github.com/tgrysztar/fasmg' },
    fasmarm: { label: 'FASMARM (third-party)', url: 'https://arm.flatassembler.net/' },
    repository: { label: 'Extension source code', url: 'https://github.com/kumar-047/fasm-highlight' },
    changelog: { label: 'Changelog', url: 'https://github.com/kumar-047/fasm-highlight/blob/main/CHANGELOG.md' },
    license: { label: 'License', url: 'https://github.com/kumar-047/fasm-highlight/blob/main/LICENSE' },
    donateFasm: { label: "Donate to fasm's author", url: 'https://flatassembler.net/download.php' }
} as const;

export type ProjectLinkId = keyof typeof PROJECT_LINKS;

export type PanelCommand = 'build' | 'buildAndRun' | 'stop' | 'format' | 'insertStarter' | 'openOutputFolder' | 'refreshCompilers';

const PANEL_COMMANDS: readonly string[] = ['build', 'buildAndRun', 'stop', 'format', 'insertStarter', 'openOutputFolder', 'refreshCompilers'];

export type PanelMessage =
    | { readonly type: 'ready' }
    | { readonly type: 'command'; readonly command: PanelCommand }
    | { readonly type: 'setSetting'; readonly id: string; readonly value: unknown }
    | { readonly type: 'resetSetting'; readonly id: string }
    | { readonly type: 'setScope'; readonly scope: 'workspace' | 'user' }
    | { readonly type: 'browseCompiler'; readonly kind: CompilerKind }
    | { readonly type: 'installCompiler'; readonly kind: CompilerKind }
    | { readonly type: 'openLink'; readonly link: ProjectLinkId }
    | { readonly type: 'reportIssue'; readonly issue: 'bug' | 'request' }
    | { readonly type: 'setColors'; readonly enabled: boolean }
    | { readonly type: 'setColor'; readonly role: ColorRole; readonly color: string | undefined }
    | { readonly type: 'convertNumber'; readonly text: string };

// The panel is a web page, so nothing it sends is trusted until it matches a known message.
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
        case 'installCompiler':
            return COMPILER_KINDS.includes(message.kind as CompilerKind) ? { type: message.type, kind: message.kind as CompilerKind } : undefined;
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

export interface IssueContext {
    readonly version: string;
    readonly system: string;
    readonly editor: string;
    readonly compiler: string;
}

// Opens a pre-filled GitHub page. The person reads it and decides whether to send it.
export function issueUrl(issue: 'bug' | 'request', context: IssueContext): string {
    const body = issue === 'bug'
        ? `**What happened**\n\n\n**What you expected**\n\n\n**Sample code**\n\n\n---\nExtension ${context.version}\nEditor: ${context.editor}\nSystem: ${context.system}\nCompiler: ${context.compiler}`
        : `**What would you like**\n\n\n---\nExtension ${context.version}`;
    const params = new URLSearchParams({ title: issue === 'bug' ? 'Bug: ' : 'Request: ', body });
    return `${PROJECT_LINKS.repository.url}/issues/new?${params.toString()}`;
}

export function renderPanelHtml(options: { cspSource: string; nonce: string; scriptUri: string; styleUri: string }): string {
    const { cspSource, nonce, scriptUri, styleUri } = options;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${styleUri}">
<title>FASM</title>
</head>
<body>
<div id="app"></div>
<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
