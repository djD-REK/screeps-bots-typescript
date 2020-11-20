import { chooseDestination } from "helper_functions"

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
      reusePath: 5,
      maxRooms: 1,
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
