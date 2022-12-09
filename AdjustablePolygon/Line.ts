import {Corner, DetachedCorner} from './Corner';

export type LinePosition = 'top' | 'right' | 'bottom' | 'left';

/**
 * Corners values of the detached line
 */
export interface DetachedLine {
  cornerOne: DetachedCorner;
  cornerTwo: DetachedCorner;
}

/**
 * Line composed of two corners and its position
 */
export class Line {
  cornerOne: Corner;
  cornerTwo: Corner;
  position: LinePosition | null;

  static LINE_COLOR = 'greenyellow';

  constructor(pointOne?: Corner, pointTwo?: Corner, position?: LinePosition) {
    this.cornerOne = pointOne ?? new Corner();
    this.cornerTwo = pointTwo ?? new Corner();
    this.position = position ?? null;
  }
}
