import {Corner} from './Corner';
import {Line} from './Line';
import {Point} from './Point';
import {isDefined} from './helpers';

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
   * Initial corner points
   */
  initialLineCorners: {
    pointOne: Point | null;
    pointTwo: Point | null;
  };

  private LINE_TOUCH_THRESHOLD = 5000;
  constructor() {
    this.activeCorner = new Corner();
    this.activeLine = new Line();
    this.initialTouchPosition = null;
    this.initialLineCorners = {
      pointOne: null,
      pointTwo: null,
    };
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

  getDxDy(from: Point, to: Point) {
    return {
      dx: to.x - from.x,
      dy: to.y - from.y,
    };
  }

  setInitialTouchPosition(position: Point) {
    this.initialTouchPosition = position;
  }

  resetTouchPoints() {
    this.activeCorner = new Corner();
    this.activeLine = new Line();
    this.initialTouchPosition = null;
    this.initialLineCorners = {
      pointOne: null,
      pointTwo: null,
    };
  }

  /**
   * Detect
   */

  // Corner
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
        return;
      }
    }
  };

  // Line
  private currentLines(corners: Corner[]) {
    const [topLeft, topRight, bottomRight, bottomLeft] = corners;

    const top = new Line(topLeft, topRight, 'top');
    const right = new Line(topRight, bottomRight, 'right');
    const bottom = new Line(bottomRight, bottomLeft, 'bottom');
    const left = new Line(bottomLeft, topLeft, 'left');
    return [top, right, bottom, left];
  }

  private pointInBetweenLine(point: Point, line: Line) {
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
      !isDefined(linePointOneX) ||
      !isDefined(linePointOneY) ||
      !isDefined(linePointTwoX) ||
      !isDefined(linePointTwoY)
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

  detectLine(x: number, y: number, corners: Corner[]) {
    const [top, right, bottom, left] = this.currentLines(corners);

    const point = new Point(x, y);

    for (let line of [top, right, bottom, left]) {
      if (this.pointInBetweenLine(point, line)) {
        console.log('DETECTED LINE: ', line.position);
        this.activeLine = line;
        this.initialLineCorners = {
          pointOne: {
            x: line.pointOne.point.x?.current ?? 0,
            y: line.pointOne.point.y?.current ?? 0,
          },
          pointTwo: {
            x: line.pointTwo.point.x?.current ?? 0,
            y: line.pointTwo.point.y?.current ?? 0,
          },
        };
        return;
      }
    }
  }

  /**
   * Move
   */

  detectedCorner() {
    return isDefined(this.activeCorner.position);
  }

  detectedLine() {
    return isDefined(this.activeLine.position);
  }

  moveCorner(x: number, y: number) {
    if (
      isDefined(this.activeCorner.point.x) &&
      isDefined(this.activeCorner.point.y)
    ) {
      this.activeCorner.point.x.current = x;
      this.activeCorner.point.y.current = y;
      console.log(
        'MOVE POINT: ',
        this.activeCorner.point.x?.current,
        this.activeCorner.point.y?.current,
      );
    }
  }

  moveLine(x: number, y: number) {
    // subtract the active displacement of touch from the initial position
    const pointOne = this.activeLine.pointOne.point;
    const pointTwo = this.activeLine.pointTwo.point;
    if (
      !this.initialTouchPosition ||
      !isDefined(pointOne.x) ||
      !isDefined(pointOne.y) ||
      !isDefined(pointTwo.x) ||
      !isDefined(pointTwo.y) ||
      !isDefined(this.initialLineCorners.pointOne) ||
      !isDefined(this.initialLineCorners.pointOne) ||
      !isDefined(this.initialLineCorners.pointTwo) ||
      !isDefined(this.initialLineCorners.pointTwo)
    ) {
      return;
    }
    // FIXME: get displacement not distance! we need negative value
    const {dx, dy} = this.getDxDy(this.initialTouchPosition, new Point(x, y));

    console.log('displacement', dx, dy);

    pointOne.x.current = this.initialLineCorners.pointOne.x + dx;
    pointOne.y.current = this.initialLineCorners.pointOne.y + dy;

    pointTwo.x.current = this.initialLineCorners.pointTwo.x + dx;
    pointTwo.y.current = this.initialLineCorners.pointTwo.y + dy;
  }
}
