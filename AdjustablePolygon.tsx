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

// interface Point {
//   x: number;
//   y: number;
// }

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

class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
class Corner {
  point: MutablePoint;
  position: CornerPosition | null;
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

class Line {
  pointOne: Corner;
  pointTwo: Corner;
  position: LinePosition | null;
  constructor(pointOne?: Corner, pointTwo?: Corner, position?: LinePosition) {
    this.pointOne = pointOne ?? new Corner();
    this.pointTwo = pointTwo ?? new Corner();
    this.position = position ?? null;
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

export enum CORNER_TOUCH_BUFFER {
  NONE = 0,
  LOW = 10,
  MEDIUM = 20,
  HIGH = 30,
}

const AdjustablePolygon: React.FC<IAdjustablePolygonProps> = ({
  initialValues: {
    topLeft: initialTopLeft,
    topRight: initialTopRight,
    bottomRight: initialBottomRight,
    bottomLeft: initialBottomLeft,
  },
  width,
  height,
  onCornerUpdate,
  touchArea = CORNER_TOUCH_BUFFER.MEDIUM,
}) => {
  // Dot product threshold to give little buffer for the touch (this is not pixels)
  const LINE_TOUCH_THRESHOLD = 5000;

  const CIRCLE_COLOR = 'blue';
  const LINE_COLOR = 'greenyellow';

  const topLeftX = useValue(initialTopLeft.x);
  const topLeftY = useValue(initialTopLeft.y);

  const topRightX = useValue(initialTopRight.x);
  const topRightY = useValue(initialTopRight.y);

  const bottomRightX = useValue(initialBottomRight.x);
  const bottomRightY = useValue(initialBottomRight.y);

  const bottomLeftX = useValue(initialBottomLeft.x);
  const bottomLeftY = useValue(initialBottomLeft.y);

  const distanceBetween = (pointOne: Point, pointTwo: Point) => {
    const distance = Math.sqrt(
      (pointOne.x - pointTwo.x) ** 2 + (pointOne.y - pointTwo.y) ** 2,
    );
    return distance;
  };

  /**
   * Corner which the user is dragging
   */
  let activeCorner = new Corner();

  /**
   * Line which the user is dragging
   */
  let activeLine = new Line();

  let initialTouchPosition: Point | null = null;

  const currentCorners = () => [
    new Corner(topLeftX, topLeftY, 'top-left'),
    new Corner(topRightX, topRightY, 'top-right'),
    new Corner(bottomRightX, bottomRightY, 'bottom-right'),
    new Corner(bottomLeftX, bottomLeftY, 'bottom-left'),
  ];

  const isNullOrUndefined = (value: any): value is null | undefined =>
    value === null || value === undefined;

  const detectPoint = (x: number, y: number) => {
    for (let corner of currentCorners()) {
      if (
        corner.point.x &&
        corner.point.y &&
        distanceBetween(
          {x, y},
          {x: corner.point.x.current, y: corner.point.y.current},
        ) <= touchArea
      ) {
        activeCorner.point.x = corner.point.x;
        activeCorner.point.y = corner.point.y;
        activeCorner.position = corner.position;

        console.log(
          'DETECT CORNER: ',
          activeCorner.point.x?.current,
          activeCorner.point.y?.current,
          activeCorner.position,
        );
      }
    }
  };

  const pointInBetweenLine = (point: Point, line: Line) => {
    console.log('LINE ****', line.position);
    console.log(
      'LINE POINT: ',
      `(${line.pointOne.point.x?.current},  ${line.pointOne.point.y?.current})`,
      `(${line.pointTwo.point?.x?.current}, ${line.pointTwo.point?.y?.current})`,
    );
    console.log('TOUCH POINT: ', point.x, point.y);

    /**
     * Point is in between in line if
     * 1. It satisfies the line equation or the cross product of two vectors forming the 3 points is zero
     * 2. x lies between the minimum and maximum x coordinates of the line
     * 3. y lies between the minimum and maximum y coordinates of the line
     */

    const linePointOneX = line.pointOne.point.x?.current;
    const linePointOneY = line.pointOne.point.y?.current;

    const linePointTwoX = line.pointTwo.point.x?.current;
    const linePointTwoY = line.pointTwo.point.y?.current;

    if (
      isNullOrUndefined(linePointOneX) ||
      isNullOrUndefined(linePointOneY) ||
      isNullOrUndefined(linePointTwoX) ||
      isNullOrUndefined(linePointTwoY)
    ) {
      return false;
    }

    const dX = point.x - linePointOneX;
    const dY = point.y - linePointOneY;

    const dXl = linePointTwoX - linePointOneX;
    const dYl = linePointTwoY - linePointOneY;

    const crossProduct = dX * dYl - dY * dXl;

    console.log('cross', Math.abs(crossProduct));

    // if cross product is not close to zero then it is definitely not on the line
    if (Math.abs(crossProduct) > LINE_TOUCH_THRESHOLD) {
      return false;
    }
    if (Math.abs(dXl) >= Math.abs(dYl)) {
      // if the line is more horizontal than vertical, check if the x coordinate lies in between min and max values
      return dXl > 0
        ? linePointOneX <= point.x && point.x <= linePointTwoX
        : linePointTwoX <= point.x && point.x <= linePointOneX;
    } else {
      // if the line is more vertical than horizontal, check if the y coordinate lies in between min and max values
      return dYl > 0
        ? linePointOneY <= point.y && point.y <= linePointTwoY
        : linePointTwoY <= point.y && point.y <= linePointOneY;
    }
  };

  const detectLine = (x: number, y: number) => {
    const [topLeft, topRight, bottomRight, bottomLeft] = currentCorners();

    const top = new Line(topLeft, topRight, 'top');
    const right = new Line(topRight, bottomRight, 'right');
    const bottom = new Line(bottomRight, bottomLeft, 'bottom');
    const left = new Line(bottomLeft, topLeft, 'left');

    const point = new Point(x, y);

    for (let line of [top, right, bottom, left]) {
      if (pointInBetweenLine(point, line)) {
        activeLine = line;
        console.log('DETECTED LINE: ', activeLine.position);
        return;
      }
    }
  };

  const detectPointOrLine = ({x, y}: TouchInfo) => {
    detectPoint(x, y);

    if (activeCorner.position === null) {
      initialTouchPosition = new Point(x, y);
      detectLine(x, y);
    }
  };

  const detectedCorner = () => !isNullOrUndefined(activeCorner.position);

  const detectedLine = () => !isNullOrUndefined(activeLine.position);

  const movePoint = (x: number, y: number) => {
    if (
      !isNullOrUndefined(activeCorner.point.x) &&
      !isNullOrUndefined(activeCorner.point.y)
    ) {
      activeCorner.point.x.current = x;
      activeCorner.point.y.current = y;
      console.log(
        'MOVE POINT: ',
        activeCorner.point.x?.current,
        activeCorner.point.y?.current,
      );
    }
  };

  const moveLine = (x: number, y: number) => {
    // subtract the active displacement of touch from the initial position
    const pointOne = activeLine.pointOne.point;
    const pointTwo = activeLine.pointTwo.point;
    if (
      !initialTouchPosition ||
      isNullOrUndefined(pointOne.x) ||
      isNullOrUndefined(pointOne.y) ||
      isNullOrUndefined(pointTwo.x) ||
      isNullOrUndefined(pointTwo.y) ||
      isNullOrUndefined(pointOne.x?.current) ||
      isNullOrUndefined(pointOne.y?.current) ||
      isNullOrUndefined(pointTwo.x?.current) ||
      isNullOrUndefined(pointTwo.y?.current)
    ) {
      return;
    }
    // FIXME: get displacement not distance! we need negative value
    const displacement = distanceBetween(new Point(x, y), initialTouchPosition);
    // TODO: test if this works!
    pointOne.x.current = pointOne.x.current - displacement;
    pointOne.y.current = pointOne.y.current - displacement;

    pointTwo.x.current = pointTwo.x.current - displacement;
    pointTwo.y.current = pointTwo.y.current - displacement;
  };

  const movePointOrLine = ({x, y}: ExtendedTouchInfo) => {
    if (detectedCorner()) {
      movePoint(x, y);
    } else if (detectedLine()) {
      moveLine(x, y);
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
    activeCorner = new Corner();
    activeLine = new Line();
    initialTouchPosition = null;
    console.log('------------------------');
  };

  const touchHandler = useTouchHandler({
    onStart: detectPointOrLine,
    onActive: movePointOrLine,
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
