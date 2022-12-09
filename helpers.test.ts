import {
  isDefined,
  eachItemOfArrayIsDefined,
  eachPropertyOfObjectIsDefined,
} from './helpers';

describe('eachItemOfArrayIsDefined', () => {
  test('false when some values are undefined or null', () => {
    expect(eachItemOfArrayIsDefined([null, 1, 2, 4, null])).toBe(false);
    expect(eachItemOfArrayIsDefined([1, 2, 4, null])).toBe(false);
    expect(eachItemOfArrayIsDefined([null, null, null])).toBe(false);
  });

  test('true when all values are defined', () => {
    expect(eachItemOfArrayIsDefined([1, 0, 3, 4])).toBe(true);
    expect(eachItemOfArrayIsDefined([1])).toBe(true);
    expect(eachItemOfArrayIsDefined([])).toBe(true);
  });
});

describe('isDefined', () => {
  test('false when value is null', () => {
    expect(isDefined(null)).toBe(false);
  });

  test('false when value is undefined', () => {
    expect(isDefined(undefined)).toBe(false);
  });

  test('true when value is not null or undefined', () => {
    expect(isDefined(1)).toBe(true);
  });

  test('true when value is 0', () => {
    expect(isDefined(0)).toBe(true);
  });
});

describe('eachItemOfObjectIsDefined', () => {
  test('false when some property is null', () => {
    expect(eachPropertyOfObjectIsDefined({a: null, b: 1})).toBe(false);
  });

  test('false when some property is undefined', () => {
    expect(eachPropertyOfObjectIsDefined({a: undefined, b: 1})).toBe(false);
  });

  test('true when every property is defined', () => {
    expect(eachPropertyOfObjectIsDefined({a: 0, b: 1})).toBe(true);
  });
});
