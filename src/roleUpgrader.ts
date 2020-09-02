import { actionFillUp } from "actionFillUp"

export const roleUpgrader = {
  run(creep: Creep) {
    if (creep.memory.state === "THINK") {
      creep.say("🚶 THINK")
      creep.memory.state = "FILL UP"
    }
    if (creep.memory.state === "FILL UP") {
      creep.say("🚶 FILL UP")
      // Go harvest active resources
      actionFillUp(creep)
      if (creep.store.getFreeCapacity() === 0) {
        creep.memory.state = "UPGRADE"
      }
    }
    if (creep.memory.state === "UPGRADE") {
      creep.say("🚶 UPGRADE")
      if (creep.room.controller === undefined) {
        // No controller in the current room
        creep.memory.state = "THINK"
      } else {
        if (
          creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE
        ) {
          creep.moveTo(creep.room.controller, {
            visualizePathStyle: { stroke: "#ffffff" },
          })
        }
      }
      if (creep.store.getUsedCapacity() === 0) {
        creep.memory.state = "FILL UP"
      }
    }
  },
}
