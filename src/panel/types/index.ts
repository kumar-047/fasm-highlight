import type { ColorRole } from '../../colors/types';

export interface PanelSetting {
    readonly id: string;
    readonly section: string;
    readonly key: string;
    readonly languageScoped: boolean;
    readonly type: 'string' | 'number' | 'boolean';
}

export type PanelMessage =
    | { readonly type: 'ready' }
    | { readonly type: 'formatFile' }
    | { readonly type: 'browseCompiler' }
    | { readonly type: 'setSetting'; readonly id: string; readonly value: unknown }
    | { readonly type: 'resetSetting'; readonly id: string }
    | { readonly type: 'setScope'; readonly scope: 'workspace' | 'user' }
    | { readonly type: 'setColors'; readonly enabled: boolean }
    | { readonly type: 'setColor'; readonly role: ColorRole; readonly color: string | undefined }
    | { readonly type: 'convertNumber'; readonly text: string };
