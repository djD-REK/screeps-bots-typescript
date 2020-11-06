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

    // If these rooms are accessible from this room, add them to the list.
    // But we need to check to see if there's a constructed wall at the exit,
    // because that means we're in a newbie area, and we can't use that exit.

    if (currentRoom.findExitTo(adjacentRoomNameNorth) > 0) {
      const exitPosition = currentRoom.find(FIND_EXIT_TOP)[0]
      if (
        exitPosition &&
        currentRoom.lookForAt("structure", exitPosition.x, exitPosition.y)
          .length === 0
      ) {
        accessibleAdjacentRoomNames.push(adjacentRoomNameNorth)
      }
    }
    if (currentRoom.findExitTo(adjacentRoomNameEast) > 0) {
      const exitPosition = currentRoom.find(FIND_EXIT_RIGHT)[0]
      if (
        exitPosition &&
        currentRoom.lookForAt("structure", exitPosition.x, exitPosition.y)
          .length === 0
      ) {
        accessibleAdjacentRoomNames.push(adjacentRoomNameEast)
      }
    }
    if (currentRoom.findExitTo(adjacentRoomNameSouth) > 0) {
      const exitPosition = currentRoom.find(FIND_EXIT_BOTTOM)[0]
      if (
        exitPosition &&
        currentRoom.lookForAt("structure", exitPosition.x, exitPosition.y)
          .length === 0
      ) {
        accessibleAdjacentRoomNames.push(adjacentRoomNameSouth)
      }
    }
    if (currentRoom.findExitTo(adjacentRoomNameWest) > 0) {
      const exitPosition = currentRoom.find(FIND_EXIT_LEFT)[0]
      if (
        exitPosition &&
        currentRoom.lookForAt("structure", exitPosition.x, exitPosition.y)
          .length === 0
      ) {
        accessibleAdjacentRoomNames.push(adjacentRoomNameWest)
      }
    }
  }
  // WIP TODO -- fix checking for structures at exit tiles because currently not working
  return accessibleAdjacentRoomNames
}

export const getRoomsFromRoomNamesIfVision = (roomNames: Array<string>) => {
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

// TODO: Write jsDoc documentation for helper functions for my sanity:)
// TODO: Move this to a helper function that gets reused in many creeps
// Because it assigns them a destination in memory that is the closest
// exit tile by path to go to the specified destination room
export const assignDestination = (
  destinationRoomName: string,
  creep: Creep
) => {
  const currentRoom = creep.room
  creep.memory.destination = new RoomPosition(25, 25, currentRoom.name)
  const exitDirection = currentRoom.findExitTo(destinationRoomName)
  // TODO Check destination tile to see if it's a valid position (not a wall)
  const exitPosition =
    (exitDirection === FIND_EXIT_TOP ||
      exitDirection === FIND_EXIT_RIGHT ||
      exitDirection === FIND_EXIT_BOTTOM ||
      exitDirection === FIND_EXIT_LEFT) &&
    creep.pos.findClosestByPath(exitDirection)
  if (exitPosition) {
    creep.memory.destination.x = exitPosition.x
    creep.memory.destination.y = exitPosition.y
  } else {
    console.log(
      `${creep.name} with role ${creep.memory.role} could not find the exit direction ${exitDirection}`
    )
  }
  creep.say(`🚶(${creep.memory.destination.x},${creep.memory.destination.y})`)
}

// HELPER FUNCTION
export const getAccessibleRoomNamesWithoutVision = (currentRoom: Room) => {
  const accessibleAdjacentRoomNames = getAccessibleAdjacentRoomNames(
    currentRoom
    // Game.spawns.Spawn1.room
  )
  const accessibleRoomNamesWithoutVision: Array<string> = []
  for (const roomName of accessibleAdjacentRoomNames) {
    // Game.rooms is an object of all the rooms I have vision in
    if (!Game.rooms[roomName]) {
      // no vision if it's not in Game.rooms
      accessibleRoomNamesWithoutVision.push(roomName)
    }
  }
  return accessibleRoomNamesWithoutVision
}

// Choose an appropriate destination in this room based on creep's role
export const chooseDestination = (creep: Creep) => {
  if (creep.memory.role === "Eye") {
    const accessibleRoomNamesWithoutVision: Array<string> = getAccessibleRoomNamesWithoutVision(
      creep.room
    )
    if (accessibleRoomNamesWithoutVision.length > 0) {
      // There are accessible adjacent rooms without vision
      const randomRoomIndex = Math.floor(
        Math.random() * accessibleRoomNamesWithoutVision.length
      )
      const destinationRoomName =
        accessibleRoomNamesWithoutVision[randomRoomIndex]
      assignDestination(destinationRoomName, creep)
    } else {
      // There are not any accessible adjacent rooms without vision
      // In other words, I have vision of all adjacent accessible rooms
      const accessibleAdjacentRoomNames = getAccessibleAdjacentRoomNames(
        creep.room
      )
      const randomRoomNameIndex = Math.floor(
        Math.random() * accessibleAdjacentRoomNames.length
      )
      const destinationRoomName =
        accessibleAdjacentRoomNames[randomRoomNameIndex]
      assignDestination(destinationRoomName, creep)
    }
  }
}

// HELPER FUNCTION
export const getRoomNameBasedOnExitCoordinates = (
  x: number,
  y: number,
  currentRoom: Room
) => {
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

    if (y === 0) {
      // North exit
      return adjacentRoomNameNorth
    }
    if (x === 49) {
      // East exit
      return adjacentRoomNameEast
    }
    if (y === 49) {
      // South exit
      return adjacentRoomNameSouth
    }
    if (x === 0) {
      // West exit
      return adjacentRoomNameWest
    }
  }
  return currentRoom.name // Should never reach this line ^__^
}

export const moveToDestination = (creep: Creep) => {
  // We have a destination in this room, so move to it
  const COLORS_ARRAY = [
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "white",
  ]
  const randomColor =
    COLORS_ARRAY[Math.floor(Math.random() * COLORS_ARRAY.length)]
  const moveResult = creep.moveTo(
    creep.memory.destination.x,
    creep.memory.destination.y,
    {
      visualizePathStyle: { stroke: randomColor },
      reusePath: 5, // Disable path reuse; TODO This uses a lot of CPU
    }
  )
  switch (moveResult) {
    // Do nothing cases
    case OK: // The operation has been scheduled successfully.
    case ERR_TIRED: // The fatigue indicator of the creep is non-zero.
      break // Do nothing
    // Change source case (There are probably creeps in the way)
    case ERR_NO_PATH: // No path to the target could be found.
      chooseDestination(creep)
      break
    // Unhandled cases
    case ERR_NOT_OWNER: // You are not the owner of this creep.
    case ERR_BUSY: // The power creep is not spawned in the world.
    case ERR_INVALID_TARGET: // The target provided is invalid.
    default:
      console.log(
        `${creep.name} had an unexpected error in move routine: ${moveResult}`
      )
  }
}
