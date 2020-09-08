import { actionMine } from "actionMine"

export const roleMiner = {
  run(creep: Creep) {
    if (creep.memory.state === "THINK") {
      creep.say("🚶 MINE")
      creep.memory.state = "MINE"
    }
    if (creep.memory.state === "MINE") {
      // Go harvest active resources
      actionMine(creep)
    }
  },
}
