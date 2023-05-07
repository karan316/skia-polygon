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
import {View} from 'react-native';

import {Corner, DetachedCorner} from './Corner';
import {Point} from './Point';
import {PolygonInteraction} from './PolygonInteraction/PolygonInteraction.lib';

export interface InitialValues {
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
  topLeft: Point;
}

export type CornerUpdateHandler = (corner: DetachedCorner) => void;

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
    topRight: initialTopRight,
    bottomRight: initialBottomRight,
    bottomLeft: initialBottomLeft,
    topLeft: initialTopLeft,
  },
  width,
  height,
  onCornerUpdate,
}) => {
  const topRightX = useValue(initialTopRight.x);
  const topRightY = useValue(initialTopRight.y);

  const bottomRightX = useValue(initialBottomRight.x);
  const bottomRightY = useValue(initialBottomRight.y);

  const bottomLeftX = useValue(initialBottomLeft.x);
  const bottomLeftY = useValue(initialBottomLeft.y);

  const topLeftX = useValue(initialTopLeft.x);
  const topLeftY = useValue(initialTopLeft.y);

  const polygonInteraction = new PolygonInteraction(width, height);

  const currentCorners = () => [
    new Corner(topRightX, topRightY, 'top-right'),
    new Corner(bottomRightX, bottomRightY, 'bottom-right'),
    new Corner(bottomLeftX, bottomLeftY, 'bottom-left'),
    new Corner(topLeftX, topLeftY, 'top-left'),
  ];

  const detect = ({x, y}: TouchInfo) => {
    const corners = currentCorners();
    // Detect if its a corner touch
    polygonInteraction.detectCorner(x, y, corners);

    if (polygonInteraction.cornerWasDetected()) {
      // we can return since we already detected a corner. No need to detect a line.
      return;
    }

    // If it was not a corner touch, detect for a line touch
    polygonInteraction.setInitialTouchPosition(new Point(x, y));
    polygonInteraction.detectLine(x, y, corners);
  };

  const move = ({x, y}: ExtendedTouchInfo) => {
    try {
      if (polygonInteraction.cornerWasDetected()) {
        polygonInteraction.moveCorner(x, y);
      } else if (polygonInteraction.lineWasDetected()) {
        polygonInteraction.moveLine(x, y);
      }
    } catch (error) {
      console.error('Error while moving', error);
    }
  };

  const detach = () => {
    try {
      if (!onCornerUpdate) {
        console.warn('No onCornerUpdate handler passed');
        return;
      }
      if (polygonInteraction.cornerWasDetected()) {
        try {
          const corner = polygonInteraction.detachCorner();
          onCornerUpdate(corner);
        } catch (error) {
          console.error(error);
        }
      } else if (polygonInteraction.lineWasDetected()) {
        try {
          const {cornerOne, cornerTwo} = polygonInteraction.detachLine();

          onCornerUpdate(cornerOne);
          onCornerUpdate(cornerTwo);
        } catch (error) {
          console.error(error);
        }
      }
      polygonInteraction.resetTouchPoints();
    } catch (error) {
      console.log('Error while detaching', error);
    }
  };

  const touchHandler = useTouchHandler({
    onStart: detect,
    onActive: move,
    onEnd: detach,
  });
  const points = useComputedValue(
    () => [
      vec(topRightX.current, topRightY.current),
      vec(bottomRightX.current, bottomRightY.current),
      vec(bottomLeftX.current, bottomLeftY.current),
      vec(topLeftX.current, topLeftY.current),
      vec(topRightX.current, topRightY.current),
    ],
    [
      topRightX,
      topRightY,
      bottomRightY,
      bottomRightY,
      bottomLeftX,
      bottomLeftY,
      topLeftX,
      topLeftY,
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
      <Circle cx={topRightX} cy={topRightY} r={4} color={Corner.COLOR} />
      <Circle cx={bottomRightX} cy={bottomRightY} r={4} color={Corner.COLOR} />
      <Circle cx={bottomLeftX} cy={bottomLeftY} r={4} color={Corner.COLOR} />
      <Circle cx={topLeftX} cy={topLeftY} r={4} color={Corner.COLOR} />
    </Canvas>
  );
};

export default AdjustablePolygon;
