import {h, JSX} from "preact"

import {translate as t} from "../localization"
import {IconArrowDown, IconArrowLeft, IconArrowRight, IconArrowUp} from "./Icon"
import {Tab, Tabs} from "./Tabs"
import {keyMap} from "./WorldControls"

import * as classes from "./Help.module.scss"

const keyIcons: Record<string, JSX.Element> = {
  ArrowUp: <IconArrowUp />,
  ArrowDown: <IconArrowDown />,
  ArrowLeft: <IconArrowLeft />,
  ArrowRight: <IconArrowRight />,
}

const inverseKeyMap = Object.entries(keyMap).reduce((acc, [key, builtin]) => ({
  ...acc,
  [builtin]: acc[builtin] ? [...acc[builtin], key] : [key],
}), {} as Record<string, string[]>)

export const Help = () =>
  <div class={classes.root}>
    <Tabs>

      <Tab title={t("help.controls")}>
        <dl class={classes.content}>
          <dd class={classes.dlTitle}>{t("help.builtin")}</dd>
          <dt class={classes.dlTitle}>{t("help.key")}</dt>
          {Object.entries(inverseKeyMap).flatMap(([builtin, keys]) => [
            <dd key={"dd-" + builtin}>
              <code>
                <span class="token identifier builtin">
                  {t(`language.builtins.${builtin}`)[0]}
                </span>
                <span class="token punctuation">()</span>
              </code>
            </dd>,
            <dt key={"dt-" + builtin}>
              {keys.flatMap((key, idx, {length}) => [
                <span key={builtin + " " + key}>{keyIcons[key] || key}</span>,
                idx < length - 1 && t("or"),
              ])}
            </dt>,
          ])}
        </dl>
      </Tab>

      <Tab title={t("help.about")}>
        <div class={classes.content}>
          <p>
            Online Karol is inspired by
            {" "}<a href="https://de.wikipedia.org/wiki/Robot_Karol">Robot karol</a>.
          </p>
          <p>
            To follow the development, visit
            {" "}<a href="https://github.com/philer/karol">
              github.com/philer/karol
            </a>.
            You can also download a release and host it at your
            school with custom settings.
          </p>
          <p>
            If you find any bugs or you have a suggestion,
            please report an
            {" "}<a href="https://github.com/philer/karol/issues">issue</a>{" "}
            or send an email to karol at philer dot org.
          </p>
          <p>
            You can also help translate online Karol into more languages!
          </p>

          <h3>Acknowledgements</h3>
          <ul>
            <li>
              "botty" sprite theme:
              <Link>https://opengameart.org/content/botty</Link>
            </li>
            <li>
              "neoz7" sprite theme:
              <Link>https://neoz7.deviantart.com/art/NEW-Iso-Tiles-Free-487740820</Link>
            </li>
            <li>
              "Fira Code" monospace font:
              <Link>https://github.com/tonsky/FiraCode</Link>
            </li>
            <li>
              "noisejs" library:
              <Link>https://github.com/josephg/noisejs</Link>
            </li>
          </ul>

        </div>
      </Tab>

    </Tabs>
  </div>


const Link = ({children}: {children: string}) =>
  <a href={children} class={classes.urlLink}>{children}</a>
