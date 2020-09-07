import { actionFillUp } from "actionFillUp"
import { actionBuild } from "actionBuild"

export const roleBuilder = {
  run(creep: Creep) {
    if (creep.memory.state === "THINK") {
      creep.say("🚶 FILL UP")
      creep.memory.state = "FILL UP"
    }
    if (creep.memory.state === "FILL UP") {
      // Go harvest active resources
      actionFillUp(creep)
      if (creep.store.getFreeCapacity() === 0) {
        creep.say("🚶 BUILD")
        creep.memory.state = "BUILD"
      }
    }
    if (creep.memory.state === "BUILD") {
      if (creep.room.controller === undefined) {
        // No controller in the current room
        creep.say("THINK")
        creep.memory.state = "THINK"
      } else {
        actionBuild(creep)
      }
      if (creep.store.getUsedCapacity() === 0) {
        creep.say("🚶 FILL UP")
        creep.memory.state = "FILL UP"
      }
    }
  },
}
