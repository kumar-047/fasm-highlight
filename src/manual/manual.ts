import type { ManualSection } from './constants/sections';
import { MANUAL_BASE_URL } from './constants/sections';

export function manualUrl(section: ManualSection): string {
    return `${MANUAL_BASE_URL}#${section}`;
}
