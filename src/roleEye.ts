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
    // TODO: Add if there's an enemy in this room I need to go home

    // Stop exploring if I'm the only creep in the room
    if (creep.room.find(FIND_MY_CREEPS).length === 1) {
      creep.memory.state = "OBSERVE"
      // move to the center
      creep.memory.destination.x = 25
      creep.memory.destination.y = 25
    } else {
      if (
        !creep.memory.destination ||
        creep.room.name !== creep.memory.destination.roomName
      ) {
        // We have no destination (initial state) OR
        // We've arrived in another room
        chooseDestination(creep)
      }
      const destinationRoomName = getRoomNameBasedOnExitCoordinates(
        creep.memory.destination.x,
        creep.memory.destination.y,
        new Room(creep.memory.destination.roomName)
      )
      const accessibleRoomNamesWithoutVision = getAccessibleRoomNamesWithoutVision(
        creep.room
      )
      /*
      if (
        Game.rooms[destinationRoomName] &&
        accessibleRoomNamesWithoutVision.length > 0
      ) {*/
      // TODO Fix this logic about rooms with vision
      if (Game.rooms[destinationRoomName]) {
        // Wait a second, we have vision of the destination, so change it,
        // unless we have vision of all the possible destinations right now.
        chooseDestination(creep)
      }
    }
    // By this point, we'll always have a destination assigned.
    moveToDestination(creep)
  },
}
