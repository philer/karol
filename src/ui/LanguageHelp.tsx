import {h} from "preact"
import {useMemo, useState} from "preact/hooks"

import * as config from "../config"
import type {LanguageSpecification} from "../language/specification"
import {getLocaleData, translate as t, Translations} from "../localization"
import {useAsyncEffect} from "../util/hooks"
import {Highlight} from "./Highlight"

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

  /** Translate code */
  const Code = ({children}: {children: string}) =>
    <Highlight spec={spec} class={classes.example}>
      {useMemo(
        () => dedent(children).replace(/\w+/g, match => translations[match]?.[0] ?? match),
        [children, translations, spec],
      )}
    </Highlight>

  return (
    <div class={classes.root}>
      <h3>{t("language.help.example")}</h3>
      <Code>
        {`
          REPEAT WHILE isNotLookingAtEdge()
            step()
          *REPEAT
        `}
      </Code>

      <h3>{t("language.help.builtins")}</h3>
      <ul>
        {Object.values(builtins).map((([builtin]) =>
          <li key={builtin}>
            <code className="token identifier builtin">{builtin}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}


const dedent = (text: string) => {
  const [indent] = /^ +(?=\w)/m.exec(text) || [""]
  return text.trim().replace(new RegExp(`^${indent}`, "mg"), "")
}
