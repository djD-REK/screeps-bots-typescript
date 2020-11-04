export const getMineablePositions = (room: Room) => {
  // Select all sources from this room:
  const activeSources = room.find(FIND_SOURCES)
  // Make an array of valid destinations to mine sources
  const mineablePositions: RoomPosition[] = []
  activeSources.forEach((source) => {
    const sourceX = source.pos.x
    const sourceY = source.pos.y
    // Check for source keepers & their lairs
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

export const getAccessibleAdjacentRoomNames = (currentRoom: Room) => {
  const accessibleAdjacentRoomNames: Array<string> = []
  // Adjacent rooms: +/- 1 in the x, +/- in the y
  // There are 4 possible adjacent rooms
  // Example room name: W23S13
  const matchedRoomName = currentRoom.name.match(/(\w)(\d+)(\w)(\d+)/)
  if (matchedRoomName) {
    const currentRoomWestOrEast = matchedRoomName[1]
    const currentRoomXCoordinate = Number(matchedRoomName[2])
    const currentRoomNorthOrSouth = matchedRoomName[3]
    const currentRoomYCoordinate = Number(matchedRoomName[4])

    const adjacentRoomNameNorth = `${currentRoomWestOrEast}${currentRoomXCoordinate}${currentRoomNorthOrSouth}${
      currentRoomYCoordinate + 1
    }`
    const adjacentRoomNameEast = `${currentRoomWestOrEast}${
      currentRoomXCoordinate + 1
    }${currentRoomNorthOrSouth}${currentRoomYCoordinate}`
    const adjacentRoomNameSouth = `${currentRoomWestOrEast}${currentRoomXCoordinate}${currentRoomNorthOrSouth}${
      currentRoomYCoordinate - 1
    }`
    const adjacentRoomNameWest = `${currentRoomWestOrEast}${
      currentRoomXCoordinate - 1
    }${currentRoomNorthOrSouth}${currentRoomYCoordinate}`

    // these rooms are accessible from this room, add them to the list.
    if (currentRoom.findExitTo(adjacentRoomNameNorth) > 0) {
      accessibleAdjacentRoomNames.push(adjacentRoomNameNorth)
    }
    if (currentRoom.findExitTo(adjacentRoomNameEast) > 0) {
      accessibleAdjacentRoomNames.push(adjacentRoomNameEast)
    }
    if (currentRoom.findExitTo(adjacentRoomNameSouth) > 0) {
      accessibleAdjacentRoomNames.push(adjacentRoomNameSouth)
    }
    if (currentRoom.findExitTo(adjacentRoomNameWest) > 0) {
      accessibleAdjacentRoomNames.push(adjacentRoomNameWest)
    }
  }
  return accessibleAdjacentRoomNames
}

export const getRoomObjectsIfVision = (roomNames: Array<string>) => {
  // This function prevents the TypeError: creeps is undefined that occurs
  // when trying to spawn a new Room object in a room without vision
  const roomsWithVision: Array<Room> = []
  // If we have vision in these rooms (not undefined in Game.rooms)
  for (const roomName of roomNames) {
    if (Game.rooms[roomName]) {
      roomsWithVision.push(new Room(roomName))
    }
  }
  return roomsWithVision
}
