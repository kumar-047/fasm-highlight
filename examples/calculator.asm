; Simple calculator demonstrating macros and arithmetic
format PE console
entry start

include 'win32a.inc'

; Macro for adding two numbers
macro add_numbers a, b, result
{
    mov eax, a
    add eax, b
    mov [result], eax
}

; Macro for multiplying two numbers
macro mul_numbers a, b, result
{
    mov eax, a
    imul eax, b
    mov [result], eax
}

section '.text' code readable executable

start:
    ; Add 10 + 20
    add_numbers 10, 20, num1
    
    ; Multiply 5 * 6
    mul_numbers 5, 6, num2
    
    ; Display results using console output
    push num1
    push format_str1
    push buffer
    call [wsprintf]
    add esp, 12
    
    push buffer
    call [printf]
    add esp, 4
    
    push num2
    push format_str2
    push buffer
    call [wsprintf]
    add esp, 12
    
    push buffer
    call [printf]
    add esp, 4
    
    ; Pause (wait for key)
    call [_getch]
    
    ; Exit
    push 0
    call [ExitProcess]

section '.data' data readable writeable

    num1 dd 0
    num2 dd 0
    buffer rb 256
    format_str1 db '10 + 20 = %d',13,10,0
    format_str2 db '5 * 6 = %d',13,10,0

section '.idata' import data readable writeable

    library kernel32,'KERNEL32.DLL',\
            msvcrt,'MSVCRT.DLL',\
            user32,'USER32.DLL'

    import kernel32,\
           ExitProcess,'ExitProcess'
           
    import msvcrt,\
           printf,'printf',\
           wsprintf,'wsprintf',\
           _getch,'_getch'
           
    import user32,\
           wsprintfA,'wsprintfA'
