import { actionMine } from "actionMine"
import {
  assignDestinationForMiningIncludingSurroundingRooms,
  chooseDestination,
} from "helperFunctions"

export const roleMiner = {
  run(creep: Creep) {
    if (creep.memory.state === "THINK") {
      creep.say("🚶 MINE")
      creep.memory.state = "MINE"
      const unoccupiedMineablePositionsInThisRoom = assignDestinationForMiningIncludingSurroundingRooms(
        creep,
        creep.room
      )
      // TODO change to: getMineablePositionsInAllRoomsWithVision
      // TODO Should this if statement be here? vvv
      if (unoccupiedMineablePositionsInThisRoom === 0) {
        // Choose a destination in another room
        chooseDestination(creep)
      }
    }
    if (creep.memory.state === "EXPLORE") {
      creep.memory.state = "THINK"
      console.log("Uhhh, we tried to explore but it's a TODO")
    }
    if (creep.memory.state === "MINE") {
      // Go harvest active resources
      actionMine(creep)
    }
    if (creep.memory.state === "MEANDER") {
      // We should not reach this right now
      /*
      // In the mean time, let's change our current destination to get out of the way
      if (creep.room.controller) {
        creep.memory.destination.x = creep.room.controller.pos.x
        creep.memory.destination.y = creep.room.controller.pos.y
      } else {
        // No controller so let's just move randomly for a turn
        creep.memory.destination.x = Math.floor(Math.random() * 48 + 1)
        creep.memory.destination.y = Math.floor(Math.random() * 48 + 1)
      }

      // Now let's actually move (to our destination or the random location)
      const moveResult = creep.moveTo(
        creep.memory.destination.x,
        creep.memory.destination.y,
        {
          visualizePathStyle: { stroke: "#ffaa00" },
        }
      )
      switch (moveResult) {
        // Do nothing cases
        case OK: // The operation has been scheduled successfully.
        case ERR_TIRED: // The fatigue indicator of the creep is non-zero.
          break // Do nothing
        // Unhandled cases
        case ERR_NO_PATH: // No path to the target could be found.
        // (There are probably creeps in the way)
        case ERR_NOT_OWNER: // You are not the owner of this creep.
        case ERR_BUSY: // The power creep is not spawned in the world.
        case ERR_INVALID_TARGET: // The target provided is invalid.
        default:
          console.log(
            `${creep.name} had an unexpected error in move routine: ${moveResult}`
          )
      }
      creep.memory.state = "THINK"*/
    }
  },
}
