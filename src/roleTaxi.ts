export const roleTaxi = {
  run(creep: Creep) {
    const DEBUG = true
    // find closest creep who needs a tow (no MOVE parts)
    const target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: function (target: Creep) {
        DEBUG && console.log(`${creep.name} found ${target.name}`)
        DEBUG &&
          console.log(
            `${target.getActiveBodyparts(MOVE)} &&
            ((${target.pos.x} !== ${target.memory.destination.x} &&
            ${target.pos.y} !== ${target.memory.destination.y}) ||
            ${target.pos.roomName} !== ${target.memory.destination.roomName})`
          )
        return (
          target.getActiveBodyparts(MOVE) === 0 &&
          (target.pos.x !== target.memory.destination.x ||
            target.pos.y !== target.memory.destination.y ||
            target.pos.roomName !== target.memory.destination.roomName)
        )
      },
    })
    if (target) {
      DEBUG && console.log(`${creep.name} is trying to tow ${target.name}`)
      if (creep.pull(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target) // pickup ride
        DEBUG &&
          console.log(`creep.moveTo(target) returned ${creep.moveTo(target)}`)
      } else {
        target.move(creep) // get towed
        DEBUG &&
          console.log(`target.move(creep) returned ${target.move(creep)}`)
        if (
          creep.pos.x === target.memory.destination.x &&
          creep.pos.y === target.memory.destination.y &&
          creep.pos.roomName === target.memory.destination.roomName
        ) {
          // switch places because we arrived
          creep.move(creep.pos.getDirectionTo(target))
        } else {
          creep.moveTo(
            new RoomPosition(
              target.memory.destination.x,
              target.memory.destination.y,
              target.memory.destination.roomName
            )
          )
        }
      }
    } else {
      // retreat to the home spawn
      creep.moveTo(Game.spawns.Spawn1.pos)
    }
  },
}
