export const getMineablePositions = (room: Room) => {
  // Select all sources with available energy from this room:
  const activeSources = room.find(FIND_SOURCES_ACTIVE)
  // Make an array of valid destinations to mine sources
  const mineablePositions: RoomPosition[] = []
  activeSources.forEach((source) => {
    const sourceX = source.pos.x
    const sourceY = source.pos.y
    // lookForAtArea(type, top, left, bottom, right, [asArray])
    const lookArray = room.lookForAtArea(
      LOOK_TERRAIN,
      sourceY - 1,
      sourceX - 1,
      sourceY + 1,
      sourceX + 1,
      true
    )
    lookArray
      .filter((positionAsJSON) => positionAsJSON.terrain !== "wall")
      .forEach((mineablePositionAsJSON) => {
        // Each item returned by lookForAtArea looks like:
        // {"type":"terrain","terrain":"plain","x":24,"y":42}
        const { x, y } = mineablePositionAsJSON
        mineablePositions.push(new RoomPosition(x, y, room.name))
      })
  })
  return mineablePositions
}
