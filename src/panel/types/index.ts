import type { ColorRole } from '../../colors/types';
import type { CompilerKind } from '../../compiler/types';
import type { PROJECT_LINKS } from '../constants/projectLinks';

export interface PanelSetting {
    readonly id: string;
    readonly section: string;
    readonly key: string;
    readonly languageScoped: boolean;
    readonly type: 'string' | 'number' | 'boolean' | 'enum';
    readonly options?: readonly string[];
}

export type ProjectLinkId = keyof typeof PROJECT_LINKS;

export type PanelCommand = 'build' | 'buildAndRun' | 'stop' | 'format' | 'insertStarter' | 'openOutputFolder' | 'refreshCompilers';

export type PanelMessage =
    | { readonly type: 'ready' }
    | { readonly type: 'command'; readonly command: PanelCommand }
    | { readonly type: 'setSetting'; readonly id: string; readonly value: unknown }
    | { readonly type: 'resetSetting'; readonly id: string }
    | { readonly type: 'setScope'; readonly scope: 'workspace' | 'user' }
    | { readonly type: 'browseCompiler'; readonly kind: CompilerKind }
    | { readonly type: 'openLink'; readonly link: ProjectLinkId }
    | { readonly type: 'reportIssue'; readonly issue: 'bug' | 'request' }
    | { readonly type: 'setColors'; readonly enabled: boolean }
    | { readonly type: 'setColor'; readonly role: ColorRole; readonly color: string | undefined }
    | { readonly type: 'convertNumber'; readonly text: string };

export interface IssueContext {
    readonly version: string;
    readonly system: string;
    readonly editor: string;
    readonly compiler: string;
}
