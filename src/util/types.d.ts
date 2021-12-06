import {JSX} from "preact"

export type ElementProps = JSX.HTMLAttributes<HTMLElement>
export type DivProps = JSX.HTMLAttributes<HTMLDivElement>

export type ChangeEvent<T extends EventTarget = HTMLInputElement> = JSX.TargetedEvent<T>
