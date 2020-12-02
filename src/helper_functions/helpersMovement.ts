import { chooseDestination } from "./helpersDestinations"
import { VISUALIZE_PATH_STYLE } from "./RANDOM_COLOR"

export const moveToDestination = (creep: Creep) => {
  const moveResult = creep.moveTo(
    new RoomPosition(
      creep.memory.destination.x,
      creep.memory.destination.y,
      creep.memory.destination.roomName
    ),
    {
      visualizePathStyle: VISUALIZE_PATH_STYLE,
      reusePath: 5,
      // maxRooms: 1,
    }
  )
  switch (moveResult) {
    // Do nothing cases
    case OK: // The operation has been scheduled successfully.
    case ERR_TIRED: // The fatigue indicator of the creep is non-zero.
      break // Do nothing

    // Change source case (There are probably creeps in the way)
    case ERR_NO_PATH: // No path to the target could be found.
      //chooseDestination(creep)
      console.log(
        `${creep.name} had ERR_NO_PATH in move routine so it's switching state from ${creep.memory.state} to THINK`
      )
      creep.memory.state = "THINK"
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
