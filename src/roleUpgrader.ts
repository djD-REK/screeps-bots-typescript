import { actionFillUp } from "actionFillUp"

export const roleUpgrader = {
  run(creep: Creep) {
    if (creep.memory.state === "THINK") {
      creep.say("🚶 FILL UP")
      creep.memory.state = "FILL UP"
    }
    if (creep.memory.state === "FILL UP") {
      // Go harvest active resources
      actionFillUp(creep)
      if (creep.store.getUsedCapacity() / creep.store.getCapacity() > 0.9) {
        creep.say("🚶 UPGRADE")
        creep.memory.state = "UPGRADE"
      }
    }
    if (creep.memory.state === "UPGRADE") {
      const targetController = creep.room.controller
        ? creep.room.controller
        : Game.spawns.Spawn1.room.controller
      if (targetController) {
        if (creep.store.getUsedCapacity() === 0) {
          creep.say("🚶 FILL UP")
          creep.memory.state = "FILL UP"
        } else {
          if (creep.upgradeController(targetController) === ERR_NOT_IN_RANGE) {
            creep.moveTo(targetController, {
              visualizePathStyle: { stroke: "#ffffff" },
            })
          }
        }
      } else {
        // No controller in the current room
        creep.say("THINK")
        creep.memory.state = "THINK"
        console.log(`${creep.name} with role ${creep.memory.role} had to THINK`)
      }
    }
  },
}
