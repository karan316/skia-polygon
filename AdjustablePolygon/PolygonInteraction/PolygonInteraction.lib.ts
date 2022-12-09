import {Corner, DetachedCorner} from '../Corner';
import {DetachedLine, Line} from '../Line';
import {Point} from '../Point';
import {isDefined} from '../utils';

export class PolygonInteraction {
  /**
   * Corner which the user is dragging
   */
  activeCorner: Corner;

  /**
   * Line which the user is dragging
   */
  activeLine: Line;

  /**
   * Initial touch to calculate the displacement when dragging the line
   */
  initialTouchPosition: Point | null;

  /**
   * Initial corner point values when a user drags the line to calculate new corners
   */
  initialLineCorners: {
    pointOne: Point | null;
    pointTwo: Point | null;
  };

  /**
   * Max width of interaction
   */
  MAX_WIDTH: number;

  /**
   * Min width of interaction
   */
  MAX_HEIGHT: number;

  /**
   * Min angle of the polygon
   */
  MIN_ANGLE: number;

  /**
   * Max angle of the polygon
   */
  MAX_ANGLE: number;

  /**
   * Current corners snapshot at the time of detection
   */
  cornersSnapshot: Corner[] | null;

  /**
   * Threshold for cross product to detect line touch (not pixel values)
   */
  private LINE_TOUCH_THRESHOLD = 5000;

  constructor(
    maxWidth: number = 0,
    maxHeight: number = 0,
    minAngle: number = Number.MAX_SAFE_INTEGER,
    maxAngle: number = Number.MIN_SAFE_INTEGER,
  ) {
    this.activeCorner = new Corner();
    this.activeLine = new Line();
    this.initialTouchPosition = null;
    this.cornersSnapshot = null;
    this.initialLineCorners = {
      pointOne: null,
      pointTwo: null,
    };
    this.MAX_WIDTH = maxWidth;
    this.MAX_HEIGHT = maxHeight;
    this.MAX_ANGLE = maxAngle;
    this.MIN_ANGLE = minAngle;
  }

  /**
   * Returns true if the current position is out of specified boundaries
   * @param x Current X position
   * @param y Current Y position
   */
  isPositionOutOfBounds(x: number, y: number) {
    return x <= 0 || x >= this.MAX_WIDTH || y <= 0 || y >= this.MAX_HEIGHT;
  }

  /**
   * Returns true if the angle is out of permissible range
   * @throws Error
   */
  isAngleOutOfRange() {
    if (!this.cornersSnapshot) {
      throw new Error('No corners snapshot');
    }
    const [topRight, bottomRight, bottomLeft, topLeft] = this.cornersSnapshot;
    if (
      !isDefined(this.activeCorner.point.x) ||
      !isDefined(this.activeCorner.point.y)
    ) {
      throw new Error('No active corner found');
    }
    if (
      !isDefined(topRight.point.x) ||
      !isDefined(topRight.point.y) ||
      !isDefined(bottomRight.point.x) ||
      !isDefined(bottomRight.point.y) ||
      !isDefined(bottomLeft.point.x) ||
      !isDefined(bottomLeft.point.y) ||
      !isDefined(topLeft.point.x) ||
      !isDefined(topLeft.point.y)
    ) {
      throw new Error('Undefined corners found');
    }

    let pointOne: Point | null = null;
    let pointTwo: Point | null = null;

    switch (this.activeCorner.position) {
      case 'top-right':
        pointOne = new Point(
          topRight.point.x.current,
          topRight.point.y.current,
        );
        pointTwo = new Point(
          bottomRight.point.x.current,
          bottomRight.point.y.current,
        );
        break;
      case 'bottom-right':
        pointOne = new Point(
          topRight.point.x.current,
          topRight.point.y.current,
        );
        pointTwo = new Point(
          bottomLeft.point.x.current,
          bottomLeft.point.y.current,
        );
        break;

      case 'bottom-left':
        pointOne = new Point(topLeft.point.x.current, topLeft.point.y.current);
        pointTwo = new Point(
          bottomRight.point.x.current,
          bottomRight.point.y.current,
        );
        break;

      case 'top-left':
        pointOne = new Point(
          topRight.point.x.current,
          topRight.point.y.current,
        );
        pointTwo = new Point(
          bottomLeft.point.x.current,
          bottomLeft.point.y.current,
        );
        break;

      default:
        break;
    }

    if (!isDefined(pointOne) || !isDefined(pointTwo)) {
      throw new Error('Could not locate the corner');
    }

    const x1 = pointOne.x - this.activeCorner.point.x.current;
    const y1 = pointOne.y - this.activeCorner.point.y.current;

    const x2 = pointTwo.x - this.activeCorner.point.x.current;
    const y2 = pointTwo.y - this.activeCorner.point.y.current;

    const yVal = x1 * y2 - x2 * y1;
    const xVal = x1 * x2 + y1 * y2;

    // atan2 has a range of -pi to pi. We take the absolute values to account for clockwise and anti-clockwise angle.
    const angle = (Math.atan2(yVal, xVal) * 180) / Math.PI;

    // absolute value of the angle forming the vectors should be between 70 to 130
    if (angle > this.MAX_ANGLE || angle < this.MIN_ANGLE) {
      // angle is out of range
      return true;
    }
    // angle formed is within range
    return false;
  }

