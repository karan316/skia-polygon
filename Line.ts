import {Corner} from './Corner';

export type LinePosition = 'top' | 'right' | 'bottom' | 'left';

export class Line {
  pointOne: Corner;
  pointTwo: Corner;
  position: LinePosition | null;

  static LINE_COLOR = 'greenyellow';

  constructor(pointOne?: Corner, pointTwo?: Corner, position?: LinePosition) {
    this.pointOne = pointOne ?? new Corner();
    this.pointTwo = pointTwo ?? new Corner();
    this.position = position ?? null;
  }
}
