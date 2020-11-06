import {
  getAccessibleAdjacentRoomNames,
  assignDestination,
  getAccessibleRoomNamesWithoutVision,
  getRoomNameBasedOnExitCoordinates,
  chooseDestination,
  moveToDestination,
} from "helperFunctions"

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
    moveToDestination(creep)
  },
}
