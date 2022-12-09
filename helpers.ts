export function isDefined<T>(
  value: NonNullable<T> | undefined | null,
): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function eachItemOfArrayIsDefined<T>(
  value: Array<NonNullable<T> | undefined | null>,
): value is Array<NonNullable<T>> {
  return value.every(isDefined);
}

export function eachPropertyOfObjectIsDefined<
  K extends string | number | symbol,
  T,
>(
  value: Record<K, NonNullable<T> | undefined | null>,
): value is Record<K, NonNullable<T>> {
  return Object.values(value).every(isDefined);
}
