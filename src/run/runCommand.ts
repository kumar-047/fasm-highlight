import type { HostPlatform } from '../shared/types';

export function formatRunCommand(programPath: string, shellPath: string, platform: HostPlatform): string {
    const shell = shellPath.toLowerCase();

    if (/(^|[\\/])(powershell|pwsh)(\.exe)?$/.test(shell)) {
        return `& '${programPath.replace(/'/g, "''")}'`;
    }

    if (/(^|[\\/])cmd(\.exe)?$/.test(shell) || (shell === '' && platform === 'win32')) {
        return `"${programPath}"`;
    }

    return `'${programPath.replace(/'/g, `'\\''`)}'`;
}
