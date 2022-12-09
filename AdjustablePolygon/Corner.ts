import {SkiaMutableValue} from '@shopify/react-native-skia';
import {Point} from './Point';

/**
 * Position of a corner
 */
export type CornerPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-right'
  | 'bottom-left';

/**
 * Point which moves around
 */
export interface MutablePoint {
  x: SkiaMutableValue<number> | null;
  y: SkiaMutableValue<number> | null;
}

/**
 * Corner value when it is no longer active
 */
export interface DetachedCorner {
  point: Point;
  position: CornerPosition;
}

/**
 * Corners composed of its current coordinate values and position
 */
export class Corner {
  point: MutablePoint;
  position: CornerPosition | null;

  static TOUCH_BUFFER = {
    NONE: 0,
    LOW: 10,
    MEDIUM: 20,
    HIGH: 30,
  };

  static COLOR = 'blue';

  constructor(
    x?: SkiaMutableValue<number>,
    y?: SkiaMutableValue<number>,
    position?: CornerPosition,
  ) {
    this.point = {
      x: x ?? null,
      y: y ?? null,
    };

    this.position = position ?? null;
  }
}
