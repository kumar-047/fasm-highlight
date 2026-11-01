import { CompilerKind } from './compilerKinds';

export const DOWNLOAD_PAGE = 'https://flatassembler.net/download.php';
const DOWNLOAD_BASE = 'https://flatassembler.net/';

export type InstallableKind = Exclude<CompilerKind, 'fasmarm'>;

export function isInstallable(kind: CompilerKind, platform: NodeJS.Platform): boolean {
    switch (kind) {
        case 'fasm':
        case 'fasm2':
            return platform === 'win32' || platform === 'linux';
        case 'fasmg':
            return platform === 'win32' || platform === 'linux' || platform === 'darwin';
        case 'fasmarm':
            return false;
    }
}

export function parseDownloadLinks(html: string): string[] {
    return [...html.matchAll(/href\s*=\s*["']?([^"'\s>]+)/gi)].map((match) => match[1]);
}

const PACKAGE_NAMES: Readonly<Record<InstallableKind, (platform: NodeJS.Platform) => RegExp>> = {
    fasm: (platform) => (platform === 'win32' ? /^fasmw\d+\.zip$/i : /^fasm-[\d.]+\.tgz$/i),
    fasm2: () => /^fasm2\.zip$/i,
    fasmg: () => /^fasmg\.\w+\.zip$/i
};

// Only plain file names from the official page are accepted, so a link can't point somewhere else.
export function packageUrl(kind: InstallableKind, platform: NodeJS.Platform, links: readonly string[]): string | undefined {
    const pattern = PACKAGE_NAMES[kind](platform);
    const name = links.find((link) => pattern.test(link));
    return name ? `${DOWNLOAD_BASE}${name}` : undefined;
}
