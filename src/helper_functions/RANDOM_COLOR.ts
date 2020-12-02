export const RANDOM_COLOR = () => {
  const COLORS_ARRAY = [
    "blue",
    "orange",
    "red",
    "green",
    "black",
    "white",
    "yellow",
    "purple",
    "gold",
  ]
  return COLORS_ARRAY[Math.floor(Math.random() * COLORS_ARRAY.length)]
}
/*
 *https://docs.screeps.com/api/#RoomVisual.poly
 */

export const VISUALIZE_PATH_STYLE: PolyStyle = {
  fill: RANDOM_COLOR(),
  stroke: RANDOM_COLOR(),
  // These lineStyle properties don't work:
  // lineStyle: undefined, // the default
  // lineStyle: "dashed",
  // lineStyle: "dotted",
  strokeWidth: 0.15,
  opacity: 0.1,
}
