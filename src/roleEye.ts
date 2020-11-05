import { getAccessibleAdjacentRoomNames } from "helperFunctions"

// TODO: Write jsDoc documentation for helper functions for my sanity:)
// TODO: Move this to a helper function that gets reused in many creeps
// Because it assigns them a destination in memory that is the closest
// exit tile by path to go to the specified destination room
const assignDestination = (destinationRoomName: string, creep: Creep) => {
  // TODO: Assign destination of the optimum exit tile, not any exit tile
  /* Game.spawns.Spawn1.room.find(FIND_EXIT_TOP).forEach(roomPos => {console.log(`${roomPos.x},${roomPos.y}`)})
  [4:08:59 PM][shard2]9,0
  [4:08:59 PM][shard2]10,0
  [4:08:59 PM][shard2]11,0
  [4:08:59 PM][shard2]12,0
  [4:08:59 PM][shard2]13,0
  [4:08:59 PM][shard2]14,0
  [4:08:59 PM][shard2]15,0
  [4:08:59 PM][shard2]16,0
  // All valid room positions are saved, not the closet one
  // Use this:
  console.log(Game.spawns.Spawn1.pos.findClosestByPath(FIND_EXIT_TOP))
  */
  const currentRoom = creep.room
  creep.memory.destination = new RoomPosition(25, 25, currentRoom.name)
  const exitDirection = currentRoom.findExitTo(destinationRoomName)
  // TODO Check destination tile to see if it's a valid position (not a wall)
  switch (exitDirection) {
    case FIND_EXIT_TOP:
      const destinationTop = currentRoom.find(FIND_EXIT_TOP)[0]
      creep.memory.destination.x = destinationTop.x
      creep.memory.destination.y = destinationTop.y
      break
    case FIND_EXIT_RIGHT:
      const destinationRight = currentRoom.find(FIND_EXIT_RIGHT)[0]
      creep.memory.destination.x = destinationRight.x
      creep.memory.destination.y = destinationRight.y
      break
    case FIND_EXIT_BOTTOM:
      const destinationBottom = currentRoom.find(FIND_EXIT_BOTTOM)[0]
      creep.memory.destination.x = destinationBottom.x
      creep.memory.destination.y = destinationBottom.y
      break
    case FIND_EXIT_LEFT:
      const destinationLeft = currentRoom.find(FIND_EXIT_LEFT)[0]
      creep.memory.destination.x = destinationLeft.x
      creep.memory.destination.y = destinationLeft.y
      break
    default:
      console.log(
        `${creep.name} with ${creep.memory.role} had error: exit direction ${exitDirection}`
      )
      break
  }
  creep.say(`🚶(${creep.memory.destination.x},${creep.memory.destination.y})`)
}

// HELPER FUNCTION
const getAccessibleRoomNamesWithoutVision = (currentRoom: Room) => {
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

const chooseDestination = (creep: Creep) => {
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
    const destinationRoomName = accessibleAdjacentRoomNames[randomRoomNameIndex]
    assignDestination(destinationRoomName, creep)
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

export const roleEye = {
  run(creep: Creep) {
    if (
      !creep.memory.destination ||
      creep.room.name !== creep.memory.destination.roomName
    ) {
      // We have no destination (initial state) OR
      // We've arrived in another room
      // UNLESS we have vision of all the adjacent rooms
      chooseDestination(creep)
      // TODO: Add an if there's an enemy in this room I need to go home
    }
    const accessibleRoomNamesWithoutVision = getAccessibleRoomNamesWithoutVision(
      creep.room
    )
    const destinationRoomName = getRoomNameBasedOnExitCoordinates(
      creep.memory.destination.x,
      creep.memory.destination.y,
      new Room(creep.memory.destination.roomName)
    )
    if (
      Game.rooms[destinationRoomName] &&
      accessibleRoomNamesWithoutVision.length > 0
    ) {
      // Wait a second, we have vision of the destination, so change it,
      // unless we have vision of all the possible destinations right now.
      chooseDestination(creep)
    }

    // By this point, we'll always have a destination assigned.
    // We have a destination in this room, so move to it
    const colorsArray = [
      "red",
      "orange",
      "yellow",
      "green",
      "blue",
      "purple",
      "white",
    ]
    const randomColor =
      colorsArray[Math.floor(Math.random() * colorsArray.length)]
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
  },
}
