; Snake game example for Win32 GUI FASM programs.
; This example is intentionally richer than the other samples, so the
; comments focus on game flow and drawing flow instead of every instruction.
format PE GUI 4.0
entry start

include 'win32a.inc'

section '.data' data readable writeable
  class_name db 'FASMSNAKE',0
  window_title db 'Snake Game - Use Arrow Keys',0

  ; Game board constants.
  GRID_SIZE = 15
  CELL_SIZE = 20
  WIN_WIDTH = GRID_SIZE * CELL_SIZE + 16
  WIN_HEIGHT = GRID_SIZE * CELL_SIZE + 60
  MAX_SNAKE_LEN = 400
  TIMER_ID = 1
  TIMER_DELAY_MS = 150

  ; Direction constants.
  DIR_UP = 0
  DIR_RIGHT = 1
  DIR_DOWN = 2
  DIR_LEFT = 3

  ; Snake state is stored as parallel X/Y arrays.
  snake_x rd MAX_SNAKE_LEN
  snake_y rd MAX_SNAKE_LEN
  snake_len dd 3
  direction dd DIR_RIGHT
  next_direction dd DIR_RIGHT
  food_x dd 10
  food_y dd 10
  score dd 0
  game_over dd 0

  ; UI text buffers.
  score_prefix db 'Score: ',0
  score_buffer rb 16
  score_fmt db '%d',0
  game_over_text db 'GAME OVER! Press SPACE to restart',0

  ; Win32 structures.
  msg MSG
  wc WNDCLASS
  ps PAINTSTRUCT

  ; GDI objects for the board.
  hBrushBg dd ?
  hBrushSnake dd ?
  hBrushFood dd ?
  hBrushGrid dd ?
  hPenGrid dd ?

section '.code' code readable executable

  start:
    invoke GetModuleHandle,0
    mov [wc.hInstance],eax
    mov [wc.lpfnWndProc],WindowProc
    mov [wc.lpszClassName],class_name
    mov [wc.hbrBackground],COLOR_WINDOW+1
    invoke RegisterClass,wc

    ; Create the brushes and pen once during startup.
    invoke CreateSolidBrush,0x00F0F0F0
    mov [hBrushBg],eax
    invoke CreateSolidBrush,0x00008000
    mov [hBrushSnake],eax
    invoke CreateSolidBrush,0x000000FF
    mov [hBrushFood],eax
    invoke CreateSolidBrush,0x00E0E0E0
    mov [hBrushGrid],eax
    invoke CreatePen,PS_SOLID,1,0x00C0C0C0
    mov [hPenGrid],eax

    stdcall InitGame

    invoke CreateWindowEx,0,class_name,window_title,WS_OVERLAPPEDWINDOW+WS_VISIBLE,100,100,WIN_WIDTH,WIN_HEIGHT,0,0,[wc.hInstance],0

  msg_loop:
    invoke GetMessage,msg,0,0,0
    cmp eax,0
    je end_loop
    invoke TranslateMessage,msg
    invoke DispatchMessage,msg
    jmp msg_loop

  end_loop:
    invoke ExitProcess,[msg.wParam]

proc WindowProc hwnd,wmsg,wparam,lparam
  cmp [wmsg],WM_DESTROY
  je .wmdestroy
  cmp [wmsg],WM_CREATE
  je .wmcreate
  cmp [wmsg],WM_TIMER
  je .wmtimer
  cmp [wmsg],WM_PAINT
  je .wmpaint
  cmp [wmsg],WM_KEYDOWN
  je .wmkeydown

  .defwndproc:
    invoke DefWindowProc,[hwnd],[wmsg],[wparam],[lparam]
    ret

  .wmcreate:
    invoke SetTimer,[hwnd],TIMER_ID,TIMER_DELAY_MS,0
    xor eax,eax
    ret

  .wmkeydown:
    mov eax,[wparam]

    ; Allow SPACE to restart after a collision.
    cmp eax,VK_SPACE
    jne .not_space
    cmp [game_over],0
    je .not_space
    stdcall InitGame
    invoke InvalidateRect,[hwnd],0,1
    xor eax,eax
    ret

  .not_space:
    cmp [game_over],0
    jne .key_done

    ; Reject direct reversals so the snake cannot turn into itself.
    cmp eax,VK_UP
    jne .not_up
    mov ecx,[direction]
    cmp ecx,DIR_DOWN
    je .key_done
    mov [next_direction],DIR_UP
    jmp .key_done

  .not_up:
    cmp eax,VK_DOWN
    jne .not_down
    mov ecx,[direction]
    cmp ecx,DIR_UP
    je .key_done
    mov [next_direction],DIR_DOWN
    jmp .key_done

  .not_down:
    cmp eax,VK_LEFT
    jne .not_left
    mov ecx,[direction]
    cmp ecx,DIR_RIGHT
    je .key_done
    mov [next_direction],DIR_LEFT
    jmp .key_done

  .not_left:
    cmp eax,VK_RIGHT
    jne .key_done
    mov ecx,[direction]
    cmp ecx,DIR_LEFT
    je .key_done
    mov [next_direction],DIR_RIGHT

  .key_done:
    xor eax,eax
    ret

  .wmtimer:
    cmp [game_over],0
    jne .timer_done

    stdcall UpdateGame
    invoke InvalidateRect,[hwnd],0,0

  .timer_done:
    xor eax,eax
    ret

  .wmpaint:
    invoke BeginPaint,[hwnd],ps
    mov ebx,[ps.hdc]

    stdcall DrawGame,ebx

    invoke EndPaint,[hwnd],ps
    xor eax,eax
    ret

  .wmdestroy:
    invoke KillTimer,[hwnd],TIMER_ID
    invoke PostQuitMessage,0
    xor eax,eax
    ret
