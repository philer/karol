import {h} from "preact"
import {useContext, useEffect, useRef, useState} from "preact/hooks"

import * as graphics from "../graphics"
import {translate as t} from "../localization"
import {checkKdwFormat, World} from "../simulation/world"
import {clamp} from "../util"
import {readFile, saveTextAs} from "../util/files"
import type {ChangeEvent} from "../util/types"
import {IconCog, IconRobot} from "./Icon"
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

  const [{width, length, height}, setSettings] = useState({
    width: 18,
    length: 7,
    height: 5,
  })
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const toolsToggleRef = useRef<HTMLButtonElement>(null)
  const [world, setWorld] = useState(new World(width, length, height))
  const [showFlat, setShowFlat] = useState(false)
  const [showPlayer, setShowPlayer] = useState(true)

  useEffect(() => onChange(world), [world])
  useEffect(() => graphics.render(world), [world, showFlat, showPlayer])

  const updateSetting = ({currentTarget: {name, min, max, value}}: ChangeEvent) =>
    setSettings(settings => ({...settings, [name]: clamp(+min, +max, +value)}))

  const resetWorld = () =>
    setWorld(new World(width, length, height))

  useEffect(resetWorld, [width, length, height])

  const saveWorld = () =>
    saveTextAs(world.toKdwString(), t("world.default_filename"))

  async function loadWorld(evt: ChangeEvent) {
    const text = await readFile((evt.currentTarget.files as FileList)[0])
    if (checkKdwFormat(text)) {
      const newWorld = World.parseKdw(text)
      setWorld(newWorld)
      setSettings({
        width: newWorld.width,
        length: newWorld.length,
        height: newWorld.height,
      })
    } else {
      log.error("error.invalid_world_file")
    }
  }

  function updateShowFlat({currentTarget: {checked}}: ChangeEvent) {
    graphics.showHeightNoise(!checked)
    setShowFlat(checked)
  }

  function updateShowPlayer({currentTarget: {checked}}: ChangeEvent) {
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
          ref={toolsToggleRef}
          onClick={() => setIsSettingsVisible(visible => !visible)}
        >
          <IconCog />
        </button>
        <Popover
          show={isSettingsVisible}
          autoClose
          onClose={() => setIsSettingsVisible(false)}
          anchor={toolsToggleRef.current}
          orientation="below right"
          class={classes.settings}
        >
          <form>
            <h3>{t("world.settings")}</h3>
            <fieldset>
              <label>{t("world.width")}</label>
              <input type="number" name="width" min={1} max={100} value={width}
                onChange={updateSetting} />

              <label>{t("world.length")}</label>
              <input type="number" name="length" min={1} max={100} value={length}
                onChange={updateSetting} />

              <label>{t("world.height")}</label>
              <input type="number" name="height" min={1} max={25} value={height}
                onChange={updateSetting} />
            </fieldset>
            <fieldset>
              <input type="checkbox" checked={showFlat}
                onChange={updateShowFlat} />
              <label>{t("world.flat")}</label>
              <input type="checkbox" checked={showPlayer}
                onChange={updateShowPlayer} />
              <label>{t("world.show_player")}</label>
            </fieldset>
          </form>
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
