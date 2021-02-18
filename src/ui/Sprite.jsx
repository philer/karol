import {h} from "preact"

import {sprites} from "../graphics"
import {css} from "../util"

export const Sprite = ({alt = "", ...rest}) => {
  const [name] = Object.entries(rest).find(([_, value]) => value === true)
  const {imagePath, crop} = sprites[name]
  return <img
    src={imagePath}
    alt={alt}
    style={crop && css({
      "object-fit": "none",
      "object-position": `-${crop.x}px -${crop.y}px`,
      "width": crop.width + "px",
      "height": crop.height + "px",
    })}
  />
}
