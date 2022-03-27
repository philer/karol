import {h} from "preact"
import {useContext, useEffect, useRef, useState} from "preact/hooks"

import * as graphics from "../graphics"
import {translate as t} from "../localization"
import {checkKdwFormat, World} from "../simulation/world"
import {clamp, clsx, defaultPreventer} from "../util"
import {readFile, saveTextAs} from "../util/files"
import type {ChangeEvent} from "../util/types"
import {Help} from "./Help"
import {IconCheckSquare, IconCog, IconMinus, IconPlus, IconQuestion, IconRobot, IconSquare} from "./Icon"
import {Logging, LogOutput} from "./Logging"
import {Popover} from "./Popover"
import {WorldControls} from "./WorldControls"

import * as buttonClasses from "../button.module.scss"
import * as classes from "./WorldPanel.module.scss"

export interface WorldPanelProps {
  onChange: (world: World) => void
  isSimulationRunning?: boolean
}

export const WorldPanel = ({onChange, isSimulationRunning}: WorldPanelProps) => {
  const log = useContext(Logging)

  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const settingsToggleRef = useRef<HTMLButtonElement>(null)
  const [isHelpVisible, setIsHelpVisible] = useState(false)
  const helpToggleRef = useRef<HTMLButtonElement>(null)

  const [world, setWorld] = useState(new World(18, 7, 5))
  const [showFlat, setShowFlat] = useState(false)
  const [showPlayer, setShowPlayer] = useState(true)

  useEffect(() => onChange(world), [world])
  useEffect(() => graphics.render(world), [world, showFlat, showPlayer])

  const updateSetting = (name: "width" | "length" | "height") => (value: number) =>
    setWorld(({width, length, height}) =>
      new World(...Object.values({width, length, height, [name]: value}) as
                [number, number, number]),
    )

  const resetWorld = () =>
    setWorld(({width, length, height}) => new World(width, length, height))

  const saveWorld = () =>
    saveTextAs(world.toKdwString(), t("world.default_filename"))

  async function loadWorld(evt: ChangeEvent) {
    const text = await readFile((evt.currentTarget.files as FileList)[0])
    if (checkKdwFormat(text)) {
      const newWorld = World.parseKdw(text)
      setWorld(newWorld)
    } else {
      log.error("error.invalid_world_file")
    }
  }

  function updateShowFlat(checked: boolean) {
    graphics.showHeightNoise(!checked)
    setShowFlat(checked)
  }

  function updateShowPlayer(checked: boolean) {
    graphics.showPlayer(checked)
    setShowPlayer(checked)
  }

  return (
    <div class={classes.worldPanel}>
      <h2><IconRobot /> {t("world.world")}</h2>

      <nav class={classes.tools} >

        <button class={buttonClasses.button} onClick={resetWorld}>{t("world.reset")}</button>

        <label class={buttonClasses.button}>
          {t("world.load")}
          <input type="file" class="hidden" onChange={loadWorld} />
        </label>

        <button class={buttonClasses.button} onClick={saveWorld}>{t("world.save")}</button>

        <button
          class={buttonClasses.iconButton}
          ref={settingsToggleRef}
          onClick={() => setIsSettingsVisible(visible => !visible)}
        >
          <IconCog />
        </button>
        <Popover
          show={isSettingsVisible}
          autoClose
          onClose={() => setIsSettingsVisible(false)}
          anchor={settingsToggleRef.current}
          orientation="below right"
          class={clsx(classes.toolsPopover, classes.settings)}
        >
          <form>
            <h3>{t("world.settings")}</h3>
            <fieldset>
              <label for="width-input">{t("world.width")}</label>
              <NumberInput
                id="width-input"
                max={100}
                value={world.width}
                onChange={updateSetting("width")}
              />
              <label for="length-input">{t("world.length")}</label>
              <NumberInput
                id="length-input"
                max={100}
                value={world.length}
                onChange={updateSetting("length")}
              />
              <label for="height-input">{t("world.height")}</label>
              <NumberInput
                id="height-input"
                max={25}
                value={world.height}
                onChange={updateSetting("height")}
              />
            </fieldset>
            <fieldset>
              <label for="flat-toggle">{t("world.flat")}</label>
              <Toggle
                id="flat-toggle"
                checked={showFlat}
                onChange={updateShowFlat}
              />
              <label for="show-player-toggle">{t("world.show_player")}</label>
              <Toggle
                id="show-player-toggle"
                checked={showPlayer}
                onChange={updateShowPlayer}
              />
            </fieldset>
          </form>
        </Popover>

        <button
          class={buttonClasses.iconButton}
          ref={helpToggleRef}
          onClick={() => setIsHelpVisible(visible => !visible)}
        >
          <IconQuestion />
        </button>
        <Popover
          show={isHelpVisible}
          autoClose
          onClose={() => setIsHelpVisible(false)}
          anchor={helpToggleRef.current}
          orientation="below right"
          class={classes.toolsPopover}
        >
          <Help />
        </Popover>

      </nav>


      <WorldControls world={world} disabled={isSimulationRunning} />

      <LogOutput class={classes.log} />

      <div class={classes.canvasContainer}>
        <canvas
          class={classes.canvas}
          ref={graphics.setCanvas}
          width="600"
          height="400"
        >
            Your Browser needs to support HTML5
        </canvas>
      </div>

    </div>
  )
}


type NumberInputProps = {
  id?: string
  min?: number
  max: number
  value: number
  onChange: (value: number) => void
}
const NumberInput = ({id, min=1, max, value, onChange}: NumberInputProps) =>
  <div className={classes.numberInput}>
    <input type="number" id={id} min={min} max={max} value={value}
      onChange={({currentTarget: {min, max, value}}) => onChange(clamp(+min, +max, +value))}
    />
    <button type="button" onClick={defaultPreventer(() => onChange(value - 1))}>
      <IconMinus />
    </button>
    <button type="button" onClick={defaultPreventer(() => onChange(value + 1))}>
      <IconPlus />
    </button>
  </div>


type ToggleProps = {
  id?: string
  checked: boolean
  onChange: (checked: boolean) => void
}
const Toggle = ({id, checked, onChange}: ToggleProps) =>
  <div className={classes.toggle}>
    <input type="checkbox" id={id} checked={checked}
      onChange={({currentTarget: {checked}}: ChangeEvent) => onChange(checked)} />
    <button type="button" onClick={defaultPreventer(() => onChange(!checked))}>
      {checked ? <IconCheckSquare x2 /> : <IconSquare x2 />}
    </button>
  </div>

