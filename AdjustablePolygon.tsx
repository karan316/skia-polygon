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

export type CornerPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-right'
  | 'bottom-left';

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

  let activeXPoint: SkiaMutableValue<number> | null = null;
  let activeYPoint: SkiaMutableValue<number> | null = null;
  let activePosition: CornerPosition | null = null;

  const coordPoint = (
    x: SkiaMutableValue<number>,
    y: SkiaMutableValue<number>,
    position: CornerPosition,
  ) => ({
    x,
    y,
    position,
  });

  const allCoordPoints = () => [
    coordPoint(topLeftX, topLeftY, 'top-left'),
    coordPoint(topRightX, topRightY, 'top-right'),
    coordPoint(bottomRightX, bottomRightY, 'bottom-right'),
    coordPoint(bottomLeftX, bottomLeftY, 'bottom-left'),
  ];

  const detectPoint = ({x, y}: TouchInfo) => {
    for (let point of allCoordPoints()) {
      if (
        distanceBetweenTouchAndPoint(
          {x, y},
          {x: point.x.current, y: point.y.current},
        ) <= touchArea
      ) {
        activeXPoint = point.x;
        activeYPoint = point.y;
        activePosition = point.position;
        console.log(
          'DETECT POINT: ',
          activeXPoint?.current,
          activeYPoint?.current,
          activePosition,
        );
      }
    }
  };

  const movePoint = (touchInfo: ExtendedTouchInfo) => {
    if (activeXPoint && activeYPoint) {
      activeXPoint.current = touchInfo.x;
      activeYPoint.current = touchInfo.y;
      console.log('MOVE POINT: ', activeXPoint?.current, activeYPoint?.current);
    }
  };

  const detachPoint = () => {
    if (onCornerUpdate && activeXPoint && activeYPoint && activePosition) {
      onCornerUpdate(
        {x: activeXPoint?.current, y: activeYPoint?.current},
        activePosition,
      );
      console.log('DETACHED POINT');
    }
    activeXPoint = null;
    activeYPoint = null;
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
