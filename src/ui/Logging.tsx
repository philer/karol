import {ComponentChild, ComponentChildren, createContext, h} from "preact"
import {StateUpdater, useContext, useState} from "preact/hooks"

import {Exception} from "../exception"
import {translate as t} from "../localization"
import {noop} from "../util"

import style from "./Logging.module.css"


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
}

export class LoggerImpl implements Logger {
  _setMessages: StateUpdater<Message[]> = noop

  log = (level: LogLevel, message: ComponentChild | Exception, ...data: any[]) =>
    this._setMessages(messages => [
      ...messages,
      typeof message === "string"
        ? {level, message: [message, ...data]}
        : message instanceof Exception
          ? {level, exception: message}
          : {level, child: message},
    ])

  info = (message: ComponentChild, ...args: any[]) =>
    this.log("info", message, ...args)

  error = (message: ComponentChild | Exception, ...args: any[]) =>
    this.log("error", message, ...args)
}

export const Logging = createContext<Logger>(new LoggerImpl())
export const LogMessages = createContext<Message[]>([])


export const LoggingProvider = (props: {children: ComponentChildren}) => {
  const [logger] = useState(new LoggerImpl())
  const [messages, setMessages] = useState<Message[]>([])

  // Modify state to avoid Logger reference updates triggering re-renders
  logger._setMessages = setMessages

  return (
    <Logging.Provider value={logger}>
      <LogMessages.Provider value={messages}>
        {props.children}
      </LogMessages.Provider>
    </Logging.Provider>
  )
}


export const LogOutput = () => {
  const messages = useContext(LogMessages)
  return (
    <pre class={style.root}>
      {messages.map(({level, message, exception, child}, idx) =>
        <p
          key={idx}  // idx as key is fine as long as we only append
          ref={p => idx === messages.length - 1 && p?.scrollIntoView({behavior: "smooth"})}
          class={style[level]}
        >
          {message
            ? t(...message)
            : exception ? t(exception.message, ...exception.data) : child
          }
        </p>,
      )}
    </pre>
  )
}

