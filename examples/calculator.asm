; Calculator example that teaches simple arithmetic macros
; and basic Win32 string formatting for output.
format PE GUI 4.0
entry start

include 'win32a.inc'

; Add two constants and store the result in memory.
macro add_numbers a, b, result
{
    mov eax, a
    add eax, b
    mov [result], eax
}

; Multiply two constants and store the result in memory.
macro mul_numbers a, b, result
{
    mov eax, a
    imul eax, b
    mov [result], eax
}

section '.text' code readable executable

start:
    add_numbers 10, 20, num1
    mul_numbers 7, 6, num2

    ; Build one readable result string inside the buffer.
    push [num2]
    push [num1]
    push result_format
    push buffer
    call [wsprintfA]
    add esp, 16

    push 0
    push caption
    push buffer
    push 0
    call [MessageBoxA]

    push 0
    call [ExitProcess]

section '.data' data readable writeable

    num1 dd 0
    num2 dd 0
    buffer rb 256
    result_format db '10 + 20 = %d',13,10,'7 * 6 = %d',0
    caption db 'Calculator Example',0

section '.idata' import data readable writeable

    library kernel32,'KERNEL32.DLL',\
            user32,'USER32.DLL'

    import kernel32,\
           ExitProcess,'ExitProcess'

    import user32,\
           MessageBoxA,'MessageBoxA',\
           wsprintfA,'wsprintfA'
