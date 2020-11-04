import { getAccessibleAdjacentRoomNames } from "helperFunctions"

const assignDestination = (destinationRoomName: string, creep: Creep) => {
  const currentRoom = creep.room
  creep.say(`🚶${destinationRoomName}`)
  const exitDirection = currentRoom.findExitTo(destinationRoomName)
  switch (exitDirection) {
    case FIND_EXIT_TOP:
      creep.memory.destination = currentRoom.find(FIND_EXIT_TOP)[0]
      break
    case FIND_EXIT_RIGHT:
      creep.memory.destination = currentRoom.find(FIND_EXIT_RIGHT)[0]
      break
    case FIND_EXIT_BOTTOM:
      creep.memory.destination = currentRoom.find(FIND_EXIT_BOTTOM)[0]
      break
    case FIND_EXIT_LEFT:
      creep.memory.destination = currentRoom.find(FIND_EXIT_LEFT)[0]
      break
    default:
      console.log(
        `${creep.name} with ${creep.memory.role} had error: exit direction ${exitDirection}`
      )
      break
  }
}

const chooseDestination = (creep: Creep) => {
  const currentRoom = creep.room
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
    accessibleAdjacentRoomNames
    const randomRoomNameIndex = Math.floor(
      Math.random() * accessibleAdjacentRoomNames.length
    )
    const destinationRoomName = accessibleAdjacentRoomNames[randomRoomNameIndex]
    assignDestination(destinationRoomName, creep)
  }
}

export const roleEye = {
  run(creep: Creep) {
    if (creep.memory.destination) {
      // We have a destination
      const moveResult = creep.moveTo(
        new RoomPosition(
          creep.memory.destination.x,
          creep.memory.destination.y,
          creep.memory.destination.roomName
        ),
        {
          visualizePathStyle: { stroke: "#ffaa00" },
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
    } else {
      chooseDestination(creep)
    }
  },
}