  /**
   *
   * @param from starting point
   * @param to ending point
   * @param direction set this to true if you want displacement (right, down -> positive)
   * @returns distance
   */

  distanceBetween(from: Point, to: Point, direction: boolean = false) {
    const distance = Math.sqrt((from.x - to.x) ** 2 + (from.y - to.y) ** 2);
    if (!direction) {
      return distance;
    } else {
      // if the any of the end coords was less than the start coords, it means we went in a negative direction
      if (to.x < from.x || to.y < from.y) {
        return -distance;
      } else {
        return distance;
      }
    }
  }

  /**
   * Returns the displacement along the x and y axis
   * @param from starting point
   * @param to ending point
   */
  getDxDy(from: Point, to: Point): {dx: number; dy: number} {
    return {
      dx: to.x - from.x,
      dy: to.y - from.y,
    };
  }

  /**
   * Set the initial position of the touch value while dragging a line
   * @param position
   */
  setInitialTouchPosition(position: Point) {
    this.initialTouchPosition = position;
  }

  /**
   * Resets all tracked values
   */
  resetTouchPoints() {
    this.activeCorner = new Corner();
    this.activeLine = new Line();
    this.initialTouchPosition = null;
    this.initialLineCorners = {
      pointOne: null,
      pointTwo: null,
    };
    this.cornersSnapshot = null;
  }

  /**
   * Detect
   */

  /**
   * Detects a corner in the close proximity of the touch
   * @param x - x coordinate of touch
   * @param y - y coordinate of touch
   * @param corners - current value of corners
   */
  detectCorner = (x: number, y: number, corners: Corner[]) => {
    const TOUCH_AREA = Corner.TOUCH_BUFFER.MEDIUM;
    for (let corner of corners) {
      if (
        corner.point.x &&
        corner.point.y &&
        this.distanceBetween(
          {x, y},
          {x: corner.point.x.current, y: corner.point.y.current},
        ) <= TOUCH_AREA
      ) {
        this.activeCorner = corner;
        this.cornersSnapshot = corners;
        return;
      }
    }
  };

  /**
   * Returns an array of lines given the corners
   * @param corners - Current corners
   * @returns Line[]
   */
  private currentLines(corners: Corner[]) {
    const [topRight, bottomRight, bottomLeft, topLeft] = corners;

    const top = new Line(topLeft, topRight, 'top');
    const right = new Line(topRight, bottomRight, 'right');
    const bottom = new Line(bottomRight, bottomLeft, 'bottom');
    const left = new Line(bottomLeft, topLeft, 'left');
    return [top, right, bottom, left];
  }

