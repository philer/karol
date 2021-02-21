import {JSX} from "preact"

export type ChangeEvent<T extends EventTarget = HTMLInputElement> = JSX.TargetedEvent<T>
