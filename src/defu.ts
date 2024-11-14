import { isPlainObject } from "./_utils";
import type { Merger, DefuFn as DefuFunction, DefuInstance } from "./types";

// Base function to apply defaults
function _defu<T>(
  baseObject: T,
  defaults: any,
  namespace = ".",
  merger?: Merger,
): T {
  if (!isPlainObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }

  const object = Object.assign({}, defaults);

  for (const key in baseObject) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }

    const value = baseObject[key];

    if (value === null || value === undefined) {
      continue;
    }

    if (merger && merger(object, key, value, namespace)) {
      continue;
    }

    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]].filter((el, idx, arr) => {
        return arr.indexOf(el) === idx
      });
    } else if (isPlainObject(value) && isPlainObject(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger,
      );
    } else {
      object[key] = value;
    }
  }

  return object;
}

// Create defu wrapper with optional merger and multi arg support
export function createDefu(merger?: Merger): DefuFunction {
  return (...arguments_) =>
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c) => _defu(p, c, "", merger), {} as any);
}

// Standard version
export const defu = createDefu() as DefuInstance;
export default defu;

// Custom version with function merge support
export const defuFn = createDefu((object, key, currentValue) => {
  if (object[key] !== undefined && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

// Custom version with function merge support only for defined arrays
export const defuArrayFn = createDefu((object, key, currentValue) => {
  if (Array.isArray(object[key]) && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

export type { Defu } from "./types";
