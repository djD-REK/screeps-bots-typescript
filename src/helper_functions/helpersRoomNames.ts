export const getAccessibleAdjacentRoomNames = (currentRoom: Room) => {
  const accessibleAdjacentRoomNames: Array<string> = []
  // Adjacent rooms: +/- 1 in the x, +/- in the y
  // There are 4 possible adjacent rooms
  // Example room name: W23S13
  // Rooms can also be E23N13, and the signs would flip
  const matchedRoomName = currentRoom.name.match(/(\w)(\d+)(\w)(\d+)/)
  if (matchedRoomName) {
    const currentRoomWestOrEast = matchedRoomName[1]
    const currentRoomXCoordinate = Number(matchedRoomName[2])
    const currentRoomNorthOrSouth = matchedRoomName[3]
    const currentRoomYCoordinate = Number(matchedRoomName[4])
    // Room grid logic:
    // if we're in N, north is 1 more & south is 1 less
    // if we're in S, north is 1 less & south is 1 more
    // if we're in E, east is 1 more & west is 1 less
    // if we're in W, west is 1 more & east is 1 less
    // Special cases: W0N0,E0N0,W0S0,E0S0
    // if we're at N0, south is S0
    // if we're at S0, north is N0
    // if we're at E0, west is W0
    // if we're at W0, east is E0
    let adjacentRoomNameNorth = "?",
      adjacentRoomNameEast = "?",
      adjacentRoomNameSouth = "?",
      adjacentRoomNameWest = "?"

    if (currentRoomNorthOrSouth === "N") {
      // if we're in N, north is 1 more & south is 1 less
      adjacentRoomNameNorth = `${currentRoomWestOrEast}${currentRoomXCoordinate}${currentRoomNorthOrSouth}${
        currentRoomYCoordinate + 1
      }`
      if (currentRoomYCoordinate > 0) {
        adjacentRoomNameSouth = `${currentRoomWestOrEast}${currentRoomXCoordinate}${currentRoomNorthOrSouth}${
          currentRoomYCoordinate - 1
        }`
      } else {
        // special case: if we're at N0, south is S0
        adjacentRoomNameSouth = `${currentRoomWestOrEast}${currentRoomXCoordinate}S0`
      }
    }
    if (currentRoomNorthOrSouth === "S") {
      // if we're in S, north is 1 less & south is 1 more
      adjacentRoomNameSouth = `${currentRoomWestOrEast}${currentRoomXCoordinate}${currentRoomNorthOrSouth}${
        currentRoomYCoordinate + 1
      }`
      if (currentRoomYCoordinate > 0) {
        adjacentRoomNameNorth = `${currentRoomWestOrEast}${currentRoomXCoordinate}${currentRoomNorthOrSouth}${
          currentRoomYCoordinate - 1
        }`
      } else {
        // special case: if we're at S0, north is N0
        adjacentRoomNameNorth = `${currentRoomWestOrEast}${currentRoomXCoordinate}N0`
      }
    }

    if (currentRoomWestOrEast === "E") {
      // if we're in E, east is 1 more & west is 1 less
      adjacentRoomNameEast = `${currentRoomWestOrEast}${
        currentRoomXCoordinate + 1
      }${currentRoomNorthOrSouth}${currentRoomYCoordinate}`
      if (currentRoomYCoordinate > 0) {
        adjacentRoomNameWest = `${currentRoomWestOrEast}${
          currentRoomXCoordinate - 1
        }${currentRoomNorthOrSouth}${currentRoomYCoordinate}`
      } else {
        // special case: if we're at E0, west is W0
        adjacentRoomNameWest = `W0${currentRoomNorthOrSouth}${currentRoomYCoordinate}`
      }
    }
    if (currentRoomWestOrEast === "W") {
      // if we're in W, west is 1 more & east is 1 less
      adjacentRoomNameWest = `${currentRoomWestOrEast}${
        currentRoomXCoordinate + 1
      }${currentRoomNorthOrSouth}${currentRoomYCoordinate}`
      if (currentRoomYCoordinate > 0) {
        adjacentRoomNameEast = `${currentRoomWestOrEast}${
          currentRoomXCoordinate - 1
        }${currentRoomNorthOrSouth}${currentRoomYCoordinate}`
      } else {
        // special case: if we're at W0, east is E0
        adjacentRoomNameEast = `E0${currentRoomNorthOrSouth}${currentRoomYCoordinate}`
      }
    }
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
  // TODO -- fix checking for structures at exit tiles because currently not working
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

export const getAccessibleRoomNamesWithoutVision = (currentRoom: Room) => {
  const accessibleAdjacentRoomNames = getAccessibleAdjacentRoomNames(
    currentRoom
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

export const getAccessibleRoomNamesWithVision = (currentRoom: Room) => {
  const DEBUG = false
  const accessibleAdjacentRoomNames = getAccessibleAdjacentRoomNames(
    currentRoom
  )
  DEBUG &&
    console.log(
      `Trying to get accessible adjacent room names for ${currentRoom.name} and found ${accessibleAdjacentRoomNames}`
    )
  const accessibleRoomNamesWithVision: Array<string> = []
  for (const roomName of accessibleAdjacentRoomNames) {
    // Game.rooms is an object of all the rooms I have vision in
    if (Game.rooms[roomName]) {
      // vision if it's not in Game.rooms
      accessibleRoomNamesWithVision.push(roomName)
    }
  }
  return accessibleRoomNamesWithVision
}

// HELPER FUNCTION

export const getRoomNameBasedOnExitCoordinates = (
  x: number,
  y: number,
  currentRoom: Room
) => {
  // Adjacent rooms: +/- 1 in the x, +/- in the y
  // There are 4 possible adjacent rooms
  // Example room name: W23S13
  // Rooms can also be E23N13, and the signs would flip
  const matchedRoomName = currentRoom.name.match(/(\w)(\d+)(\w)(\d+)/)
  if (matchedRoomName) {
    const currentRoomWestOrEast = matchedRoomName[1]
    const currentRoomXCoordinate = Number(matchedRoomName[2])
    const currentRoomNorthOrSouth = matchedRoomName[3]
    const currentRoomYCoordinate = Number(matchedRoomName[4])
    // Room grid logic:
    // if we're in N, north is 1 more & south is 1 less
    // if we're in S, north is 1 less & south is 1 more
    // if we're in E, east is 1 more & west is 1 less
    // if we're in W, west is 1 more & east is 1 less
    // Special cases: W0N0,E0N0,W0S0,E0S0
    // if we're at N0, south is S0
    // if we're at S0, north is N0
    // if we're at E0, west is W0
    // if we're at W0, east is E0
    let adjacentRoomNameNorth = "?",
      adjacentRoomNameEast = "?",
      adjacentRoomNameSouth = "?",
      adjacentRoomNameWest = "?"

    if (currentRoomNorthOrSouth === "N") {
      // if we're in N, north is 1 more & south is 1 less
      adjacentRoomNameNorth = `${currentRoomWestOrEast}${currentRoomXCoordinate}${currentRoomNorthOrSouth}${
        currentRoomYCoordinate + 1
      }`
      if (currentRoomYCoordinate > 0) {
        adjacentRoomNameSouth = `${currentRoomWestOrEast}${currentRoomXCoordinate}${currentRoomNorthOrSouth}${
          currentRoomYCoordinate - 1
        }`
      } else {
        // special case: if we're at N0, south is S0
        adjacentRoomNameSouth = `${currentRoomWestOrEast}${currentRoomXCoordinate}S0`
      }
    }
    if (currentRoomNorthOrSouth === "S") {
      // if we're in S, north is 1 less & south is 1 more
      adjacentRoomNameSouth = `${currentRoomWestOrEast}${currentRoomXCoordinate}${currentRoomNorthOrSouth}${
        currentRoomYCoordinate + 1
      }`
      if (currentRoomYCoordinate > 0) {
        adjacentRoomNameNorth = `${currentRoomWestOrEast}${currentRoomXCoordinate}${currentRoomNorthOrSouth}${
          currentRoomYCoordinate - 1
        }`
      } else {
        // special case: if we're at S0, north is N0
        adjacentRoomNameNorth = `${currentRoomWestOrEast}${currentRoomXCoordinate}N0`
      }
    }

    if (currentRoomWestOrEast === "E") {
      // if we're in E, east is 1 more & west is 1 less
      adjacentRoomNameEast = `${currentRoomWestOrEast}${
        currentRoomXCoordinate + 1
      }${currentRoomNorthOrSouth}${currentRoomYCoordinate}`
      if (currentRoomYCoordinate > 0) {
        adjacentRoomNameWest = `${currentRoomWestOrEast}${
          currentRoomXCoordinate - 1
        }${currentRoomNorthOrSouth}${currentRoomYCoordinate}`
      } else {
        // special case: if we're at E0, west is W0
        adjacentRoomNameWest = `W0${currentRoomNorthOrSouth}${currentRoomYCoordinate}`
      }
    }
    if (currentRoomWestOrEast === "W") {
      // if we're in W, west is 1 more & east is 1 less
      adjacentRoomNameWest = `${currentRoomWestOrEast}${
        currentRoomXCoordinate + 1
      }${currentRoomNorthOrSouth}${currentRoomYCoordinate}`
      if (currentRoomYCoordinate > 0) {
        adjacentRoomNameEast = `${currentRoomWestOrEast}${
          currentRoomXCoordinate - 1
        }${currentRoomNorthOrSouth}${currentRoomYCoordinate}`
      } else {
        // special case: if we're at W0, east is E0
        adjacentRoomNameEast = `E0${currentRoomNorthOrSouth}${currentRoomYCoordinate}`
      }
    }

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
