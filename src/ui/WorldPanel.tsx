import {h} from "preact"
import {useContext, useEffect, useState} from "preact/hooks"

import {World, checkKdwFormat} from "../simulation/world"
import * as graphics from "../graphics"
import {translate as t} from "../localization"
import {clamp, clsx, defaultPreventer} from "../util"
import {readFile, saveTextAs} from "../util/files"
import {Logging, LogOutput} from "./Logging"
import {IconCog, IconTimes} from "./Icon"
import {WorldControls} from "./WorldControls"
import type {ChangeEvent} from "../util/types"


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
  const [world, setWorld] = useState(new World(width, length, height))
  const [showFlat, setShowFlat] = useState(false)
  const [showPlayer, setShowPlayer] = useState(true)

  useEffect(() => onChange(world), [world])
  useEffect(() => graphics.render(world), [world, showFlat, showPlayer])

  const updateSetting = ({currentTarget: {name, min, max, value}}: ChangeEvent) =>
    setSettings(settings => ({...settings, [name]: clamp(+min, +max, +value)}))

  const toggleSettings = () => setIsSettingsVisible(visible => !visible)

  const resetWorld = () =>
    setWorld(new World(width, length, height))

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
    <section class="panel world-panel">
      <header><h2>{t("world.world")}</h2></header>

      <div class="world-wrapper">
        <nav class="world-tools">
          <button class="button icon-button" onClick={defaultPreventer(toggleSettings)}>
            <IconCog />
          </button>
          <button class="button" onClick={resetWorld}>{t("world.reset")}</button>

          <i class="separator" />

          <label class="button">
            {t("world.load")}
            <input type="file" class="hidden" onChange={loadWorld} />
          </label>
          <button class="button" onClick={saveWorld}>{t("world.save")}</button>
        </nav>

        <div class="world-canvas-container">

          <form
            class={clsx("world-settings", !isSettingsVisible && "hidden")}
            onSubmit={defaultPreventer()}
          >
            <label>
              {t("world.width")}:
              <input type="number" name="width" min={1} max={100} value={width}
                onChange={updateSetting} />
            </label>
            <label>
              {t("world.length")}:
              <input type="number" name="length" min={1} max={100} value={length}
                onChange={updateSetting} />
            </label>
            <label>
              {t("world.height")}:
              <input type="number" name="height" min={1} max={25} value={height}
                onChange={updateSetting} />
            </label>
            <label>
              <input type="checkbox" checked={showFlat}
                onChange={updateShowFlat} />
              <span>{t("world.flat")}</span>
            </label>
            <label>
              <input type="checkbox" checked={showPlayer}
                onChange={updateShowPlayer} />
              <span>{t("world.show_player")}</span>
            </label>

            <i class="expander" />

            <button class="world-settings-close" onClick={toggleSettings}>
              <IconTimes />
            </button>
          </form>

          <div class="world-canvas-box">
            <canvas
              class="world-canvas"
              ref={graphics.setCanvas}
              width="600"
              height="400"
            >
              Your Browser needs to support HTML5
            </canvas>
          </div>

          <WorldControls world={world} disabled={isSimulationRunning} />

        </div>

        <LogOutput />

      </div>
    </section>
  )
}
