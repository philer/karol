import {h} from "preact"
import {useMemo, useState} from "preact/hooks"

import * as config from "../config"
import type {LanguageSpecification} from "../language/specification"
import {getLocaleData, translate as t, Translations} from "../localization"
import {sleep} from "../util"
import {useAsyncEffect} from "../util/preact"
import {Highlight} from "./Highlight"
import {IconCheck, IconCopy} from "./Icon"
import {Tooltip} from "./Tooltip"

import * as classes from "./LanguageHelp.module.scss"


export const LanguageHelp = ({spec}: {spec: LanguageSpecification}) => {
  const [{keywords, builtins}, setTranslations] = useState({
    keywords: {},
    builtins: {},
  } as Translations["language"])

  const translations: Record<string, string[]> = {...keywords, ...builtins}

  useAsyncEffect(async () => {
    const {code: {locales}} = await config.get()
    const {language} = await getLocaleData(locales[0])
    setTranslations(language)
  }, [])

  let example = 1

  return (
    <div class={classes.root}>

      <h3>{t("language.help.repetitions")}</h3>
      <Code title={t("language.help.example") + " " + example++} spec={spec}
        translations={translations}>
        {`
          REPEAT 5 TIMES
              step()
          *REPEAT
        `}
      </Code>
      <Code title={t("language.help.example") + " " + example++} spec={spec}
        translations={translations}>
        {`
          REPEAT WHILE isNotLookingAtEdge()
              step()
          *REPEAT
        `}
      </Code>

      <h3>{t("language.help.conditional_statements")}</h3>
      <Code title={t("language.help.example") + " " + example++} spec={spec}
        translations={translations}>
        {`
          IF isNotLookingAtEdge()
              step()
          *IF
        `}
      </Code>
      <Code title={t("language.help.example") + " " + example++} spec={spec}
        translations={translations}>
        {`
          IF isNotLookingAtEdge()
              step()
          ELSE
              stepBackwards()
          *IF
        `}
      </Code>

      <h3>{t("language.help.custom_routines")}</h3>
      <Code title={t("language.help.example") + " " + example++} spec={spec}
        translations={translations}>
        {`
          ROUTINE ${t("language.help.turnAround")}()
              turnLeft()
              turnLeft()
          *ROUTINE
        `}
      </Code>

      <h3>{t("language.help.all_builtins")}</h3>
      <ul>
        {Object.values(builtins).map(builtins => builtins[0]).sort().map(builtin =>
          <li key={builtin}>
            <code className="token identifier builtin">{builtin}</code>
          </li>,
        )}
      </ul>
    </div>
  )
}

type CodeProps = {
  children: string
  spec: LanguageSpecification
  translations: Record<string, string[]>
  title?: string
}

/** Translate code */
const Code = ({children, spec, translations, title}: CodeProps) => {
  const [Icon, setIcon] = useState(() => IconCopy)
  const code = useMemo(
    () => dedent(children).replace(/\w+/g, match => translations[match]?.[0] ?? match),
    [children, translations, spec],
  )
  async function copyToClipboard() {
    await navigator.clipboard.writeText(code)
    setIcon(() => IconCheck)
    await sleep(5000)
    setIcon(() => IconCopy)
  }
  return (
    <div className={classes.code}>
      <header>
        <span>{title || t("language.help.example")}</span>
        <Tooltip left tip={t("language.help.copy")}>
          <button onClick={copyToClipboard}>
            <Icon fw />
          </button>
        </Tooltip>
      </header>
      <Highlight spec={spec}>{code}</Highlight>
    </div>
  )
}

const dedent = (text: string) => {
  const [indent] = /^ +(?=\w)/m.exec(text) || [""]
  return text.trim().replace(new RegExp(`^${indent}`, "mg"), "")
}