endp

proc InitGame
    ; Start the snake near the middle of the grid.
    mov [snake_x+0],10
    mov [snake_y+0],10
    mov [snake_x+4],9
    mov [snake_y+4],10
    mov [snake_x+8],8
    mov [snake_y+8],10

    mov [snake_len],3
    mov [direction],DIR_RIGHT
    mov [next_direction],DIR_RIGHT
    mov [score],0
    mov [game_over],0

    stdcall SpawnFood
    ret
endp

proc SpawnFood
  .try_spawn:
    ; Use GetTickCount as a simple source for demo randomness.
    invoke GetTickCount
    xor edx,edx
    mov ecx,GRID_SIZE
    div ecx
    mov [food_x],edx

    invoke GetTickCount
    add eax,7
    xor edx,edx
    mov ecx,GRID_SIZE
    div ecx
    mov [food_y],edx

    ; Do not place food inside the snake body.
    stdcall IsCellOnSnake,[food_x],[food_y]
    cmp eax,0
    jne .try_spawn

    ret
endp

proc UpdateGame
    ; Apply the requested direction first.
    mov eax,[next_direction]
    mov [direction],eax

    ; Shift body segments toward the tail.
    mov ecx,[snake_len]
    dec ecx

  .move_body:
    cmp ecx,0
    jle .body_done

    mov eax,ecx
    shl eax,2
    mov edx,[snake_x+eax-4]
    mov [snake_x+eax],edx
    mov edx,[snake_y+eax-4]
    mov [snake_y+eax],edx

    dec ecx
    jmp .move_body

  .body_done:
    ; Move the head one cell in the current direction.
    mov eax,[snake_x+0]
    mov ecx,[snake_y+0]

    mov edx,[direction]
    cmp edx,DIR_UP
    jne .not_up
    dec ecx
    jmp .moved

  .not_up:
    cmp edx,DIR_DOWN
    jne .not_down
    inc ecx
    jmp .moved

  .not_down:
    cmp edx,DIR_LEFT
    jne .not_left
    dec eax
    jmp .moved

  .not_left:
    inc eax

  .moved:
    ; Collide with walls.
    cmp eax,0
    jl .collision
    cmp eax,GRID_SIZE
    jge .collision
    cmp ecx,0
    jl .collision
    cmp ecx,GRID_SIZE
    jge .collision

    ; Collide with the body.
    push eax
    push ecx
    mov edx,1

  .check_self:
    cmp edx,[snake_len]
    jge .no_self_collision

    mov esi,edx
    shl esi,2
    cmp eax,[snake_x+esi]
    jne .not_self
    cmp ecx,[snake_y+esi]
    je .self_collision

  .not_self:
    inc edx
    jmp .check_self

  .self_collision:
    pop ecx
    pop eax
    jmp .collision

  .no_self_collision:
    pop ecx
    pop eax

    mov [snake_x+0],eax
    mov [snake_y+0],ecx

    ; Eating food grows the snake and increases the score.
    cmp eax,[food_x]
    jne .done
    cmp ecx,[food_y]
    jne .done

    inc [snake_len]
    inc [score]
    stdcall SpawnFood
    jmp .done

  .collision:
    mov [game_over],1

  .done:
    ret
endp

proc IsCellOnSnake cell_x,cell_y
    local i:DWORD

    mov [i],0

  .check_loop:
    mov eax,[i]
    cmp eax,[snake_len]
    jge .not_found

    shl eax,2
    mov ecx,[cell_x]
    cmp ecx,[snake_x+eax]
    jne .next
    mov edx,[cell_y]
    cmp edx,[snake_y+eax]
    je .found

  .next:
    inc [i]
    jmp .check_loop

  .found:
    mov eax,1
    ret

  .not_found:
    xor eax,eax
    ret
endp

