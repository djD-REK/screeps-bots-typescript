export const getMineablePositionsIncludingSurroundingRooms = (room: Room) => {
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
  const accessibleAdjacentRoomNames = getAccessibleAdjacentRoomNames(
    currentRoom
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
      console.log(
        `Accessible Room Names without Vision:${creep.name} ${accessibleRoomNamesWithoutVision}; selected random index ${randomRoomIndex}`
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

  // TODO: Fix this logic -- currently not checking for creeps already assigned to that destination
  if (creep.memory.role === "Miner") {
    const accessibleRoomNamesWithVision: Array<string> = getAccessibleRoomNamesWithVision(
      creep.room
    )
    if (accessibleRoomNamesWithVision.length > 0) {
      // There are accessible adjacent rooms with vision
      // For each room
      // Assess sources for mining
      // assignDestinationSourceForMining
      // If there are available mining positions, move there
      for (const accessibleRoom of accessibleRoomNamesWithVision) {
        const unoccupiedMineablePositions = assignDestinationSourceForMining(
          creep,
          Game.rooms[accessibleRoom]
        )
        if (unoccupiedMineablePositions > 0) {
          break // We found a destination in an adjacent room already
        }
      }
    } else {
      // All adjacent rooms didn't have anywhere available to mine
      // So just pick one randomly to go to
      const randomRoomIndex = Math.floor(
        Math.random() * accessibleRoomNamesWithVision.length
      )
      console.log(
        "Accessible Room Names with Vision:",
        creep.name,
        ...accessibleRoomNamesWithVision,
        randomRoomIndex
      )
      const destinationRoomName = accessibleRoomNamesWithVision[randomRoomIndex]
      assignDestination(destinationRoomName, creep)
    }
  }

  // TODO Assign fetchers to other rooms
  if (creep.memory.role === "Fetchers") {
    const accessibleRoomNamesWithoutVision: Array<string> = getAccessibleRoomNamesWithoutVision(
      creep.room
    )
    if (accessibleRoomNamesWithoutVision.length > 0) {
      // There are accessible adjacent rooms without vision
      const randomRoomIndex = Math.floor(
        Math.random() * accessibleRoomNamesWithoutVision.length
      )
      console.log(
        "Accessible Room Names without Vision:",
        creep.name,
        ...accessibleRoomNamesWithoutVision,
        randomRoomIndex
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

// TODO: Fix this logic for miners
export const assignDestinationSourceForMining = (
  creep: Creep,
  targetRoom: Room
) => {
  const mineablePositions: RoomPosition[] = getMineablePositionsIncludingSurroundingRooms(
    targetRoom
  )
  // Select an array of creeps with assigned destinations in this room:
  const miners = Object.keys(Game.creeps).filter(
    (creepName) =>
      (Game.creeps[creepName].memory.role === "Harvester" ||
        Game.creeps[creepName].memory.role === "Miner") &&
      Game.creeps[creepName].room === targetRoom &&
      creepName !== creep.name
  )

  console.log("Found miners:" + miners.length)

  const occupiedMineablePositions: RoomPosition[] = []
  miners.forEach((creepName) => {
    // Actually occupied positions
    occupiedMineablePositions.push(Game.creeps[creepName].pos)
    // Designated mining positions (miner may be in transit)
    occupiedMineablePositions.push(
      new RoomPosition(
        Game.creeps[creepName].memory.destination.x,
        Game.creeps[creepName].memory.destination.y,
        targetRoom.name
      )
    )
  })
  console.log(`Mineable: ${mineablePositions.length}`)

  // Use a Map object to filter out all the occupied positions
  const unoccupiedMineableMap = new Map<string, boolean>()
  mineablePositions.forEach((possiblePosition) => {
    unoccupiedMineableMap.set(
      `${possiblePosition.x},${possiblePosition.y}`,
      true
    )
  })
  occupiedMineablePositions.forEach((occupiedPosition) => {
    unoccupiedMineableMap.delete(`${occupiedPosition.x},${occupiedPosition.y}`)
  })
  const unoccupiedMineablePositions: RoomPosition[] = []
  for (const stringPosition of unoccupiedMineableMap.keys()) {
    const regExp = /(?<x>\d+),(?<y>\d+)/
    // Board is a 50x50 grid with coordinates ranging from 0 to 49 i.e. 1-2 digits
    const resultOfRegExp = regExp.exec(stringPosition)

    if (resultOfRegExp) {
      if (resultOfRegExp.groups) {
        const xCoordinate = Number(resultOfRegExp.groups.x) // e.g. 23
        const yCoordinate = Number(resultOfRegExp.groups.y) // e.g. 26
        unoccupiedMineablePositions.push(
          new RoomPosition(xCoordinate, yCoordinate, targetRoom.name)
        )
      }
    } else {
      console.log(`Failed RegExp exec on ${stringPosition}`)
    }
  }

  console.log(`Occupied: ${occupiedMineablePositions.length}`)
  console.log(`Unoccupied: ${unoccupiedMineablePositions.length}`)

  // The array mineablePositions now only includes available positions
  if (unoccupiedMineablePositions.length === 0) {
    // No available mining positions
    // --> Mission: EXPLORE
    // creep.memory.state = "EXPLORE"
    creep.memory.state = "MEANDER"
  } else {
    // Found at least 1 available mining position in the target room
    // --> Mission: MINE
    creep.memory.state = "MINE"
    // Pick a mineable position to mine at randomly
    // TODO: Pick the closest one by path
    const randomMineablePositionIndex = Math.floor(
      Math.random() * unoccupiedMineablePositions.length
    )
    console.log(
      "Mineable positions: " +
        [...unoccupiedMineablePositions] +
        `[${randomMineablePositionIndex}]`
    )
    creep.memory.destination =
      unoccupiedMineablePositions[randomMineablePositionIndex]
    // Assign the creep to its destination
    console.log(
      `${creep.name} assigned mission to MINE from Destination ${creep.memory.destination}`
    )
  }
  return unoccupiedMineablePositions.length
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

// Return [templates, targetCounts] based on
// the controller level in the Spawn's room
// (aka RCL, room controller level)
export const getCreepTemplatesAndTargetCounts = (currentRoom: Room) => {
  // Get the controller level (RCL) for this room
  let controllerLevel: number = 0
  if (currentRoom.controller) {
    controllerLevel = currentRoom.controller?.level
  }

  // Initialize empty creepTemplates with all possible roles
  const creepTemplates: { [role: string]: BodyPartConstant[] } = {
    Harvester: [],
    Miner: [],
    Fetcher: [],
    // Upgraders & Builders are Workers
    Worker: [],
    Defender: [],
    Eye: [],
  }
  const targetCounts: { [role: string]: number } = {
    Harvester: 0,
    Miner: 0,
    Fetcher: 0,
    // Upgraders & Builders are Workers
    Worker: 0,
    Defender: 0,
    Eye: 0,
  }

  // Get some counts relevant to the target creep counts
  const accessibleAdjacentRoomNames = getAccessibleAdjacentRoomNames(
    currentRoom
  )
  const mineablePositions = getMineablePositionsIncludingSurroundingRooms(
    currentRoom
  )

  /* NOTES from https://docs.screeps.com/control.html
  RCL 1 (0 energy): 	Roads, 5 Containers, 1 Spawn
  --> No extensions = 300 capacity total for a creep
  RCL 2 (200 energy): Roads, 5 Containers, 1 Spawn, 5 Extensions (50 capacity), Ramparts (300K max hits), Walls
  --> 5 extensions = 550 capacity total for a creep
  RCL 3 (45,000 energy): Roads, 5 Containers, 1 Spawn, 10 Extensions (50 capacity), Ramparts (1M max hits), Walls, 1 Tower
  --> 10 extensions = 800 capacity total for a creep */

  /* EMPIRE PLANNING
  RCL 1: Build "mini creeps"; upgrade to RCL 2
  RCL 2: Build containers & extensions, then roads; upgrade to RCL 3
  RCL 3: Build extensions, then defense (walls, ramparts, towers, & defenders); upgrade to RCL 4 */

  // TODO: Switch from "controller level logic" to # extensions logic
  // because that directly ties into what creeps can be built

  switch (controllerLevel) {
    // None of the cases break, because it's a flow-through
    // New beginning cases
    case 0:
    // no break
    case 1: // 0 progress required for RCL 1
      // "Mini creeps"
      creepTemplates.Eye = [MOVE] // 50
      targetCounts.Eye = accessibleAdjacentRoomNames.length
      creepTemplates.Miner = [WORK, WORK, MOVE] // 250
      targetCounts.Miner = mineablePositions.length
      creepTemplates.Fetcher = [MOVE, CARRY] // 100
      targetCounts.Fetcher = mineablePositions.length
      creepTemplates.Worker = [WORK, MOVE, CARRY, CARRY] // 250
      targetCounts.Worker = 1
      // TODO: Hold off on road planning checks
      break

    // Default cases:
    case 2: // 200 progress required for RCL 2
    // no break
    default:
      targetCounts.Miner = mineablePositions.length
      creepTemplates.Fetcher = [MOVE, CARRY, CARRY, CARRY, CARRY] // 300
      targetCounts.Fetcher = mineablePositions.length * 2
      targetCounts.Worker = Math.floor(mineablePositions.length / 2)
      /*creepTemplates = {
        Harvester: [WORK, WORK, MOVE, CARRY], // 300 energy
        Miner: [WORK, WORK, MOVE], // 250
        Fetcher: [MOVE, CARRY, CARRY, CARRY, CARRY], // 300
        // Upgraders & Builders are Workers
        Worker: [WORK, WORK, MOVE, CARRY], // 300
        Defender: [MOVE, MOVE, ATTACK, ATTACK], // 260
        Eye: [MOVE],
      }*/
      break
  }

  return [creepTemplates, targetCounts]
}