  /**
   * Checks if a point lies in between a line
   * @param point - Point
   * @param line - Line
   * @returns true if point lies in between the line, false otherwise
   * @throws Error
   */
  private pointInBetweenLine(point: Point, line: Line) {
    /**
     * Point is in between in line if
     * 1. It satisfies the line equation or the cross product of two vectors forming the 3 points is zero
     * 2. x lies between the minimum and maximum x coordinates of the line
     * 3. y lies between the minimum and maximum y coordinates of the line
     */

    const linePointOneX = line.cornerOne.point.x?.current;
    const linePointOneY = line.cornerOne.point.y?.current;

    const linePointTwoX = line.cornerTwo.point.x?.current;
    const linePointTwoY = line.cornerTwo.point.y?.current;

    if (
      !isDefined(linePointOneX) ||
      !isDefined(linePointOneY) ||
      !isDefined(linePointTwoX) ||
      !isDefined(linePointTwoY)
    ) {
      throw new Error('Line points are undefined');
    }

    const dX = point.x - linePointOneX;
    const dY = point.y - linePointOneY;

    const dXl = linePointTwoX - linePointOneX;
    const dYl = linePointTwoY - linePointOneY;

    const crossProduct = dX * dYl - dY * dXl;

    // if cross product is not close to zero then it is definitely not on the line
    if (Math.abs(crossProduct) > this.LINE_TOUCH_THRESHOLD) {
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
  }

  /**
   * Detects a line in the close proximity of the touch
   * @param x - x coordinate of touch
   * @param y - y coordinate of touch
   * @param corners - current corners
   */
  detectLine(x: number, y: number, corners: Corner[]) {
    const [top, right, bottom, left] = this.currentLines(corners);

    const point = new Point(x, y);

    for (let line of [top, right, bottom, left]) {
      try {
        if (this.pointInBetweenLine(point, line)) {
          this.activeLine = line;
          this.initialLineCorners = {
            pointOne: {
              x: line.cornerOne.point.x?.current ?? 0,
              y: line.cornerOne.point.y?.current ?? 0,
            },
            pointTwo: {
              x: line.cornerTwo.point.x?.current ?? 0,
              y: line.cornerTwo.point.y?.current ?? 0,
            },
          };
          return;
        }
      } catch (error) {
        console.error('Error while detecting line', error);
      }
    }
  }

  /**
   * Checks if a corner was detected
   * @returns true if a corner was detected during the touch
   */
  cornerWasDetected() {
    return isDefined(this.activeCorner.position);
  }

  /**
   * Checks if a line was detected
   * @returns true if a line was detected during the touch
   */
  lineWasDetected() {
    return isDefined(this.activeLine.position);
  }

  /**
   * Moves the active corner to x,y
   * @param x - new x position
   * @param y - new y position
   * @throws Error
   */
  moveCorner(x: number, y: number) {
    if (
      isDefined(this.activeCorner.point.x) &&
      isDefined(this.activeCorner.point.y)
    ) {
      // if (this.isPositionOutOfBounds(x, y)) {
      //   return;
      // }
      this.activeCorner.point.x.current = x;
      this.activeCorner.point.y.current = y;
    } else {
      throw new Error('No active corner while moving');
    }
  }

  /**
   * Moves the line to the new x,y
   * @param x - new x position
   * @param y - new y position
   * @throws Error
   */
  moveLine(x: number, y: number) {
    // subtract the active displacement of touch from the initial position
    const pointOne = this.activeLine.cornerOne.point;
    const pointTwo = this.activeLine.cornerTwo.point;

    if (!isDefined(this.initialTouchPosition)) {
      throw new Error('No initial touch position');
    }

    if (
      !isDefined(pointOne.x) ||
      !isDefined(pointOne.y) ||
      !isDefined(pointTwo.x) ||
      !isDefined(pointTwo.y)
    ) {
      throw new Error('One of the corner points of the line was not defined');
    }

    if (
      !isDefined(this.initialLineCorners.pointOne) ||
      !isDefined(this.initialLineCorners.pointOne) ||
      !isDefined(this.initialLineCorners.pointTwo) ||
      !isDefined(this.initialLineCorners.pointTwo)
    ) {
      throw new Error('Initial position of corners was not available');
    }

    const {dx, dy} = this.getDxDy(this.initialTouchPosition, new Point(x, y));

    pointOne.x.current = this.initialLineCorners.pointOne.x + dx;
    pointOne.y.current = this.initialLineCorners.pointOne.y + dy;

    pointTwo.x.current = this.initialLineCorners.pointTwo.x + dx;
    pointTwo.y.current = this.initialLineCorners.pointTwo.y + dy;
  }

  /**
   * Returns the active corner's detached values
   * @throws Error
   */
  detachCorner(): DetachedCorner {
    if (
      isDefined(this.activeCorner.point.x) &&
      isDefined(this.activeCorner.point.y) &&
      isDefined(this.activeCorner.position)
    ) {
      return {
        point: {
          x: this.activeCorner.point.x.current,
          y: this.activeCorner.point.y.current,
        },
        position: this.activeCorner.position,
      };
    } else {
      throw new Error('No valid active corner to detach');
    }
  }

  /**
   * Returns the active line's detached corners
   * @throws Error
   */
  detachLine(): DetachedLine {
    const cornerOne = this.activeLine.cornerOne;
    const cornerTwo = this.activeLine.cornerTwo;
    const position = this.activeLine.position;
    if (
      isDefined(cornerOne.point.x) &&
      isDefined(cornerOne.point.y) &&
      isDefined(cornerOne.position) &&
      isDefined(cornerTwo.point.x) &&
      isDefined(cornerTwo.point.y) &&
      isDefined(cornerTwo.position) &&
      isDefined(position)
    ) {
      return {
        cornerOne: {
          point: {
            x: cornerOne.point.x?.current,
            y: cornerTwo.point.y?.current,
          },
          position: cornerOne.position,
        },
        cornerTwo: {
          point: {
            x: cornerTwo.point.x?.current,
            y: cornerTwo.point.y?.current,
          },
          position: cornerTwo.position,
        },
      };
    } else {
      throw new Error('No a valid active line to detach');
    }
  }
}
