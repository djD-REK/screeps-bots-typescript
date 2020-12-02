export const lookForAtAreaWithOffset = (
  creep: Creep,
  offset: number,
  type:
    | "constructionSite"
    | "creep"
    | "energy"
    | "exit"
    | "flag"
    | "mineral"
    | "deposit"
    | "nuke"
    | "resource"
    | "source"
    | "structure"
    | "terrain"
    | "tombstone"
    | "powerCreep"
    | "ruin"
) => {
  // The map is an x-y coordinate board from 0-49 (0,0 is top-left)
  /*
  let lookTop = creep.pos.y - offset < 0 ? 0 : creep.pos.y - offset
  let lookLeft = creep.pos.x - offset < 0 ? 0 : creep.pos.x - offset
  let lookBottom = creep.pos.y + offset > 49 ? 49 : creep.pos.y + offset
  let lookRight = creep.pos.x + offset > 49 ? 49 : creep.pos.x + offset
  */
  let lookTop = creep.pos.y - offset
  let lookLeft = creep.pos.x - offset
  let lookBottom = creep.pos.y + offset
  let lookRight = creep.pos.x + offset
  return creep.room.lookForAtArea(
    type, // one of the LOOK_ constants
    lookTop,
    lookLeft,
    lookBottom,
    lookRight,
    true // asArray
  )
}
