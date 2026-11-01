import * as cp from 'node:child_process';
import * as path from 'node:path';
import process from 'node:process';
import * as vscode from 'vscode';
import { formatRunCommand } from './runCommand';

const TERMINAL_NAME = 'FASM Run';

export class ProgramRunner implements vscode.Disposable {
    private terminal: vscode.Terminal | undefined;
    private readonly closeListener: vscode.Disposable;

    constructor() {
        this.closeListener = vscode.window.onDidCloseTerminal((closed) => {
            if (closed === this.terminal) {
                this.terminal = undefined;
            }
        });
    }

    run(programPath: string): void {
        this.terminal?.dispose();
        this.terminal = vscode.window.createTerminal({ name: TERMINAL_NAME, cwd: path.dirname(programPath) });
        this.terminal.show();
        this.terminal.sendText(formatRunCommand(programPath, vscode.env.shell, process.platform));
    }

    async stop(): Promise<boolean> {
        const terminal = this.terminal;
        if (!terminal) {
            return false;
        }

        const processId = await terminal.processId;
        if (process.platform === 'win32' && processId) {
            cp.spawn('taskkill', ['/PID', String(processId), '/T', '/F'], { stdio: 'ignore' }).on('error', () => undefined);
        }
        terminal.dispose();
        return true;
    }

    dispose(): void {
        this.closeListener.dispose();
    }
}
