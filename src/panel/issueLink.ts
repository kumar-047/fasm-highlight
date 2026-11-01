import { PROJECT_LINKS } from './constants/projectLinks';
import type { IssueContext } from './types';

export function issueUrl(issue: 'bug' | 'request', context: IssueContext): string {
    const body = issue === 'bug'
        ? `**What happened**\n\n\n**What you expected**\n\n\n**Sample code**\n\n\n---\nExtension ${context.version}\nEditor: ${context.editor}\nSystem: ${context.system}\nCompiler: ${context.compiler}`
        : `**What would you like**\n\n\n---\nExtension ${context.version}`;
    const params = new URLSearchParams({ title: issue === 'bug' ? 'Bug: ' : 'Request: ', body });
    return `${PROJECT_LINKS.repository.url}/issues/new?${params.toString()}`;
}
