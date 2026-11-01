import * as cp from 'child_process';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as vscode from 'vscode';
import { COMPILER_LABELS, COMPILER_SETTINGS, executableNames } from './compilerKinds';
import { DOWNLOAD_PAGE, InstallableKind, packageUrl, parseDownloadLinks } from './compilerPackages';

const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;

function fetchBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                response.resume();
                reject(new Error(`${url} returned status ${response.statusCode}`));
                return;
            }
            const chunks: Buffer[] = [];
            let size = 0;
            response.on('data', (chunk: Buffer) => {
                size += chunk.length;
                if (size > MAX_DOWNLOAD_BYTES) {
                    response.destroy(new Error('The download is larger than expected.'));
                    return;
                }
                chunks.push(chunk);
            });
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}

function extractArchive(archive: string, destination: string): Promise<void> {
    const isZipOnLinux = process.platform === 'linux' && archive.endsWith('.zip');
    const [command, args] = isZipOnLinux
        ? ['unzip', ['-o', archive, '-d', destination]] as const
        : ['tar', ['-xf', archive, '-C', destination]] as const;
    return new Promise((resolve, reject) => {
        cp.execFile(command, [...args], (error) => (error ? reject(error) : resolve()));
    });
}

function findInstalled(kind: InstallableKind, directory: string, depth = 0): string | undefined {
    for (const name of executableNames(kind, process.platform)) {
        const candidate = path.join(directory, name);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    if (depth >= 3) {
        return undefined;
    }
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            const found = findInstalled(kind, path.join(directory, entry.name), depth + 1);
            if (found) {
                return found;
            }
        }
    }
    return undefined;
}

// Always asks first, and never updates on its own. The official site publishes no checksums.
export async function installCompiler(kind: InstallableKind, installRoot: string): Promise<boolean> {
    const links = parseDownloadLinks((await fetchBuffer(DOWNLOAD_PAGE)).toString('latin1'));
    const url = packageUrl(kind, process.platform, links);
    if (!url) {
        void vscode.window.showErrorMessage(`No official ${COMPILER_LABELS[kind]} package was found for this system.`);
        return false;
    }

    const answer = await vscode.window.showWarningMessage(
        `Download and install ${COMPILER_LABELS[kind]}?`,
        {
            modal: true,
            detail: `Source: ${url}\nInstalled to: ${path.join(installRoot, kind)}\n\nThe official site publishes no checksums, so the download can't be verified.`
        },
        'Install'
    );
    if (answer !== 'Install') {
        return false;
    }

    const destination = path.join(installRoot, kind);
    fs.rmSync(destination, { recursive: true, force: true });
    fs.mkdirSync(destination, { recursive: true });
    const archive = path.join(destination, path.posix.basename(url));

    await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: `Installing ${COMPILER_LABELS[kind]}` },
        async () => {
            fs.writeFileSync(archive, await fetchBuffer(url));
            await extractArchive(archive, destination);
            fs.rmSync(archive, { force: true });
        }
    );

    const executable = findInstalled(kind, destination);
    if (!executable) {
        void vscode.window.showErrorMessage(`The package installed, but ${COMPILER_LABELS[kind]} wasn't found inside it.`);
        return false;
    }
    if (process.platform !== 'win32') {
        fs.chmodSync(executable, 0o755);
    }
    await vscode.workspace.getConfiguration('fasm').update(COMPILER_SETTINGS[kind], executable, vscode.ConfigurationTarget.Global);
    void vscode.window.showInformationMessage(`${COMPILER_LABELS[kind]} is installed.`);
    return true;
}
