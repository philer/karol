import {h} from "preact"

import {AtlasSprite, sprites} from "../graphics"
import {css} from "../util"

export const Sprite = ({alt = "", ...rest}) => {
  // @ts-expect-error If we can't find it, just throw
  const [name] = Object.entries(rest).find(([_, value]) => value === true)
  const sprite = sprites[name]

  let style
  if (sprite instanceof AtlasSprite) {
    const {x, y, width, height} = sprite.crop
    style = css({
      "object-fit": "none",
      "object-position": `-${x}px -${y}px`,
      "width": width + "px",
      "height": height + "px",
    })
  }
  return <img src={sprite.imagePath} alt={alt} style={style} />
}
