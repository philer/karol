import {ComponentChild, ComponentChildren, createContext, h} from "preact"
import {StateUpdater, useContext, useState} from "preact/hooks"

import {Exception} from "../exception"
import {InterpolationData, translate as t} from "../localization"
import {clsx, noop} from "../util"

import * as classes from "./Logging.module.scss"


export type LogLevel = "info" | "error"

export interface Message {
  level: LogLevel
  message?: [string, InterpolationData | undefined]
  child?: ComponentChild
  exception?: Exception
}

export interface Logger {
  info(message: string, data?: InterpolationData): void
  info(child: ComponentChild): void
  error(message: string, data?: InterpolationData): void
  error(exception: Exception): void
  error(child: ComponentChild): void
}

export class LoggerImpl implements Logger {
  _setMessages: StateUpdater<Message[]> = noop

  log = (level: LogLevel, message: ComponentChild | Exception, data?: InterpolationData) =>
    this._setMessages(messages => [
      ...messages,
      typeof message === "string"
        ? {level, message: [message, data]}
        : message instanceof Exception
          ? {level, exception: message}
          : {level, child: message},
    ])

  info = (message: ComponentChild, data?: InterpolationData) =>
    this.log("info", message, data)

  error = (message: ComponentChild | Exception, data?: InterpolationData) =>
    this.log("error", message, data)
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


export const LogOutput = ({class: class_}: {class?: string}) => {
  const messages = useContext(LogMessages)
  return (
    <pre class={clsx(classes.root, class_)}>
      {messages.map(({level, message, exception, child}, idx) =>
        <p
          key={idx}  // idx as key is fine as long as we only append
          ref={p => idx === messages.length - 1 && p?.scrollIntoView({behavior: "smooth"})}
          class={classes[level]}
        >
          {message
            ? t(...message)
            : exception ? t(exception.message, exception.data) : child
          }
        </p>,
      )}
    </pre>
  )
}

