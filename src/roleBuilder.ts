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
      if (creep.store.getUsedCapacity() / creep.store.getCapacity() > 0.9) {
        creep.say("🚶 BUILD")
        creep.memory.state = "BUILD"
      }
    }
    if (creep.memory.state === "BUILD") {
      if (creep.store.getUsedCapacity() === 0) {
        creep.say("🚶 FILL UP")
        creep.memory.state = "FILL UP"
      } else {
        actionBuild(creep)
      }
    }
  },
}
