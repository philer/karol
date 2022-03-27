import * as config from "./config"
import {flattenKeys} from "./util"


export type InterpolationData = Record<string, any>

const INTERPOLATION_REGEX = /\{(\w+)\}/g

const BROWSER_LOCALE = navigator.language.split(/[_-]/)[0]

let flatTranslations: Map<string, string>

async function setLocales(locales: string[]) {
  const promises = Array.from(new Set(Array.isArray(locales) ? locales : [locales]))
    .filter(Boolean)
    .reverse()
    .map(getLocaleData)
  const definitions = await Promise.all(promises)
  flatTranslations = new Map(definitions.map(flattenKeys).flatMap(Object.entries))
}


export const getLocaleData = (locale: string) =>
  config.get<Translations>(`localization/${
    locale.replace(/auto(?=-|$)/, BROWSER_LOCALE)
  }.js`)


/** Translate a language variable according to the configured locale. */
export function translate(variable: string, values?: InterpolationData) {
  if (!flatTranslations.has(variable)) {
    console.warn(`Could not resolve localization variable ${variable}`)
    return variable
  }
  const result = flatTranslations.get(variable) as string
  return values ? interpolate(result, values) : result
}


/** Subsitute values into a string. Inspired by Python's str.format method. */
const interpolate = (string: string, values: InterpolationData) =>
  string.replace(INTERPOLATION_REGEX, (match, key) => values[key] || match)


/** Load translations */
export async function init() {
  const {locale} = await config.get()
  await setLocales(locale)

  // setKeywords(Map(
  //   keywordTokenTypes.map(tt => [translate(`language.${tt}`), tt]),
  // ))
}


/** Full type of localization config file data. */
export type Translations = {
  welcome: string
  older_release: string
  or: string
  program: {
    code: string
    save: string
    load: string
    help: string
    default_filename: string
  }
  simulation: {
    run: string
    speed: string
    message: {
      running: string
      paused: string
      canceled: string
      finished: string
    }
  }
  world: {
    world: string
    reset: string
    save: string
    load: string
    settings: string
    length: string
    width: string
    height: string
    flat: string
    show_player: string
    default_filename: string
    action: {
      placeBlock: string
      takeBlock: string
      placeMark: string
      takeMark: string
      turnLeft: string
      step: string
      stepBackwards: string
      turnRight: string
    }
  }
  language: {
    keywords: {
      IF: string[]
      THEN: string[]
      ELSE: string[]
      WHILE: string[]
      DO: string[]
      NOT: string[]
      REPEAT: string[]
      TIMES: string[]
      PROGRAM: string[]
      ROUTINE: string[]
    }
    builtins: {
      isLookingAtEdge: string[]
      isNotLookingAtEdge: string[]
      step: string[]
      stepBackwards: string[]
      isLookingNorth: string[]
      isLookingEast: string[]
      isLookingSouth: string[]
      isLookingWest: string[]
      turnLeft: string[]
      turnRight: string[]
      isLookingAtBlock: string[]
      isNotLookingAtBlock: string[]
      placeBlock: string[]
      takeBlock: string[]
      isOnMark: string[]
      isNotOnMark: string[]
      placeMark: string[]
      takeMark: string[]
    }
    help: {
      example: string
      copy: string
      all_builtins: string
      conditional_statements: string
      repetitions: string
      custom_routines: string
      turnAround: string
    }
  }
  help: {
    controls: string
    about: string
    builtin: string
    key: string
  }
  error: {
    browser_feature_not_available: string
    invalid_world_file: string
    parser: {
      token_read: string
      unexpected_eof: string
      unexpected_eof_instead: string
      unexpected_token: string
      unexpected_token_instead: string
      nested_program_definition: string
      nested_routine_definition: string
    }
    runtime: {
      undefined: string
      max_recursion_depth_exceeded: string
      cannot_overwrite_function: string
      unimplemented_statement_type: string
      unimplemented_expression_type: string
    }
    world: {
      move_out_of_world: string
      jump_too_high: string
      move_cuboid: string
      action_out_of_world: string
      action_cuboid: string
      action_too_high: string
      action_no_blocks: string
      action_already_marked: string
      action_no_mark: string
    }
  }
}
