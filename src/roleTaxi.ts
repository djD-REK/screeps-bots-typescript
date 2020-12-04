export const roleTaxi = {
  run(creep: Creep) {
    // find closest creep who needs a tow (no MOVE parts)
    const target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: function (target: Creep) {
        return (
          target.getActiveBodyparts(MOVE) === 0 &&
          target.memory.destination &&
          target.pos.x !== target.memory.destination.x &&
          target.pos.y !== target.memory.destination.y &&
          target.pos.roomName !== target.memory.destination.roomName
        )
      },
    })
    if (target) {
      if (creep.pull(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target) // pickup ride
      } else {
        target.move(creep) // get towed
        if (
          target.pos.x !== target.memory.destination.x &&
          target.pos.y !== target.memory.destination.y &&
          target.pos.roomName !== target.memory.destination.roomName
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
