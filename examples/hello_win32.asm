; Windows 32-bit Hello World using MessageBox
format PE console
entry start

include 'win32a.inc'

section '.text' code readable executable

start:
    ; Display message box
    push 0                  ; MB_OK
    push title
    push message
    push 0                  ; NULL window handle
    call [MessageBoxA]
    
    ; Exit program
    push 0
    call [ExitProcess]

section '.data' data readable writeable

    message db 'Hello from FASM!',0
    title db 'FASM Example',0

section '.idata' import data readable writeable

    library kernel32,'KERNEL32.DLL',\
            user32,'USER32.DLL'

    import kernel32,\
           ExitProcess,'ExitProcess'

    import user32,\
           MessageBoxA,'MessageBoxA'
