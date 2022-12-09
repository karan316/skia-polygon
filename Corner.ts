import {SkiaMutableValue} from '@shopify/react-native-skia';

export type CornerPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-right'
  | 'bottom-left';

export interface MutablePoint {
  x: SkiaMutableValue<number> | null;
  y: SkiaMutableValue<number> | null;
}

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
