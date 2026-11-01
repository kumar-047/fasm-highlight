import type { ManualSection } from '../../manual/constants/sections';
import type { HoverEntry } from '../types';

function instructionRows(rows: readonly (readonly [string, ManualSection, string, string])[]): HoverEntry[] {
    return rows.map(([symbol, section, summary, syntax]) => ({ symbol, category: 'Instruction', section, summary, syntax }));
}

export const HOVER_ENTRIES: readonly HoverEntry[] = [
    {
        symbol: 'format',
        category: 'Format',
        summary: 'Selects the output format for the assembled file.',
        syntax: 'format binary|PE|PE64|ELF|ELF64|MZ|COFF|MS COFF|MS64 COFF ...',
        notes: [
            'In flat assembler, output format is selected in source instead of by a compiler switch.',
            'Default output format is flat binary. Each format has its own set of additional directives.'
        ],
        example: 'format PE GUI 4.0',
        section: '2.4'
    },
    {
        symbol: 'entry',
        category: 'Format',
        summary: 'Marks the program entry symbol for formats that support entry points.',
        syntax: 'entry start_label',
        example: 'entry start',
        section: '2.4',
        platformNotes: {
            pe: ['For PE output, entry sets the RVA of the program entry point.'],
            elf32: ['Common in executable ELF sources, though the surrounding format and layout decide the final binary structure.'],
            elf64: ['Often paired with an executable ELF format and a code segment entry label.']
        }
    },
    {
        symbol: 'include',
        category: 'Preprocessor',
        summary: 'Includes another source file before assembly continues.',
        syntax: "include 'file.inc'",
        notes: [
            'Typically used for macro packages, platform include files, and API declarations.'
        ],
        example: "include 'win32a.inc'",
        section: '2.3.1'
    },
    {
        symbol: 'section',
        category: 'Format',
        summary: 'Begins a named section in formatted output such as PE or ELF.',
        syntax: "section '.text' code readable executable",
        section: '2.4',
        platformNotes: {
            pe: ['PE sources commonly use named sections such as .text, .data, and .idata.'],
            elf32: ['ELF examples often use segment, but section-based layouts are also valid in many FASM sources.']
        }
    },
    {
        symbol: 'segment',
        category: 'Format',
        summary: 'Begins a segment or section-like block depending on the output format.',
        syntax: 'segment readable executable',
        section: '2.4'
    },
    {
        symbol: 'macro',
        category: 'Preprocessor',
        summary: 'Defines a macroinstruction expanded by the preprocessor.',
        syntax: 'macro name [parameters] { ... }',
        notes: [
            'Use local inside the macro body when you need unique private symbols.'
        ],
        example: 'macro clear_reg reg { xor reg, reg }',
        section: '2.3.3'
    },
    {
        symbol: 'struc',
        category: 'Preprocessor',
        summary: 'Defines a labeled macroinstruction for structure-like layouts.',
        syntax: 'struc NAME [parameters] { ... }',
        example: 'struc POINT { .x dd ? ; .y dd ? }',
        section: '2.3.4'
    },
    {
        symbol: 'proc',
        category: 'Macro helper',
        summary: 'Common macro-based procedure declaration used by include packages.',
        syntax: 'proc Name [args]',
        notes: [
            'This is usually provided by include files such as win32a.inc or helper macro packages, not by the core assembler itself.'
        ],
        platformNotes: {
            pe: ['In Win32-style sources this often comes from win32a.inc helper macros.']
        }
    },
    {
        symbol: 'endp',
        category: 'Macro helper',
        summary: 'Closes a proc block created by macro packages.',
        syntax: 'endp',
        notes: [
            'Like proc, this is generally macro-package syntax rather than a core assembler keyword.'
        ]
    },
    {
        symbol: 'invoke',
        category: 'Macro helper',
        summary: 'Calls an API or procedure using a macro package that prepares arguments for the target calling convention.',
        syntax: 'invoke Function,arg1,arg2,...',
        notes: [
            'Usually comes from platform include files or helper macro packages, not the core assembler syntax.'
        ],
        platformNotes: {
            pe: ['In Win32 sources this is commonly used for imported API calls when helper macros are available.']
        }
    },
    {
        symbol: 'stdcall',
        category: 'Macro helper',
        summary: 'Invokes a procedure using stdcall-style argument setup through a macro package.',
        syntax: 'stdcall Procedure,arg1,arg2,...',
        platformNotes: {
            pe: ['Especially common in Win32 API-style macro layers.']
        }
    },
    {
        symbol: 'cinvoke',
        category: 'Macro helper',
        summary: 'Invokes a procedure using cdecl-style argument setup through a helper macro package.',
        syntax: 'cinvoke Procedure,arg1,arg2,...'
    },
    {
        symbol: 'library',
        category: 'Macro helper',
        summary: 'Declares imported libraries through macro helpers used by packaged include files.',
        syntax: "library kernel32,'KERNEL32.DLL'",
        notes: [
            'This is typically provided by PE include packages rather than the minimal core syntax.'
        ],
        example: "library kernel32,'KERNEL32.DLL',\\ user32,'USER32.DLL'",
        platformNotes: {
            pe: ['Common in Win32 PE sources that use import-helper macros to build the .idata section.']
        }
    },
    {
        symbol: 'import',
        category: 'Format',
        summary: 'Declares imported symbols using helper macros from include packages.',
        syntax: "import kernel32, ExitProcess,'ExitProcess'",
        notes: [
            'This is often macro-driven syntax layered on top of the target format.'
        ],
        section: '2.4.2',
        platformNotes: {
            pe: ['Used in PE/Win32 sources to populate import tables through helper includes.']
        }
    },
    {
        symbol: 'export',
        category: 'Format',
        summary: 'Declares exported symbols through format-specific support.',
        syntax: "export MyLibrary,'ExportedName', symbol",
        section: '2.4.2',
        platformNotes: {
            pe: ['Commonly used when building DLL-style PE outputs.']
        }
    },
    {
        symbol: 'heap',
        category: 'Format',
        summary: 'Sets the heap size information for Portable Executable output.',
        syntax: 'heap reserve[, commit]',
        section: '2.4.2',
        platformNotes: {
            pe: ['Applies to PE output only.']
        }
    },
    {
        symbol: 'stack',
        category: 'Format',
        summary: 'Sets the stack size information for Portable Executable output.',
        syntax: 'stack reserve[, commit]',
        section: '2.4.2',
        platformNotes: {
            pe: ['Applies to PE output only.']
        }
    },
    {
        symbol: 'db',
        category: 'Data',
        summary: 'Defines one or more bytes in the output.',
        syntax: 'db value[, value ...]',
        notes: [
            'Accepts numeric expressions and string literals.'
        ],
        example: "message db 'Hello',0",
        section: '1.2.2'
    },
    {
        symbol: 'dw',
        category: 'Data',
        summary: 'Defines 16-bit words in the output.',
        syntax: 'dw value[, value ...]',
        section: '1.2.2'
    },
    {
        symbol: 'dd',
        category: 'Data',
        summary: 'Defines 32-bit doublewords in the output.',
        syntax: 'dd value[, value ...]',
        section: '1.2.2'
    },
    {
        symbol: 'dq',
        category: 'Data',
        summary: 'Defines 64-bit quadwords in the output.',
        syntax: 'dq value[, value ...]',
        section: '1.2.2'
    },
    {
        symbol: 'rb',
        category: 'Data',
        summary: 'Reserves a number of bytes without defining explicit contents.',
        syntax: 'rb count',
        section: '1.2.2'
    },
    {
        symbol: 'rw',
        category: 'Data',
        summary: 'Reserves 16-bit words.',
        syntax: 'rw count',
        section: '1.2.2'
    },
    {
        symbol: 'rd',
        category: 'Data',
        summary: 'Reserves 32-bit doublewords.',
        syntax: 'rd count',
        section: '1.2.2'
    },
    {
        symbol: 'rq',
        category: 'Data',
        summary: 'Reserves 64-bit quadwords.',
        syntax: 'rq count',
        section: '1.2.2'
    },
    {
        symbol: 'equ',
        category: 'Preprocessor',
        summary: 'Defines a symbolic constant whose value is substituted as text during preprocessing.',
        syntax: 'name equ value',
        notes: [
            'This performs text substitution, not numeric evaluation. For numeric constants, use the = operator.',
            'The value can be any sequence of symbols and is substituted literally before assembly.'
        ],
        section: '2.3.2'
    },
    {
        symbol: 'if',
        category: 'Directive',
        summary: 'Assembles the following block only when the expression is non-zero.',
        syntax: 'if condition ... else ... end if',
        section: '2.2.2'
    },
    {
        symbol: 'repeat',
        category: 'Directive',
        summary: 'Repeats a block of source a specified number of times.',
        syntax: 'repeat count ... end repeat',
        section: '2.2.3'
    },
    {
        symbol: 'virtual',
        category: 'Directive',
        summary: 'Creates a virtual addressing space for layout calculations without writing bytes directly to the current output stream.',
        syntax: 'virtual [at address] ... end virtual',
        section: '2.2.4'
    },
    {
        symbol: 'org',
        category: 'Directive',
        summary: 'Sets the origin address used for address calculations in flat binary style output.',
        syntax: 'org address',
        section: '2.2.4',
        platformNotes: {
            mz: ['Often seen in flat-binary and DOS-oriented layouts.']
        }
    },
    {
        symbol: 'use16',
        category: 'Directive',
        summary: 'Assembles subsequent instructions in 16-bit mode.',
        syntax: 'use16',
        section: '2.4'
    },
    {
        symbol: 'use32',
        category: 'Directive',
        summary: 'Assembles subsequent instructions in 32-bit mode.',
        syntax: 'use32',
        section: '2.4'
    },
    {
        symbol: 'use64',
        category: 'Directive',
        summary: 'Assembles subsequent instructions in 64-bit mode.',
        syntax: 'use64',
        section: '2.4'
    },
    {
        symbol: 'byte',
        category: 'Data',
        summary: 'Treats a memory operand or data expression as 8-bit.',
        syntax: 'byte [address]'
    },
    {
        symbol: 'word',
        category: 'Data',
        summary: 'Treats a memory operand or data expression as 16-bit.',
        syntax: 'word [address]'
    },
    {
        symbol: 'dword',
        category: 'Data',
        summary: 'Treats a memory operand or data expression as 32-bit.',
        syntax: 'dword [address]'
    },
    {
        symbol: 'qword',
        category: 'Data',
        summary: 'Treats a memory operand or data expression as 64-bit.',
        syntax: 'qword [address]'
    },
    {
        symbol: 'mov',
        category: 'Instruction',
        summary: 'Copies data from the source operand into the destination operand.',
        syntax: 'mov destination, source',
        notes: [
            'Memory-to-memory mov is not allowed directly in x86.'
        ],
        section: '2.1.1'
    },
    {
        symbol: 'lea',
        category: 'Instruction',
        summary: 'Loads the effective address of a memory expression into a register.',
        syntax: 'lea register, [address_expression]',
        section: '2.1.11'
    },
    {
        symbol: 'add',
        category: 'Instruction',
        summary: 'Adds the source operand to the destination operand.',
        syntax: 'add destination, source',
        section: '2.1.3'
    },
    {
        symbol: 'sub',
        category: 'Instruction',
        summary: 'Subtracts the source operand from the destination operand.',
        syntax: 'sub destination, source',
        section: '2.1.3'
    },
    {
        symbol: 'cmp',
        category: 'Instruction',
        summary: 'Compares two operands by subtracting source from destination and updating flags.',
        syntax: 'cmp left, right',
        section: '2.1.3'
    },
    {
        symbol: 'call',
        category: 'Instruction',
        summary: 'Transfers control to a procedure and stores a return address.',
        syntax: 'call target',
        section: '2.1.6'
    },
    {
        symbol: 'ret',
        category: 'Instruction',
        summary: 'Returns from a procedure using the address on the stack.',
        syntax: 'ret',
        section: '2.1.6'
    },
    {
        symbol: 'jmp',
        category: 'Instruction',
        summary: 'Unconditionally jumps to another code location.',
        syntax: 'jmp target',
        section: '2.1.6'
    },
    {
        symbol: 'push',
        category: 'Instruction',
        summary: 'Pushes an operand onto the stack.',
        syntax: 'push value',
        section: '2.1.1'
    },
    {
        symbol: 'pop',
        category: 'Instruction',
        summary: 'Pops the top stack value into the destination operand.',
        syntax: 'pop destination',
        section: '2.1.1'
    },
    {
        symbol: 'syscall',
        category: 'Instruction',
        summary: 'Invokes the operating system through the x86-64 syscall mechanism.',
        syntax: 'syscall',
        section: '2.1.19'
    },
    {
        symbol: 'int',
        category: 'Instruction',
        summary: 'Triggers a software interrupt.',
        syntax: 'int imm8',
        section: '2.1.6'
    },
    {
        symbol: 'eax',
        category: 'Register',
        summary: '32-bit accumulator register in x86.',
        notes: [
            'Often used implicitly by arithmetic, return values, and legacy calling conventions.'
        ]
    },
    {
        symbol: 'ebx',
        category: 'Register',
        summary: '32-bit general-purpose base register in x86.'
    },
    {
        symbol: 'ecx',
        category: 'Register',
        summary: '32-bit general-purpose count register in x86.',
        notes: [
            'Frequently used by shift instructions, string operations, and loop-style constructs.'
        ]
    },
    {
        symbol: 'edx',
        category: 'Register',
        summary: '32-bit general-purpose data register in x86.',
        notes: [
            'Often paired with EAX for multiply/divide operations.'
        ]
    },
    {
        symbol: 'esi',
        category: 'Register',
        summary: '32-bit source index register.'
    },
    {
        symbol: 'edi',
        category: 'Register',
        summary: '32-bit destination index register.'
    },
    {
        symbol: 'esp',
        category: 'Register',
        summary: '32-bit stack pointer register.'
    },
    {
        symbol: 'ebp',
        category: 'Register',
        summary: '32-bit base pointer register, often used for stack frame access.'
    },
    {
        symbol: 'rax',
        category: 'Register',
        summary: '64-bit accumulator register in x86-64.'
    },
    {
        symbol: 'rbx',
        category: 'Register',
        summary: '64-bit general-purpose base register in x86-64.'
    },
    {
        symbol: 'rcx',
        category: 'Register',
        summary: '64-bit general-purpose register. On Win64 it is also the first integer argument register.',
        platformNotes: {
            pe: ['In Win64 calling conventions, RCX commonly carries the first integer or pointer argument.']
        }
    },
    {
        symbol: 'rdx',
        category: 'Register',
        summary: '64-bit general-purpose register. On Win64 it is also the second integer argument register.',
        platformNotes: {
            pe: ['In Win64 calling conventions, RDX commonly carries the second integer or pointer argument.']
        }
    },
    {
        symbol: 'rsi',
        category: 'Register',
        summary: '64-bit source index register.'
    },
    {
        symbol: 'rdi',
        category: 'Register',
        summary: '64-bit destination index register.'
    },
    {
        symbol: 'rsp',
        category: 'Register',
        summary: '64-bit stack pointer register.'
    },
    {
        symbol: 'rbp',
        category: 'Register',
        summary: '64-bit base pointer register.'
    },
    {
        symbol: 'r8',
        category: 'Register',
        summary: '64-bit extended general-purpose register.',
        platformNotes: {
            pe: ['In Win64 calling conventions, R8 commonly carries the third integer or pointer argument.']
        }
    },
    {
        symbol: 'r9',
        category: 'Register',
        summary: '64-bit extended general-purpose register.',
        platformNotes: {
            pe: ['In Win64 calling conventions, R9 commonly carries the fourth integer or pointer argument.']
        }
    },
    {
        symbol: 'xmm0',
        category: 'Register',
        summary: '128-bit SIMD register from the XMM register set.'
    },
    {
        symbol: 'ymm0',
        category: 'Register',
        summary: '256-bit SIMD register from the YMM register set.'
    },
    {
        symbol: 'zmm0',
        category: 'Register',
        summary: '512-bit SIMD register from the ZMM register set.'
    },

    {
        symbol: 'label',
        category: 'Directive',
        summary: 'Defines a label with optional size and address specification.',
        syntax: 'label name [size] [at address]',
        notes: [
            'Unlike a simple label with colon, this form allows specifying a size for the labeled location.',
            'Can define a label at a register-based address for structure access patterns.'
        ],
        example: 'label myaddr at ebp+4',
        section: '1.2.3'
    },
    {
        symbol: 'times',
        category: 'Directive',
        summary: 'Repeats a single instruction a specified number of times.',
        syntax: 'times count instruction',
        notes: [
            'The special % symbol inside the instruction equals the current repeat number.',
            'Can be nested: times 3 times % db % generates six bytes.'
        ],
        example: 'times 5 db %',
        section: '2.2.3'
    },
    {
        symbol: 'while',
        category: 'Directive',
        summary: 'Repeats a block as long as the condition is true.',
        syntax: 'while condition ... end while',
        notes: [
            'The % symbol holds the current iteration number.',
            'Use break to exit the loop early.'
        ],
        section: '2.2.3'
    },
    {
        symbol: 'break',
        category: 'Directive',
        summary: 'Stops the current repeat or while loop and continues after end repeat/end while.',
        syntax: 'break',
        section: '2.2.3'
    },
    {
        symbol: 'load',
        category: 'Directive',
        summary: 'Defines a constant with a binary value loaded from already assembled code.',
        syntax: 'load name [size] from address',
        notes: [
            'The size operator specifies how many bytes (up to 8) to load.',
            'Can only load from addresses already assembled in the current addressing space.'
        ],
        section: '2.2.4'
    },
    {
        symbol: 'store',
        category: 'Directive',
        summary: 'Modifies already generated code by replacing data at a given address.',
        syntax: 'store [size] value at address',
        notes: [
            'This is an advanced directive — use carefully.',
            'Can only modify addresses in the current addressing space that have already been assembled.'
        ],
        section: '2.2.4'
    },
    {
        symbol: 'display',
        category: 'Directive',
        summary: 'Displays a message at assembly time.',
        syntax: 'display string_or_byte[, ...]',
        notes: [
            'Only messages from the final assembly pass are actually displayed.',
            'Accepts quoted strings and byte values separated by commas.'
        ],
        example: "display 'Assembly complete',13,10",
        section: '2.2.5'
    },
    {
        symbol: 'align',
        category: 'Directive',
        summary: 'Aligns the current offset to a specified boundary.',
        syntax: 'align boundary',
        notes: [
            'The boundary must be a power of two.',
            'Skipped bytes are filled with NOP instructions and marked as uninitialized.'
        ],
        example: 'align 16',
        section: '2.2.5'
    },
    {
        symbol: 'assert',
        category: 'Directive',
        summary: 'Tests a condition and signals an error only on the final pass if false.',
        syntax: 'assert condition',
        notes: [
            'Unlike err, assert does not stop assembly during intermediate passes.',
            'Use assert 0 in place of err when you want deferred error reporting.'
        ],
        section: '2.2.5'
    },
    {
        symbol: 'err',
        category: 'Directive',
        summary: 'Immediately terminates the assembly process.',
        syntax: 'err',
        notes: [
            'Stops assembly immediately, even during intermediate passes.',
            'Often used with if to halt on detected misconfigurations.'
        ],
        section: '2.2.5'
    },
    {
        symbol: 'data',
        category: 'Format',
        summary: 'Begins definition of special PE data (export, import, resource, fixups).',
        syntax: 'data identifier ... end data',
        notes: [
            'The identifier can be export, import, resource, fixups, or a numeric PE data directory index.',
            'Fixups data is generated automatically when this identifier is used.'
        ],
        section: '2.4.2',
        platformNotes: {
            pe: ['Used in PE executables to define special data directories.']
        }
    },
    {
        symbol: 'define',
        category: 'Preprocessor',
        summary: 'Defines a symbolic constant without expanding other constants in the value.',
        syntax: 'define name value',
        notes: [
            'Unlike equ, define assigns the value as-is without substituting symbolic constants within it.',
            'Useful in advanced macro constructions where literal text preservation is needed.'
        ],
        section: '2.3.2'
    },
    {
        symbol: 'fix',
        category: 'Preprocessor',
        summary: 'Defines a high-priority symbolic constant that is replaced before all other preprocessing.',
        syntax: 'name fix value',
        notes: [
            'Fix constants are replaced even before preprocessor directives and macros are recognized.',
            'Can be used to create aliases for preprocessor directives themselves.'
        ],
        example: 'incl fix include',
        section: '2.3.2'
    },
    {
        symbol: 'rept',
        category: 'Preprocessor',
        summary: 'Repeats a block of source as a macroinstruction a specified number of times.',
        syntax: 'rept count [counter[:base]] { ... }',
        notes: [
            'The counter symbol is replaced with the current repetition number.',
            'Supports multiple counters with different bases, separated by commas.',
            'Unlike repeat, this is processed at preprocessing time, not assembly time.'
        ],
        example: 'rept 3 n { byte#n db n }',
        section: '2.3.5'
    },
    {
        symbol: 'irp',
        category: 'Preprocessor',
        summary: 'Iterates a single argument through a comma-separated list of parameters.',
        syntax: 'irp arg, param1, param2, ... { ... }',
        example: 'irp value, 2,3,5 { db value }',
        section: '2.3.5'
    },
    {
        symbol: 'irps',
        category: 'Preprocessor',
        summary: 'Iterates through a sequence of individual symbols.',
        syntax: 'irps arg, symbol1 symbol2 ... { ... }',
        notes: [
            'Each symbol (name, character, or quoted string) becomes one argument value per iteration.',
            'Symbols are space-separated, not comma-separated.'
        ],
        example: 'irps reg, al bx ecx { xor reg,reg }',
        section: '2.3.5'
    },
    {
        symbol: 'irpv',
        category: 'Preprocessor',
        summary: 'Iterates through all values that were assigned to a symbolic variable.',
        syntax: 'irpv arg, variable { ... }',
        notes: [
            'Iterates the history of values assigned to the named symbolic constant.',
            'Added in FASM 1.72.'
        ],
        section: '2.3.5'
    },
    {
        symbol: 'match',
        category: 'Preprocessor',
        summary: 'Conditionally preprocesses a block when a symbol sequence matches a pattern.',
        syntax: 'match pattern, symbols { ... }',
        notes: [
            'Symbolic constants in the matched sequence are replaced with their values before matching.',
            'Name symbols in the pattern match any sequence and become parameters inside the block.'
        ],
        example: "match =TRUE, DEBUG { include 'debug.inc' }",
        section: '2.3.6'
    },
    {
        symbol: 'postpone',
        category: 'Preprocessor',
        summary: 'Defines a nameless macroinstruction that executes when the preprocessor reaches end of source.',
        syntax: 'postpone { ... }',
        notes: [
            'Delegates a block of instructions to be processed at the end of preprocessing.',
            'Added in FASM 1.72.'
        ],
        section: '2.3.3'
    },
    {
        symbol: 'purge',
        category: 'Preprocessor',
        summary: 'Removes the last definition of a macroinstruction.',
        syntax: 'purge name[, name ...]',
        notes: [
            'Successive purge calls remove successive layers of macro redefinition.',
            'No error if the named macro does not exist.'
        ],
        section: '2.3.3'
    },
    {
        symbol: 'restore',
        category: 'Preprocessor',
        summary: 'Reverts a symbolic constant to its previous value.',
        syntax: 'restore name[, name ...]',
        notes: [
            'Each restore undoes one layer of equ/define redefinition.',
            'If no such constant exists, restore is silently ignored.'
        ],
        section: '2.3.2'
    },
    {
        symbol: 'restruc',
        category: 'Preprocessor',
        summary: 'Removes the last definition of a structure macroinstruction.',
        syntax: 'restruc name[, name ...]',
        notes: [
            'Works like purge but for structure macroinstructions defined with struc.'
        ],
        section: '2.3.4'
    },
    {
        symbol: 'extrn',
        category: 'Format',
        summary: 'Declares an external symbol for COFF or ELF object output.',
        syntax: "extrn [name_string as] symbol[:size]",
        example: "extrn '__imp__MessageBoxA@16' as MessageBox:dword",
        section: '2.4.3'
    },
    {
        symbol: 'public',
        category: 'Format',
        summary: 'Declares an existing symbol as public for COFF or ELF object output.',
        syntax: "public symbol [as 'export_name']",
        example: "public start as '_start'",
        section: '2.4.3'
    },
    {
        symbol: 'file',
        category: 'Data',
        summary: 'Includes binary data from an external file.',
        syntax: "file 'filename'[:offset][,count]",
        notes: [
            'If no count is specified, all data from offset to end of file is included.',
            'File paths can contain environment variables enclosed in % characters.'
        ],
        example: "file 'data.bin':10h,4",
        section: '1.2.2'
    },

    {
        symbol: 'dt',
        category: 'Data',
        summary: 'Defines 10-byte (tbyte) data, used for FPU extended precision values.',
        syntax: 'dt value[, value ...]',
        notes: [
            'With a single expression, accepts only floating point values in FPU double extended precision format.',
            'With colon syntax (word:qword), defines a far pointer.'
        ],
        section: '1.2.2'
    },
    {
        symbol: 'rt',
        category: 'Data',
        summary: 'Reserves 10-byte (tbyte) units of uninitialized space.',
        syntax: 'rt count',
        section: '1.2.2'
    },
    {
        symbol: 'du',
        category: 'Data',
        summary: 'Defines word-sized data, converting string characters to 16-bit with zeroed high byte.',
        syntax: 'du value[, value ...]',
        notes: [
            'Commonly used for wide (Unicode) character strings in FASM.'
        ],
        example: "du 'Hello',0",
        section: '1.2.2'
    },
    {
        symbol: 'dp',
        category: 'Data',
        summary: 'Defines 6-byte (pword/fword) far pointer data.',
        syntax: 'dp value | dp high_word:low_dword',
        notes: [
            'dp and df are synonyms.',
            'Accepts two values separated by colon: high word and low dword.'
        ],
        section: '1.2.2'
    },
    {
        symbol: 'df',
        category: 'Data',
        summary: 'Defines 6-byte (fword/pword) data. Synonym for dp.',
        syntax: 'df value | df high_word:low_dword',
        section: '1.2.2'
    },
    {
        symbol: 'rp',
        category: 'Data',
        summary: 'Reserves 6-byte (pword) units of uninitialized space.',
        syntax: 'rp count',
        section: '1.2.2'
    },
    {
        symbol: 'rf',
        category: 'Data',
        summary: 'Reserves 6-byte (fword) units of uninitialized space. Synonym for rp.',
        syntax: 'rf count',
        section: '1.2.2'
    },

    {
        symbol: 'ax',
        category: 'Register',
        summary: '16-bit accumulator register.'
    },
    {
        symbol: 'bx',
        category: 'Register',
        summary: '16-bit base register. Used for addressing in real/16-bit mode.'
    },
    {
        symbol: 'cx',
        category: 'Register',
        summary: '16-bit count register. Used by loop, shift, and string instructions.'
    },
    {
        symbol: 'dx',
        category: 'Register',
        summary: '16-bit data register. Paired with AX for multiply/divide and I/O.'
    },
    {
        symbol: 'si',
        category: 'Register',
        summary: '16-bit source index register.'
    },
    {
        symbol: 'di',
        category: 'Register',
        summary: '16-bit destination index register.'
    },
    {
        symbol: 'bp',
        category: 'Register',
        summary: '16-bit base pointer register.'
    },
    {
        symbol: 'sp',
        category: 'Register',
        summary: '16-bit stack pointer register.'
    },
    {
        symbol: 'al',
        category: 'Register',
        summary: 'Low 8 bits of AX. The primary 8-bit accumulator.'
    },
    {
        symbol: 'bl',
        category: 'Register',
        summary: 'Low 8 bits of BX.'
    },
    {
        symbol: 'cl',
        category: 'Register',
        summary: 'Low 8 bits of CX. Used as shift count by shift/rotate instructions.'
    },
    {
        symbol: 'dl',
        category: 'Register',
        summary: 'Low 8 bits of DX.'
    },
    {
        symbol: 'ah',
        category: 'Register',
        summary: 'High 8 bits of AX.'
    },
    {
        symbol: 'bh',
        category: 'Register',
        summary: 'High 8 bits of BX.'
    },
    {
        symbol: 'ch',
        category: 'Register',
        summary: 'High 8 bits of CX.'
    },
    {
        symbol: 'dh',
        category: 'Register',
        summary: 'High 8 bits of DX.'
    },
    {
        symbol: 'sil',
        category: 'Register',
        summary: 'Low 8 bits of RSI. Available only in 64-bit mode.'
    },
    {
        symbol: 'dil',
        category: 'Register',
        summary: 'Low 8 bits of RDI. Available only in 64-bit mode.'
    },
    {
        symbol: 'bpl',
        category: 'Register',
        summary: 'Low 8 bits of RBP. Available only in 64-bit mode.'
    },
    {
        symbol: 'spl',
        category: 'Register',
        summary: 'Low 8 bits of RSP. Available only in 64-bit mode.'
    },
    {
        symbol: 'cs',
        category: 'Register',
        summary: 'Code segment register.'
    },
    {
        symbol: 'ds',
        category: 'Register',
        summary: 'Data segment register. Default segment for most memory accesses.'
    },
    {
        symbol: 'es',
        category: 'Register',
        summary: 'Extra segment register. Used by string destination operations.'
    },
    {
        symbol: 'fs',
        category: 'Register',
        summary: 'General-purpose segment register. On 32-bit Windows it points to the TEB, and on x86-64 Linux it is used for thread-local storage.'
    },
    {
        symbol: 'gs',
        category: 'Register',
        summary: 'General-purpose segment register. On 64-bit Windows it points to the TEB.'
    },
    {
        symbol: 'ss',
        category: 'Register',
        summary: 'Stack segment register.'
    },
    {
        symbol: 'st0',
        category: 'Register',
        summary: 'FPU register — top of the x87 floating-point stack.'
    },
    {
        symbol: 'mm0',
        category: 'Register',
        summary: '64-bit MMX register. Aliases the low 64 bits of the corresponding FPU register.'
    },

    ...instructionRows([
        ['mul', '2.1.3', 'Unsigned multiply of the accumulator by the operand.', 'mul operand'],
        ['imul', '2.1.3', 'Signed multiply, with one, two or three operands.', 'imul operand | imul destination, source[, immediate]'],
        ['div', '2.1.3', 'Unsigned divide of the accumulator by the operand.', 'div operand'],
        ['idiv', '2.1.3', 'Signed divide of the accumulator by the operand.', 'idiv operand'],
        ['adc', '2.1.3', 'Adds the source and the carry flag to the destination.', 'adc destination, source'],
        ['sbb', '2.1.3', 'Subtracts the source and the carry flag from the destination.', 'sbb destination, source'],
        ['inc', '2.1.3', 'Adds one to the operand without changing the carry flag.', 'inc operand'],
        ['dec', '2.1.3', 'Subtracts one from the operand without changing the carry flag.', 'dec operand'],
        ['neg', '2.1.3', 'Replaces the operand with its two\'s complement.', 'neg operand'],
        ['xadd', '2.1.3', 'Exchanges the operands and stores their sum in the destination.', 'xadd destination, source'],
        ['xchg', '2.1.1', 'Swaps the contents of two operands.', 'xchg first, second'],
        ['movzx', '2.1.2', 'Copies a smaller value into a larger register, filling with zeros.', 'movzx register, source'],
        ['movsx', '2.1.2', 'Copies a smaller value into a larger register, extending the sign.', 'movsx register, source'],
        ['cbw', '2.1.2', 'Sign-extends AL into AX.', 'cbw'],
        ['cwd', '2.1.2', 'Sign-extends AX into DX:AX.', 'cwd'],
        ['and', '2.1.5', 'Bitwise AND. Inside an expression, this word is the AND operator.', 'and destination, source'],
        ['or', '2.1.5', 'Bitwise OR. Inside an expression, this word is the OR operator.', 'or destination, source'],
        ['xor', '2.1.5', 'Bitwise exclusive OR. Inside an expression, this word is the XOR operator.', 'xor destination, source'],
        ['not', '2.1.5', 'Inverts every bit of the operand. Inside an expression, this word is the NOT operator.', 'not operand'],
        ['test', '2.1.5', 'Sets flags from a bitwise AND without storing the result.', 'test first, second'],
        ['shl', '2.1.5', 'Shifts left. Inside an expression, this word is the shift operator.', 'shl destination, count'],
        ['shr', '2.1.5', 'Shifts right, filling with zeros. Inside an expression, this word is the shift operator.', 'shr destination, count'],
        ['sal', '2.1.5', 'Arithmetic shift left. Same operation as shl.', 'sal destination, count'],
        ['sar', '2.1.5', 'Arithmetic shift right, keeping the sign bit.', 'sar destination, count'],
        ['rol', '2.1.5', 'Rotates bits left.', 'rol destination, count'],
        ['ror', '2.1.5', 'Rotates bits right.', 'ror destination, count'],
        ['rcl', '2.1.5', 'Rotates bits left through the carry flag.', 'rcl destination, count'],
        ['rcr', '2.1.5', 'Rotates bits right through the carry flag.', 'rcr destination, count'],
        ['bt', '2.1.5', 'Copies the selected bit into the carry flag.', 'bt operand, bit'],
        ['bsf', '2.1.5', 'Finds the lowest set bit of the source.', 'bsf destination, source'],
        ['bsr', '2.1.5', 'Finds the highest set bit of the source.', 'bsr destination, source'],
        ['bswap', '2.1.5', 'Reverses the byte order of a register.', 'bswap register'],
        ['cpuid', '2.1.11', 'Returns processor identification and feature information.', 'cpuid'],
        ['nop', '2.1.11', 'Does nothing except take up space and time.', 'nop'],
        ['enter', '2.1.11', 'Creates a stack frame for a procedure.', 'enter size, nesting'],
        ['leave', '2.1.11', 'Releases the stack frame created for a procedure.', 'leave'],
        ['loop', '2.1.6', 'Decrements the count register and jumps while it is not zero.', 'loop target'],
        ['lock', '2.1.12', 'Prefix that makes the next read-modify-write instruction atomic.', 'lock instruction'],
        ['rep', '2.1.8', 'Prefix that repeats a string instruction by the count register.', 'rep instruction'],
        ['stc', '2.1.9', 'Sets the carry flag.', 'stc'],
        ['clc', '2.1.9', 'Clears the carry flag.', 'clc'],
        ['popcnt', '2.1.20', 'Counts the set bits of the source.', 'popcnt destination, source'],
        ['lzcnt', '2.1.20', 'Counts the leading zero bits of the source.', 'lzcnt destination, source'],
        ['tzcnt', '2.1.23', 'Counts the trailing zero bits of the source.', 'tzcnt destination, source']
    ])
];
