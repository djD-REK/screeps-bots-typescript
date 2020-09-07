import { actionPatrol } from "actionPatrol"

export const roleDefender = {
  run(creep: Creep) {
    const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
    if (target) {
      creep.say("⚔️ attacking")
      if (creep.attack(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target)
      }
    } else {
      actionPatrol(creep)
    }
  },
}
