format PE GUI 4.0
entry start

section '.text' code readable executable

start: mov eax,1
    jmp @b
    jne @f
    jmp @r
    mov al,$FF
    mov eax,$-msg
    mov eax,$$
    mov al,0E5h
    dw 10d
    dw 17q
    dw 1_000
    dd 1.5e3
    dd 1.0
    dd 1E0
    dd 1f
    lea rax,[rip+msg]
    mov eax,[eip]
    vaddps xmm16,xmm17,xmm31
    vaddps ymm16,ymm17,ymm31
    cmovne eax,ebx
    aesenc xmm0,xmm1
    pshufb xmm0,xmm1
    andn eax,ebx,ecx
    bextr eax,ebx,ecx
    bzhi eax,ebx,ecx
    mulx eax,ebx,ecx
    rdrand eax
    rdseed eax
    xgetbv
    prefetchnta [eax]
    kmovw k1,eax
    pclmulqdq xmm0,xmm1,0
    int3
    ud2
    endbr64
    mov eax,[data]
    mov eax,size
    mov eax,1 shl 4
    and eax,ebx
    not eax
    lock and [eax],1
    rep movsb
    lock add [eax],1
    times 5 nop
    mov eax,.loop
    bswap eax
    sete al
    popcnt eax,ebx
    invoke ExitProcess,0
    push MB_OK
.loop:
    pushfd
    movsd
    lfence

msg db 'Hello',0 ; comment
count equ 5
buf rb 10
if count and 1
    display 'odd'
end if
while count
end while

macro clear reg { xor reg,reg }
common

data import
end data

stack dd 0
bad db 'unterminated
; this comment must stay a comment