proc DrawGame hdc
    local x:DWORD, y:DWORD, i:DWORD, temp_rect:RECT

    ; Paint background.
    mov [temp_rect.left],0
    mov [temp_rect.top],0
    mov [temp_rect.right],WIN_WIDTH
    mov [temp_rect.bottom],WIN_HEIGHT
    lea eax,[temp_rect]
    invoke FillRect,[hdc],eax,[hBrushBg]

    ; Paint the outer border around the board.
    mov [temp_rect.left],6
    mov [temp_rect.top],6
    mov [temp_rect.right],GRID_SIZE*CELL_SIZE+10
    mov [temp_rect.bottom],8
    lea eax,[temp_rect]
    invoke FillRect,[hdc],eax,[hBrushGrid]

    mov [temp_rect.left],6
    mov [temp_rect.top],GRID_SIZE*CELL_SIZE+8
    mov [temp_rect.right],GRID_SIZE*CELL_SIZE+10
    mov [temp_rect.bottom],GRID_SIZE*CELL_SIZE+10
    lea eax,[temp_rect]
    invoke FillRect,[hdc],eax,[hBrushGrid]

    mov [temp_rect.left],6
    mov [temp_rect.top],6
    mov [temp_rect.right],8
    mov [temp_rect.bottom],GRID_SIZE*CELL_SIZE+10
    lea eax,[temp_rect]
    invoke FillRect,[hdc],eax,[hBrushGrid]

    mov [temp_rect.left],GRID_SIZE*CELL_SIZE+8
    mov [temp_rect.top],6
    mov [temp_rect.right],GRID_SIZE*CELL_SIZE+10
    mov [temp_rect.bottom],GRID_SIZE*CELL_SIZE+10
    lea eax,[temp_rect]
    invoke FillRect,[hdc],eax,[hBrushGrid]

    ; Draw internal grid lines.
    invoke SelectObject,[hdc],[hPenGrid]

    mov [y],0
  .draw_rows:
    mov eax,[y]
    cmp eax,GRID_SIZE+1
    jge .rows_done

    imul eax,CELL_SIZE
    add eax,8
    invoke MoveToEx,[hdc],8,eax,0
    mov eax,[y]
    imul eax,CELL_SIZE
    add eax,8
    invoke LineTo,[hdc],GRID_SIZE*CELL_SIZE+8,eax

    inc [y]
    jmp .draw_rows

  .rows_done:
    mov [x],0
  .draw_cols:
    mov eax,[x]
    cmp eax,GRID_SIZE+1
    jge .cols_done

    imul eax,CELL_SIZE
    add eax,8
    invoke MoveToEx,[hdc],eax,8,0
    mov eax,[x]
    imul eax,CELL_SIZE
    add eax,8
    invoke LineTo,[hdc],eax,GRID_SIZE*CELL_SIZE+8

    inc [x]
    jmp .draw_cols

  .cols_done:
    ; Draw each snake segment as a filled cell.
    mov [i],0
  .draw_snake:
    mov eax,[i]
    cmp eax,[snake_len]
    jge .snake_done

    shl eax,2
    mov ecx,[snake_x+eax]
    mov edx,[snake_y+eax]

    imul ecx,CELL_SIZE
    add ecx,9
    imul edx,CELL_SIZE
    add edx,9

    mov [temp_rect.left],ecx
    mov [temp_rect.top],edx
    add ecx,CELL_SIZE-2
    add edx,CELL_SIZE-2
    mov [temp_rect.right],ecx
    mov [temp_rect.bottom],edx

    push eax
    lea eax,[temp_rect]
    invoke FillRect,[hdc],eax,[hBrushSnake]
    pop eax

    inc [i]
    jmp .draw_snake

  .snake_done:
    ; Draw the current food cell.
    mov eax,[food_x]
    mov ecx,[food_y]
    imul eax,CELL_SIZE
    add eax,9
    imul ecx,CELL_SIZE
    add ecx,9

    mov [temp_rect.left],eax
    mov [temp_rect.top],ecx
    add eax,CELL_SIZE-2
    add ecx,CELL_SIZE-2
    mov [temp_rect.right],eax
    mov [temp_rect.bottom],ecx

    lea eax,[temp_rect]
    invoke FillRect,[hdc],eax,[hBrushFood]

    ; Render score below the board.
    invoke wsprintf,score_buffer,score_prefix
    invoke lstrlen,score_buffer
    lea edx,[score_buffer+eax]
    invoke wsprintf,edx,score_fmt,[score]
    invoke SetBkMode,[hdc],TRANSPARENT
    invoke SetTextColor,[hdc],0x00000000
    invoke TextOut,[hdc],GRID_SIZE*CELL_SIZE-60,GRID_SIZE*CELL_SIZE+20,score_buffer,-1

    ; Render the restart hint after a collision.
    cmp [game_over],0
    je .no_game_over
    invoke SetTextColor,[hdc],0x00FF0000
    invoke TextOut,[hdc],50,GRID_SIZE*CELL_SIZE+35,game_over_text,-1

  .no_game_over:
    ret
endp

section '.idata' import data readable writeable

  library kernel32,'KERNEL32.DLL',\
          user32,'USER32.DLL',\
          gdi32,'GDI32.DLL'

  include 'api\kernel32.inc'
  include 'api\user32.inc'
  include 'api\gdi32.inc'
