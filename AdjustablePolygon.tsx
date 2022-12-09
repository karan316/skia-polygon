import {
  Canvas,
  Circle,
  ExtendedTouchInfo,
  Points,
  TouchInfo,
  useComputedValue,
  useTouchHandler,
  useValue,
  vec,
} from '@shopify/react-native-skia';
import React from 'react';

import {Corner, CornerPosition} from './Corner';
import {Point} from './Point';
import {PolygonInteraction} from './PolygonInteraction';
import {isDefined} from './helpers';

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
   * Triggers whenever a corner is updated
   */
  onCornerUpdate?: CornerUpdateHandler;
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
}) => {
  const topLeftX = useValue(initialTopLeft.x);
  const topLeftY = useValue(initialTopLeft.y);

  const topRightX = useValue(initialTopRight.x);
  const topRightY = useValue(initialTopRight.y);

  const bottomRightX = useValue(initialBottomRight.x);
  const bottomRightY = useValue(initialBottomRight.y);

  const bottomLeftX = useValue(initialBottomLeft.x);
  const bottomLeftY = useValue(initialBottomLeft.y);

  const polygonInteraction = new PolygonInteraction();

  const currentCorners = () => [
    new Corner(topLeftX, topLeftY, 'top-left'),
    new Corner(topRightX, topRightY, 'top-right'),
    new Corner(bottomRightX, bottomRightY, 'bottom-right'),
    new Corner(bottomLeftX, bottomLeftY, 'bottom-left'),
  ];

  const detect = ({x, y}: TouchInfo) => {
    const corners = currentCorners();
    // Detect if its a corner touch
    polygonInteraction.detectCorner(x, y, corners);

    if (polygonInteraction.detectedCorner()) {
      return;
    }

    // If it was not a corner touch, detect for a line touch
    polygonInteraction.setInitialTouchPosition(new Point(x, y));
    polygonInteraction.detectLine(x, y, corners);
  };

  const move = ({x, y}: ExtendedTouchInfo) => {
    if (polygonInteraction.detectedCorner()) {
      polygonInteraction.moveCorner(x, y);
    } else if (polygonInteraction.detectedLine()) {
      polygonInteraction.moveLine(x, y);
    }
  };

  const detach = () => {
    if (onCornerUpdate) {
      if (polygonInteraction.detectedCorner()) {
        const x = polygonInteraction.activeCorner.point.x?.current;
        const y = polygonInteraction.activeCorner.point.y?.current;

        const position = polygonInteraction.activeCorner.position;
        if (x && y && position) {
          onCornerUpdate({x, y}, position);
        }
      } else if (polygonInteraction.detectedLine()) {
        const pointOne = polygonInteraction.activeLine.pointOne;
        const pointTwo = polygonInteraction.activeLine.pointTwo;

        const x1 = pointOne.point.x?.current;
        const y1 = pointOne.point.y?.current;
        const p1 = pointOne.position;

        const x2 = pointTwo.point.x?.current;
        const y2 = pointTwo.point.y?.current;
        const p2 = pointTwo.position;

        if (
          isDefined(x1) &&
          isDefined(y1) &&
          isDefined(p1) &&
          isDefined(x2) &&
          isDefined(y2) &&
          isDefined(p2)
        ) {
          onCornerUpdate({x: x1, y: y1}, p1);
          onCornerUpdate({x: x2, y: y2}, p2);
        }
      }
    }
    polygonInteraction.resetTouchPoints();
    console.log('------------------------');
  };

  const touchHandler = useTouchHandler({
    onStart: detect,
    onActive: move,
    onEnd: detach,
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
      <Circle cx={topLeftX} cy={topLeftY} r={4} color={Corner.COLOR} />
      <Circle cx={topRightX} cy={topRightY} r={4} color={Corner.COLOR} />
      <Circle cx={bottomRightX} cy={bottomRightY} r={4} color={Corner.COLOR} />
      <Circle cx={bottomLeftX} cy={bottomLeftY} r={4} color={Corner.COLOR} />
    </Canvas>
  );
};

export default AdjustablePolygon;
