import { getAccessibleAdjacentRoomNames } from "helperFunctions"

export const roleEye = {
  run(creep: Creep) {
    const currentRoom = creep.room
    const accessibleAdjacentRoomNames = getAccessibleAdjacentRoomNames(
      Game.spawns.Spawn1.room
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
      const targetRoom = accessibleRoomNamesWithoutVision[0]
      const exitDirection = currentRoom.findExitTo(targetRoom)
      switch (exitDirection) {
        case FIND_EXIT_TOP:
          creep.moveTo(currentRoom.find(FIND_EXIT_TOP)[0])
          break
        case FIND_EXIT_RIGHT:
          creep.moveTo(currentRoom.find(FIND_EXIT_RIGHT)[0])
          break
        case FIND_EXIT_BOTTOM:
          creep.moveTo(currentRoom.find(FIND_EXIT_BOTTOM)[0])
          break
        case FIND_EXIT_LEFT:
          creep.moveTo(currentRoom.find(FIND_EXIT_LEFT)[0])
          break
        default:
          console.log(
            `${creep.name} with ${creep.memory.role} had error: exit direction ${exitDirection}`
          )
          break
      }
    } else {
      // There are not any accessible adjacent rooms without vision
    }
  },
}
