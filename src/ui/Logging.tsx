import {h, createContext} from "preact"
import {useContext, useEffect, useRef, useState} from "preact/hooks"

import {translate as t, Exception} from "../localization"


export const Logging = createContext()


export const LoggingProvider = ({children}) => {
  const [messages, setMessages] = useState([])

  const log = (level, message, ...data) => setMessages(messages => [
    ...messages,
    message instanceof Exception ? {...message, level} : {level, message, data},
  ])

  const info = (message, ...data) => log("info", message, ...data)
  const error = (message, ...data) => log("error", message, ...data)

  return (
    <Logging.Provider value={{messages, info, error}}>
      {children}
    </Logging.Provider>
  )
}


export const LogOutput = () => {
  const {messages} = useContext(Logging)
  const ref = useRef()

  useEffect(
    () => setTimeout(ref.current?.scrollBy({top: 20, behavior: "smooth"}), 50),
    [messages],
  )

  return (
    <pre ref={ref} class="log-output">
      {messages.map(({level, message, data}, idx) =>
        // idx as key is fine as long as we only append
        <p key={idx} class={"log-" + level}>{t(message, ...data)}</p>,
      )}
    </pre>
  )
}

