import { getAccessibleRoomNamesWithVision } from "./helpersRoomNames"

export const getMineablePositionsInAllRoomsWithVision = () => {
  const mineablePositions: RoomPosition[] = []
  for (const room of Object.values(Game.rooms)) {
    mineablePositions.push(...getMineablePositions(room))
  }

  return mineablePositions
}

export const getMineablePositionsIncludingSurroundingRooms = (room: Room) => {
  const mineablePositions = getMineablePositions(room)
  const accessibleRoomNamesWithVision: string[] = getAccessibleRoomNamesWithVision(
    room
  )
  for (const accessibleRoomNameWithVision of accessibleRoomNamesWithVision) {
    mineablePositions.push(
      ...getMineablePositions(new Room(accessibleRoomNameWithVision))
    )
  }

  return mineablePositions

  /*
  // Unused code to check for unique positions (redundant)
  const mineablePositionsSet = new Set()
  const uniqueMineablePositions = []
  for (const mineablePosition of mineablePositions) {
    if (!mineablePositionsSet.has(String(mineablePosition))) {
      mineablePositionsSet.add(String(mineablePosition))
      uniqueMineablePositions.push(mineablePosition)
    }
  }

  console.log(`Unique mineable positions: ${uniqueMineablePositions}`)

  return uniqueMineablePositions*/
}
// TODO: Don't count mineable positions in rooms with enemies (>2 enemies?)

export const getMineablePositions = (room: Room) => {
  // Select all sources from this room:
  const activeSources = room.find(FIND_SOURCES)
  // Make an array of valid destinations to mine sources
  const mineablePositions: RoomPosition[] = []
  const enemiesPresent: boolean =
    room.find(FIND_HOSTILE_CREEPS).length >= 2 ||
    room.find(FIND_HOSTILE_STRUCTURES).length >= 1
  // Don't run lone scout, but run from 2+ enemies or any enemy structures
  if (enemiesPresent) {
    return mineablePositions // empty array []
  }
  activeSources.forEach((source) => {
    const sourceX = source.pos.x
    const sourceY = source.pos.y
    // Necessary for simulation mode to avoid source keeper mining:
    // Check for source keepers & their lairs nearby
    const creepsLookArray = room.lookForAtArea(
      // lookForAtArea(type, top, left, bottom, right, [asArray])
      LOOK_CREEPS,
      sourceY - 1,
      sourceX - 1,
      sourceY + 1,
      sourceX + 1,
      true
    )

    const actualSourceKeepers = []

    creepsLookArray
      .filter(
        (positionAsJSON) =>
          positionAsJSON.creep.owner.username === "Source Keeper"
      )
      .forEach((creepPositionAsJSON) => {
        // Each item returned by lookForAtArea looks something like:
        // {"type":"terrain","terrain":"plain","x":24,"y":42}
        actualSourceKeepers.push(creepPositionAsJSON)
      })

    const structuresLookArray = room.lookForAtArea(
      // lookForAtArea(type, top, left, bottom, right, [asArray])
      LOOK_STRUCTURES,
      sourceY - 4,
      sourceX - 4,
      sourceY + 4,
      sourceX + 4,
      true
    )

    structuresLookArray
      .filter(
        (positionAsJSON) =>
          positionAsJSON.structure.structureType === STRUCTURE_KEEPER_LAIR
      )
      .forEach((structurePositionAsJSON) => {
        // Each item returned by lookForAtArea looks something like:
        // {"type":"terrain","terrain":"plain","x":24,"y":42}
        actualSourceKeepers.push(structurePositionAsJSON)
      })

    if (actualSourceKeepers.length === 0) {
      // No Source Keepers so we can count this source as valid
      const terrainLookArray = room.lookForAtArea(
        // lookForAtArea(type, top, left, bottom, right, [asArray])
        LOOK_TERRAIN,
        sourceY - 1,
        sourceX - 1,
        sourceY + 1,
        sourceX + 1,
        true
      )
      terrainLookArray
        .filter((positionAsJSON) => positionAsJSON.terrain !== "wall")
        .forEach((mineablePositionAsJSON) => {
          // Each item returned by lookForAtArea looks like:
          // {"type":"terrain","terrain":"plain","x":24,"y":42}
          const { x, y } = mineablePositionAsJSON
          mineablePositions.push(new RoomPosition(x, y, room.name))
        })
    }
  })
  return mineablePositions
}
