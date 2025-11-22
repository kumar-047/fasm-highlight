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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fasmCompiler_1 = require("./fasmCompiler");
// FASM Extension Activation
let outputChannel;
let fasmCompiler;
function activate(context) {
    console.log('FASM extension is now active');
    // Create output channel
    outputChannel = vscode.window.createOutputChannel('FASM');
    fasmCompiler = new fasmCompiler_1.FasmCompiler(outputChannel);
    // Register build command
    const buildCommand = vscode.commands.registerCommand('fasm.build', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }
        const document = editor.document;
        if (document.languageId !== 'fasm') {
            vscode.window.showErrorMessage('Current file is not a FASM file');
            return;
        }
        // Save the file first
        await document.save();
        const filePath = document.fileName;
        const outputPath = filePath.replace(/\.(asm|inc)$/i, '.exe');
        outputChannel.show(true);
        outputChannel.appendLine(`Building ${path.basename(filePath)}...`);
        outputChannel.appendLine('');
        const success = await fasmCompiler.compile(filePath, outputPath);
        if (success) {
            vscode.window.showInformationMessage(`Build successful: ${path.basename(outputPath)}`);
        }
        else {
            vscode.window.showErrorMessage('Build failed. Check output for details.');
        }
    });
    // Register build and run command
    const buildAndRunCommand = vscode.commands.registerCommand('fasm.buildAndRun', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }
        const document = editor.document;
        if (document.languageId !== 'fasm') {
            vscode.window.showErrorMessage('Current file is not a FASM file');
            return;
        }
        // Save the file first
        await document.save();
        const filePath = document.fileName;
        const outputPath = filePath.replace(/\.(asm|inc)$/i, '.exe');
        outputChannel.show(true);
        outputChannel.appendLine(`Building ${path.basename(filePath)}...`);
        outputChannel.appendLine('');
        const success = await fasmCompiler.compile(filePath, outputPath);
        if (success) {
            vscode.window.showInformationMessage(`Build successful, running ${path.basename(outputPath)}...`);
            outputChannel.appendLine('');
            outputChannel.appendLine('='.repeat(60));
            outputChannel.appendLine('Running program:');
            outputChannel.appendLine('='.repeat(60));
            outputChannel.appendLine('');
            await fasmCompiler.run(outputPath);
        }
        else {
            vscode.window.showErrorMessage('Build failed. Check output for details.');
        }
    });
    context.subscriptions.push(buildCommand);
    context.subscriptions.push(buildAndRunCommand);
    context.subscriptions.push(outputChannel);
}
function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
}
//# sourceMappingURL=extension.js.map