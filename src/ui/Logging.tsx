import {ComponentChild, ComponentChildren, createContext, h} from "preact"
import {useContext, useEffect, useRef, useState} from "preact/hooks"

import {Exception, translate as t} from "../localization"
import {noop} from "../util"

import style from "./LogOutput.css"

export type LogLevel = "info" | "error"

export interface Message {
  level: LogLevel
  message?: [string, ...(string|number)[]]
  child?: ComponentChild
  exception?: Exception
}

export interface Logger {
  info(message: string, ...data: (string | number)[]): void
  info(child: ComponentChild): void
  error(message: string, ...data: (string | number)[]): void
  error(exception: Exception): void
  error(child: ComponentChild): void
  messages: Message[]
}

export const Logging = createContext<Logger>({info: noop, error: noop, messages: []})


export const LoggingProvider = (props: {children: ComponentChildren}) => {
  const [messages, setMessages] = useState<Message[]>([])

  const log = (level: LogLevel, message: ComponentChild | Exception, ...data: any[]) => {
    setMessages(messages => [
      ...messages,
      typeof message === "string"
        ? {level, message: [message, ...data]}
        : message instanceof Exception
          ? {exception: message, level}
          : {level, child: message},
    ])
  }
  return (
    <Logging.Provider value={{
      messages,
      info: (message: ComponentChild, ...args: any[]) => log("info", message, ...args),
      error: (message: ComponentChild | Exception, ...args: any[]) => log("error", message, ...args),
    }}>
      {props.children}
    </Logging.Provider>
  )
}


export const LogOutput = () => {
  const {messages} = useContext(Logging)
  const ref = useRef<HTMLPreElement>()

  useEffect(() => {
    setTimeout(() => ref.current?.scrollBy({top: 20, behavior: "smooth"}), 50)
  }, [messages])

  return (
    <pre ref={ref} class={style.root}>
      {messages.map(({level, message, exception, child}, idx) =>
        // idx as key is fine as long as we only append
        <p key={idx} class={style[level]}>
          {message ? t(...message) : exception || child}
        </p>,
      )}
    </pre>
  )
}

