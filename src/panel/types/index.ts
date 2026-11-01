import type { ColorRole } from '../../colors/types';

export type PanelMessage =
    | { readonly type: 'ready' }
    | { readonly type: 'formatFile' }
    | { readonly type: 'setPalette'; readonly id: string }
    | { readonly type: 'setRoleColor'; readonly role: ColorRole; readonly color: string }
    | { readonly type: 'resetColors' }
    | { readonly type: 'setFont'; readonly family: string }
    | { readonly type: 'setFontSize'; readonly size: number }
    | { readonly type: 'resetFont' }
    | { readonly type: 'openFontSettings' }
    | { readonly type: 'convertNumber'; readonly text: string }
    | { readonly type: 'copyValue'; readonly value: string };
