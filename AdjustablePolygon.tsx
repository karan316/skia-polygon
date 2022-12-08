import {
  Canvas,
  Circle,
  ExtendedTouchInfo,
  Points,
  SkiaMutableValue,
  TouchInfo,
  useComputedValue,
  useTouchHandler,
  useValue,
  vec,
} from '@shopify/react-native-skia';
import React from 'react';

interface Point {
  x: number;
  y: number;
}

interface MutablePoint {
  x: SkiaMutableValue<number> | null;
  y: SkiaMutableValue<number> | null;
}

export type CornerPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-right'
  | 'bottom-left';

export type LinePosition = 'top' | 'right' | 'bottom' | 'left';

// interface ActiveLine {
//   pointOne: MutablePoint;
//   pointTwo: MutablePoint;
//   position: LinePosition;
// }

class ActiveCorner {
  point: MutablePoint;
  position: CornerPosition | null;
  constructor() {
    this.point = {
      x: null,
      y: null,
    };

    this.position = null;
  }
}

class ActiveLine {
  pointOne: ActiveCorner;
  pointTwo: ActiveCorner;
  position: LinePosition | null;
  constructor() {
    this.pointOne = new ActiveCorner();
    this.pointTwo = new ActiveCorner();
    this.position = null;
  }
}

export interface InitialValues {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export type CornerUpdateHandler = (
  corner: Point,
  position: CornerPosition,
) => void;

interface IAdjustablePolygonProps {
  /**
   * Initial values of the four corners
   */
  initialValues: InitialValues;
  /**
   * Width of the polygon canvas
   */
  width: number;

  /**
   * Height of the polygon canvas
   */
  height: number;
  /**
   * The area available around the corner to touch. Use TOUCH_BUFFER to define the value
   */
  touchArea?: number;

  /**
   * Triggers whenever a corner is updated
   */
  onCornerUpdate?: CornerUpdateHandler;
}

export enum TOUCH_BUFFER {
  NONE = 0,
  LOW = 10,
  MEDIUM = 20,
  HIGH = 30,
}

const AdjustablePolygon: React.FC<IAdjustablePolygonProps> = ({
  initialValues: {topLeft, topRight, bottomRight, bottomLeft},
  width,
  height,
  onCornerUpdate,
  touchArea = TOUCH_BUFFER.MEDIUM,
}) => {
  const CIRCLE_COLOR = 'blue';
  const LINE_COLOR = 'greenyellow';

  const topLeftX = useValue(topLeft.x);
  const topLeftY = useValue(topLeft.y);

  const topRightX = useValue(topRight.x);
  const topRightY = useValue(topRight.y);

  const bottomRightX = useValue(bottomRight.x);
  const bottomRightY = useValue(bottomRight.y);

  const bottomLeftX = useValue(bottomLeft.x);
  const bottomLeftY = useValue(bottomLeft.y);

  const distanceBetweenTouchAndPoint = (touch: Point, point: Point) => {
    const distance = Math.sqrt(
      (touch.x - point.x) ** 2 + (touch.y - point.y) ** 2,
    );
    return distance;
  };

  /**
   * Used to store the current active corner
   */
  let activeCorner = new ActiveCorner();

  const cornerPoint = (
    x: SkiaMutableValue<number>,
    y: SkiaMutableValue<number>,
    position: CornerPosition,
  ) => ({
    x,
    y,
    position,
  });

  const allCornerPoints = () => [
    cornerPoint(topLeftX, topLeftY, 'top-left'),
    cornerPoint(topRightX, topRightY, 'top-right'),
    cornerPoint(bottomRightX, bottomRightY, 'bottom-right'),
    cornerPoint(bottomLeftX, bottomLeftY, 'bottom-left'),
  ];

  const detectPoint = ({x, y}: TouchInfo) => {
    for (let point of allCornerPoints()) {
      if (
        distanceBetweenTouchAndPoint(
          {x, y},
          {x: point.x.current, y: point.y.current},
        ) <= touchArea
      ) {
        activeCorner.point.x = point.x;
        activeCorner.point.y = point.y;
        activeCorner.position = point.position;

        console.log(
          'DETECT POINT: ',
          activeCorner.point.x?.current,
          activeCorner.point.y?.current,
          activeCorner.position,
        );
      }
    }
  };

  const movePoint = (touchInfo: ExtendedTouchInfo) => {
    if (activeCorner.point.x && activeCorner.point.y) {
      activeCorner.point.x.current = touchInfo.x;
      activeCorner.point.y.current = touchInfo.y;
      console.log(
        'MOVE POINT: ',
        activeCorner.point.x?.current,
        activeCorner.point.y?.current,
      );
    }
  };

  const detachPoint = () => {
    if (
      onCornerUpdate &&
      activeCorner.point.x &&
      activeCorner.point.y &&
      activeCorner.position
    ) {
      onCornerUpdate(
        {x: activeCorner.point.x.current, y: activeCorner.point.y.current},
        activeCorner.position,
      );
      console.log('DETACHED POINT');
    }
    activeCorner = new ActiveCorner();
  };

  const touchHandler = useTouchHandler({
    onStart: detectPoint,
    onActive: movePoint,
    onEnd: detachPoint,
  });
  const points = useComputedValue(
    () => [
      vec(topLeftX.current, topLeftY.current),
      vec(topRightX.current, topRightY.current),
      vec(bottomRightX.current, bottomRightY.current),
      vec(bottomLeftX.current, bottomLeftY.current),
      vec(topLeftX.current, topLeftY.current),
    ],
    [
      topLeftX,
      topLeftY,
      topRightX,
      topRightY,
      bottomRightY,
      bottomRightY,
      bottomLeftX,
      bottomLeftY,
    ],
  );

  return (
    <Canvas style={{width, height}} onTouch={touchHandler}>
      <Points
        points={points}
        mode="polygon"
        color="red"
        style="stroke"
        strokeWidth={2}
      />
      <Circle cx={topLeftX} cy={topLeftY} r={4} color={CIRCLE_COLOR} />
      <Circle cx={topRightX} cy={topRightY} r={4} color={CIRCLE_COLOR} />
      <Circle cx={bottomRightX} cy={bottomRightY} r={4} color={CIRCLE_COLOR} />
      <Circle cx={bottomLeftX} cy={bottomLeftY} r={4} color={CIRCLE_COLOR} />
    </Canvas>
  );
};

export default AdjustablePolygon;
