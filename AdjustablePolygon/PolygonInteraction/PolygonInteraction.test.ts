import {PolygonInteraction} from './PolygonInteraction.lib';
import {Point} from '../Point';

const polygonInteraction = new PolygonInteraction();

describe('distanceBetween', () => {
  const p1 = new Point(10, 10);
  const p2 = new Point(5, 10);
  const p3 = new Point(10, 5);

  test('DISTANCE: (10,10) <--> (5,10) = 5', () => {
    expect(polygonInteraction.distanceBetween(p1, p2)).toBe(5);
  });

  test('DISPLACEMENT: (10,10) -> (5,10)', () => {
    expect(polygonInteraction.distanceBetween(p1, p2, true)).toBe(-5);
  });

  test('DISPLACEMENT: (5,10) -> (10,10)', () => {
    expect(polygonInteraction.distanceBetween(p3, p1, true)).toBe(5);
  });
});
