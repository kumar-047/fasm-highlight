// Builds the line typed into a terminal to start a program, quoted for the shell in use.
export function formatRunCommand(programPath: string, shellPath: string, platform: NodeJS.Platform): string {
    const shell = shellPath.toLowerCase();

    if (/(^|[\\/])(powershell|pwsh)(\.exe)?$/.test(shell)) {
        return `& '${programPath.replace(/'/g, "''")}'`;
    }

    if (/(^|[\\/])cmd(\.exe)?$/.test(shell) || (shell === '' && platform === 'win32')) {
        return `"${programPath}"`;
    }

    return `'${programPath.replace(/'/g, `'\\''`)}'`;
}
