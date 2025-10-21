/**
 * Only pick some fields in object, other properties will deleted.
 *
 * @param data - Object to initiate.
 * @param picks - Keys of data to pick.
 * @returns The object with only picked properties.
 */
export const pick = <T extends Record<string, any>, Z extends (keyof T)[] = []>(data: T, picks?: Z): Pick<T, Z[number]> => {
  const pickedData = { ...data };
  if (picks)
    for (const pick of Object.keys(pickedData)) {
      if (!picks.includes(pick as keyof object)) {
        delete pickedData[pick as keyof object];
      }
    }
  return pickedData;
};

/**
 * Only omit some fields in object, other properties will remain.
 *
 * @param data - Object to initiate.
 * @param omits - Keys of data to omit.
 * @returns The object with omitted properties.
 */
export const omit = <T extends Record<string, any>, Z extends (keyof T)[] = []>(data: T, omits?: Z): Omit<T, Z[number]> => {
  const omittedData = { ...data };
  if (omits)
    for (const omit of omits) {
      delete omittedData[omit];
    }
  return omittedData;
};

type RecordReturn<T extends Record<string, any> | string[], Z> = T extends string[] ? Record<T[number], Z> : Record<keyof T, Z>;
/**
 * Creates a new object with the same keys as the given data,
 * but all values replaced with a fixed type/value.
 *
 * @param data - Array of strings or object to get the keys from
 * @param recordType - The value or type to assign to each key
 * @returns A new object where each key has the same value `recordType`
 *
 * @example
 * ```ts
 * // From array
 * const arr = ['foo', 'bar', 'baz'] as const;
 * const rec1 = record(arr, 0); // { foo: number; bar: number; baz: number }
 * // rec1 = { foo: 0, bar: 0, baz: 0 }
 *
 * // From object
 * const obj = { foo: 1, bar: "yo" };
 * const rec2 = record(obj, false); // { foo: boolean; bar: boolean }
 * // rec2 = { foo: false, bar: false }
 * ```
 */
export function record<K extends string, T extends Record<K, any> | K[], Z>(data: T, recordType: Z): RecordReturn<T, Z> {
  if (Array.isArray(data)) {
    const builded = {} as Record<(typeof data)[number], Z>;
    data.forEach((k: keyof typeof builded) => {
      builded[k] = recordType;
    });
    return builded as any;
  } else {
    const builded = { ...data } as Record<string, any>;
    Object.keys(builded).forEach((key) => {
      builded[key] = recordType;
    });
    return builded as any;
  }
}
