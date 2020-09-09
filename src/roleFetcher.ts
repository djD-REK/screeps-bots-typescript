import { actionFillUp } from "actionFillUp"
import { actionDeposit } from "actionDeposit"

export const roleFetcher = {
  run(creep: Creep) {
    if (creep.memory.state === "THINK") {
      creep.say("🚶 FILL UP")
      creep.memory.state = "FILL UP"
    }
    if (creep.memory.state === "FILL UP") {
      // Go harvest active resources
      actionFillUp(creep)
      if (creep.store.getFreeCapacity() < 5) {
        creep.say("🚶 DEPOSIT")
        creep.memory.state = "DEPOSIT"
      }
    }
    if (creep.memory.state === "DEPOSIT") {
      // Go deposit current load
      actionDeposit(creep)
      if (creep.store.getUsedCapacity() === 0) {
        creep.memory.destination = new RoomPosition(0, 0, creep.memory.room)
        creep.say("🚶 FILL UP")
        creep.memory.state = "FILL UP"
      }
    }
  },
}
