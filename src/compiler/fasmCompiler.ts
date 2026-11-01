import * as cp from 'node:child_process';
import * as path from 'node:path';
import process from 'node:process';
import * as vscode from 'vscode';

import type { HostPlatform } from '../shared/types';
import { buildCompilerCommand } from './compilerCommand';
import { parseFasmErrors } from './fasmErrors';
import type { CompileResult } from './types';

export function defaultCompilerPath(platform: HostPlatform): string {
    return platform === 'win32' ? 'C:\\fasmw17335\\fasm.exe' : 'fasm';
}

export class FasmCompiler {
    constructor(private readonly outputChannel: vscode.OutputChannel) {}

    compile(sourcePath: string): Promise<CompileResult> {
        const config = vscode.workspace.getConfiguration('fasm');
        const compilerPath = config.get<string>('compilerPath', '') || defaultCompilerPath(process.platform);
        const command = buildCompilerCommand(compilerPath, sourcePath, {
            memoryLimit: config.get<number>('memoryLimit', 65536),
            passesLimit: config.get<number>('passesLimit', 100),
            symbolsPath: config.get<boolean>('generateSymbols', false) ? sourcePath.replace(/\.(asm|inc)$/i, '.fas') : undefined
        }, process.platform);

        const workingDirectory = path.dirname(sourcePath);
        const env = { ...process.env };
        if (command.includePaths.length > 0) {
            env.INCLUDE = [...command.includePaths, env.INCLUDE].filter(Boolean).join(path.delimiter);
        }

        return new Promise<CompileResult>((resolve) => {
            this.outputChannel.appendLine(`Command: "${command.command}" ${command.args.join(' ')}`);
            this.outputChannel.appendLine('');

            const child = cp.spawn(command.command, [...command.args], { cwd: workingDirectory, env });
            let output = '';

            const collect = (data: Buffer) => {
                const text = data.toString();
                output += text;
                this.outputChannel.append(text);
            };
            child.stdout.on('data', collect);
            child.stderr.on('data', collect);

            child.on('error', (error) => {
                this.outputChannel.appendLine(`Error: ${error.message}`);
                this.outputChannel.appendLine('');
                this.outputChannel.appendLine('Set the path to your compiler in the fasm.compilerPath setting.');
                resolve({ success: false, errors: [] });
            });

            child.on('close', (code) => {
                this.outputChannel.appendLine('');

                if (code === 0) {
                    this.outputChannel.appendLine('Build succeeded');
                    resolve({ success: true, errors: [] });
                    return;
                }

                this.outputChannel.appendLine(`Build failed with exit code ${code}`);
                resolve({ success: false, errors: parseFasmErrors(output, workingDirectory) });
            });
        });
    }
}
