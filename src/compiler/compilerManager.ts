import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { COMPILER_KINDS, COMPILER_SETTINGS, CompilerKind, executableNames } from './compilerKinds';

export interface FoundCompiler {
    readonly kind: CompilerKind;
    readonly path?: string;
    readonly version?: string;
    readonly source?: 'setting' | 'found';
}

export interface DiscoveryEnvironment {
    readonly platform: NodeJS.Platform;
    readonly pathVariable: string;
    readonly extraDirectories: readonly string[];
    readonly exists: (file: string) => boolean;
}

export function findExecutable(kind: CompilerKind, environment: DiscoveryEnvironment): string | undefined {
    const separator = environment.platform === 'win32' ? ';' : ':';
    const directories = [...environment.pathVariable.split(separator).filter(Boolean), ...environment.extraDirectories];
    const join = environment.platform === 'win32' ? path.win32.join : path.posix.join;
    for (const directory of directories) {
        for (const name of executableNames(kind, environment.platform)) {
            const candidate = join(directory, name);
            if (environment.exists(candidate)) {
                return candidate;
            }
        }
    }
    return undefined;
}

export function parseCompilerVersion(output: string): string | undefined {
    return /version\s+(\S+)/i.exec(output)?.[1];
}

// Common install folders. Only names are checked here; nothing runs until a version check.
function installFolders(platform: NodeJS.Platform, installRoot: string | undefined): string[] {
    const folders: string[] = [];
    if (installRoot) {
        for (const kind of COMPILER_KINDS) {
            folders.push(path.join(installRoot, kind));
        }
    }
    if (platform === 'win32') {
        try {
            for (const entry of fs.readdirSync('C:\\', { withFileTypes: true })) {
                if (entry.isDirectory() && /^fasm/i.test(entry.name)) {
                    folders.push(`C:\\${entry.name}`);
                }
            }
        } catch {
            // The folder can't be read, so there's nothing to add.
        }
    }
    return folders;
}

function readVersion(executable: string): Promise<string | undefined> {
    return new Promise((resolve) => {
        const target = /\.cmd$/i.test(executable) ? path.join(path.dirname(executable), 'fasmg.exe') : executable;
        cp.execFile(target, [], { timeout: 4000, windowsHide: true }, (_error, stdout, stderr) => {
            resolve(parseCompilerVersion(`${stdout}${stderr}`));
        });
    });
}

export class CompilerManager {
    private found: readonly FoundCompiler[] = [];

    constructor(private readonly installRoot: string | undefined) {}

    get compilers(): readonly FoundCompiler[] {
        return this.found;
    }

    async refresh(): Promise<readonly FoundCompiler[]> {
        const config = vscode.workspace.getConfiguration('fasm');
        const environment: DiscoveryEnvironment = {
            platform: process.platform,
            pathVariable: process.env.PATH ?? '',
            extraDirectories: installFolders(process.platform, this.installRoot),
            exists: (file) => fs.existsSync(file)
        };

        this.found = await Promise.all(COMPILER_KINDS.map(async (kind): Promise<FoundCompiler> => {
            const configured = config.get<string>(COMPILER_SETTINGS[kind], '');
            const executable = configured || findExecutable(kind, environment);
            if (!executable || (configured && !fs.existsSync(configured))) {
                return { kind, path: configured || undefined };
            }
            return { kind, path: executable, version: await readVersion(executable), source: configured ? 'setting' : 'found' };
        }));
        return this.found;
    }

    pathFor(kind: CompilerKind): string | undefined {
        return this.found.find((compiler) => compiler.kind === kind)?.path;
    }
}
