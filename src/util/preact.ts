import type {Ref} from "preact"
import {Inputs, useEffect} from "preact/hooks"


/** Simple wrapper that allows use of async callback as effect hook */
export const useAsyncEffect = (effect: () => unknown, inputs?: Inputs) =>
  useEffect(() => void effect(), inputs)


/** Combine multiple refs into one callback ref */
export const mergeRefs = <T>(...refs: (Ref<T> | null | undefined)[]) => (elem: T) => {
  for (const ref of refs) {
    if (typeof ref === "function") {
      ref(elem)
    } else if (ref) {
      ref.current = elem
    }
  }
}
