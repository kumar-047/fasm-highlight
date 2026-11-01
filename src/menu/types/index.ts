import type { ColorRole } from '../../colors/types';
import type { ConvertedNumber } from '../../tools/types';

export type MenuCard = 'main' | 'colors';

export interface MenuState {
    readonly colorsOn: boolean;
    readonly palette: string;
    readonly fontFamily: string;
    readonly fontSize: number;
    readonly numberText?: string;
    readonly number?: ConvertedNumber;
    readonly roleColors: Readonly<Record<ColorRole, string>>;
}
