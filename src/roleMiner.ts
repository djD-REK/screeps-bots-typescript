import { actionMine } from "actionMine"
import { actionDeposit } from "actionDeposit"

export const roleMiner = {
  run(creep: Creep) {
    if (creep.memory.state === "THINK") {
      creep.say("🚶 HARVEST")
      creep.memory.state = "HARVEST"
    }
    if (creep.memory.state === "HARVEST") {
      // Go harvest active resources
      actionMine(creep)
      if (creep.store.getFreeCapacity() === 0) {
        creep.say("🚶 DEPOSIT")
        creep.memory.state = "DEPOSIT"
      }
    }
    if (creep.memory.state === "DEPOSIT") {
      // Go deposit current load
      actionDeposit(creep)
      if (creep.store.getUsedCapacity() === 0) {
        creep.memory.destination = new RoomPosition(0, 0, creep.memory.room)
        creep.say("🚶 HARVEST")
        creep.memory.state = "HARVEST"
        console.log(`${creep.name} assigned to @sources[0] after deposit`)
        creep.memory.sourceNumber = 0 // Reset source to closest in room
      }
    }
  },
}
