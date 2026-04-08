import * as cp from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

export class FasmCompiler {
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    async compile(sourcePath: string, outputPath?: string): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('fasm');
        const compilerPath = config.get<string>('compilerPath', 'C:\\fasmw17332\\fasm.exe');
        const memoryLimit = config.get<number>('memoryLimit', 65536);
        const passesLimit = config.get<number>('passesLimit', 100);
        const generateSymbols = config.get<boolean>('generateSymbols', false);

        const args: string[] = [sourcePath];
        if (outputPath) {
            args.push(outputPath);
        }

        args.push('-m', memoryLimit.toString());
        args.push('-p', passesLimit.toString());

        if (generateSymbols) {
            const symbolsPath = outputPath
                ? outputPath.replace(/\.exe$/i, '.fas')
                : sourcePath.replace(/\.(asm|inc)$/i, '.fas');
            args.push('-s', symbolsPath);
        }

        return new Promise<boolean>((resolve) => {
            this.outputChannel.appendLine(`Command: "${compilerPath}" ${args.join(' ')}`);
            this.outputChannel.appendLine('');

            const process = cp.spawn(compilerPath, args, {
                cwd: path.dirname(sourcePath)
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                const text = data.toString();
                stdout += text;
                this.outputChannel.append(text);
            });

            process.stderr.on('data', (data) => {
                const text = data.toString();
                stderr += text;
                this.outputChannel.append(text);
            });

            process.on('error', (error) => {
                this.outputChannel.appendLine(`Error: ${error.message}`);
                this.outputChannel.appendLine('');
                this.outputChannel.appendLine('Make sure FASM is installed and the compiler path is correct.');
                this.outputChannel.appendLine('You can configure the path in settings: fasm.compilerPath');
                resolve(false);
            });

            process.on('close', (code) => {
                this.outputChannel.appendLine('');

                if (code === 0) {
                    this.outputChannel.appendLine('Build succeeded');
                    resolve(true);
                    return;
                }

                this.outputChannel.appendLine(`Build failed with exit code ${code}`);
                this.parseErrors(stdout + stderr, sourcePath);
                resolve(false);
            });
        });
    }

    async run(exePath: string): Promise<void> {
        return new Promise<void>((resolve) => {
            const process = cp.spawn(exePath, [], {
                cwd: path.dirname(exePath)
            });

            process.stdout.on('data', (data) => {
                this.outputChannel.append(data.toString());
            });

            process.stderr.on('data', (data) => {
                this.outputChannel.append(data.toString());
            });

            process.on('error', (error) => {
                this.outputChannel.appendLine(`Error running program: ${error.message}`);
                resolve();
            });

            process.on('close', (code) => {
                this.outputChannel.appendLine('');
                this.outputChannel.appendLine(`Program exited with code ${code}`);
                resolve();
            });
        });
    }

    private parseErrors(output: string, sourcePath: string) {
        this.outputChannel.appendLine('');
        this.outputChannel.appendLine('Errors:');

        const errorRegex = /^(.+?)\s+\[(\d+)\]\s+(.+)$/gm;
        let match: RegExpExecArray | null;

        while ((match = errorRegex.exec(output)) !== null) {
            const [, file, line, message] = match;
            const displayFile = file || sourcePath;
            this.outputChannel.appendLine(`  ${displayFile}:${line} ${message}`);
        }

        const generalErrorRegex = /error:(.+)/gi;
        while ((match = generalErrorRegex.exec(output)) !== null) {
            this.outputChannel.appendLine(`  ${match[1].trim()}`);
        }
    }
}
