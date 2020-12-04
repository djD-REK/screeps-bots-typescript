/*
For each taxi:
Find all creeps (in all rooms) who need a tow
Sort those creeps by closest creep to this taxi
For each creep:
Assign this taxi to that creep if it has no assigned taxi
If this taxi is closer than the assigned taxi, assign this taxi

*/

export const roleTaxi = {
  run(creep: Creep) {
    const DEBUG = true
    // find closest creep who needs a tow (no MOVE parts)
    const creepsNeedingTow = Array.from(Object.values(Game.creeps)).filter(
      (target: Creep) =>
        target.getActiveBodyparts(MOVE) === 0 &&
        (target.pos.x !== target.memory.destination.x ||
          target.pos.y !== target.memory.destination.y ||
          target.pos.roomName !== target.memory.destination.roomName)
    )
    // Sort by closest creep across multiple rooms
    creepsNeedingTow.sort((a, b) => {
      // Calculate the range; for the current room we can use pos.getRangeTo()
      // but for other rooms we need Game.map.getRoomLinearDistance() * 50
      return a.room.name === b.room.name
        ? creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b)
        : 50 *
            (Game.map.getRoomLinearDistance(creep.room.name, a.room.name) -
              Game.map.getRoomLinearDistance(creep.room.name, b.room.name))
    })

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
