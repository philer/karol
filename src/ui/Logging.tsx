import {ComponentChildren, createContext, h} from "preact"
import {useContext, useEffect, useRef, useState} from "preact/hooks"

import {Exception, translate as t} from "../localization"
import {noop} from "../util"

import style from "./LogOutput.css"

export type LogLevel = "info" | "error"

export interface Message {
  level: LogLevel
  message: string
  data: any[]
}

export interface Logger {
  info: (message: string, ...data: any[]) => void
  error: (message: string | Exception, ...data: any[]) => void
  messages: Message[]
}


export const Logging = createContext<Logger>({info: noop, error: noop, messages: []})


export const LoggingProvider = (props: {children: ComponentChildren}) => {
  const [messages, setMessages] = useState<Message[]>([])

  const log = (level: LogLevel, message: string | Exception, ...data: any[]) =>
    setMessages(messages => [
      ...messages,
      message instanceof Exception ? {...message, level} : {level, message, data},
    ])

  return (
    <Logging.Provider value={{
      messages,
      info: (...args) => log("info", ...args),
      error: (...args) => log("error", ...args),
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
      {messages.map(({level, message, data}, idx) =>
        // idx as key is fine as long as we only append
        <p key={idx} class={style[level]}>{t(message, ...data)}</p>,
      )}
    </pre>
  )
}

