"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FasmCompiler = void 0;
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
class FasmCompiler {
    constructor(outputChannel) {
        this.outputChannel = outputChannel;
    }
    /**
     * Compile a FASM source file
     * @param sourcePath Path to the .asm source file
     * @param outputPath Path for the output executable
     * @returns Promise<boolean> true if compilation succeeded
     */
    async compile(sourcePath, outputPath) {
        const config = vscode.workspace.getConfiguration('fasm');
        const compilerPath = config.get('compilerPath', 'C:\\fasmw17332\\fasm.exe');
        const memoryLimit = config.get('memoryLimit', 65536);
        const passesLimit = config.get('passesLimit', 100);
        const generateSymbols = config.get('generateSymbols', false);
        // Build command arguments
        const args = [sourcePath];
        if (outputPath) {
            args.push(outputPath);
        }
        // Add optional flags
        args.push('-m', memoryLimit.toString());
        args.push('-p', passesLimit.toString());
        if (generateSymbols) {
            const symbolsPath = outputPath ? outputPath.replace(/\.exe$/i, '.fas') : sourcePath.replace(/\.(asm|inc)$/i, '.fas');
            args.push('-s', symbolsPath);
        }
        return new Promise((resolve) => {
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
                    this.outputChannel.appendLine('✓ Build succeeded');
                    resolve(true);
                }
                else {
                    this.outputChannel.appendLine(`✗ Build failed with exit code ${code}`);
                    this.parseErrors(stdout + stderr, sourcePath);
                    resolve(false);
                }
            });
        });
    }
    /**
     * Run a compiled executable
     * @param exePath Path to the executable
     */
    async run(exePath) {
        return new Promise((resolve) => {
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
    /**
     * Parse FASM error messages and display diagnostics
     * @param output Compiler output
     * @param sourcePath Source file path
     */
    parseErrors(output, sourcePath) {
        this.outputChannel.appendLine('');
        this.outputChannel.appendLine('Errors:');
        // FASM error format: filename [line] error message
        const errorRegex = /^(.+?)\s+\[(\d+)\]\s+(.+)$/gm;
        let match;
        while ((match = errorRegex.exec(output)) !== null) {
            const [, file, line, message] = match;
            this.outputChannel.appendLine(`  Line ${line}: ${message}`);
        }
        // Also look for general error messages
        const generalErrorRegex = /error:(.+)/gi;
        while ((match = generalErrorRegex.exec(output)) !== null) {
            this.outputChannel.appendLine(`  ${match[1].trim()}`);
        }
    }
}
exports.FasmCompiler = FasmCompiler;
//# sourceMappingURL=fasmCompiler.js.map