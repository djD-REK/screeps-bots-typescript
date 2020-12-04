export const roleTaxi = {
  run(taxi: Creep) {
    // For each taxi: Find all creeps (in all rooms) who need a tow
    const DEBUG = false
    // find closest creep who needs a tow (no MOVE parts)
    const creepsNeedingTow = Array.from(Object.values(Game.creeps)).filter(
      (target: Creep) =>
        target.getActiveBodyparts(MOVE) === 0 &&
        (target.pos.x !== target.memory.destination.x ||
          target.pos.y !== target.memory.destination.y ||
          target.pos.roomName !== target.memory.destination.roomName)
    )
    // Sort those creeps by closest creep to this taxi
    // Sort by closest creep across multiple rooms
    creepsNeedingTow.sort((a, b) => {
      // Calculate the range; for the current room we can use pos.getRangeTo()
      // but for other rooms we need Game.map.getRoomLinearDistance() * 50
      return a.room.name === b.room.name
        ? taxi.pos.getRangeTo(a) - taxi.pos.getRangeTo(b)
        : 50 *
            (Game.map.getRoomLinearDistance(taxi.room.name, a.room.name) -
              Game.map.getRoomLinearDistance(taxi.room.name, b.room.name))
    })

    const rangeBetweenCreepsMultiRoom = (a: Creep, b: Creep) =>
      a.room.name === b.room.name
        ? a.pos.getRangeTo(b)
        : 50 * Game.map.getRoomLinearDistance(a.room.name, b.room.name)

    // For each creep that needs a tow:
    for (const creepNeedingTow of creepsNeedingTow) {
      if (creepNeedingTow.memory.taxiDriver) {
        const otherTaxi = Game.creeps[creepNeedingTow.memory.taxiDriver]
        const rangeFromThisTaxi = rangeBetweenCreepsMultiRoom(
          taxi,
          creepNeedingTow
        )
        const rangeFromThatTaxi = rangeBetweenCreepsMultiRoom(
          otherTaxi,
          creepNeedingTow
        )
        if (rangeFromThisTaxi < rangeFromThatTaxi) {
          // If this taxi is closer than the assigned taxi,
          // then assign this taxi and unassign the other
          creepNeedingTow.memory.taxiDriver = taxi.name
        }
      } else {
        creepNeedingTow.memory.taxiDriver = taxi.name
        // Assign this taxi to that creep if it has no assigned taxi
      }
    }

    const target = taxi.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: function (target: Creep) {
        DEBUG && console.log(`${taxi.name} found ${target.name}`)
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
    if (target && target.memory.taxiDriver === taxi.name) {
      // This taxi is the assigned driver for that creep, let's go tow
      DEBUG && console.log(`${taxi.name} is trying to tow ${target.name}`)
      if (taxi.pull(target) === ERR_NOT_IN_RANGE) {
        taxi.moveTo(target) // pickup ride
        DEBUG &&
          console.log(`creep.moveTo(target) returned ${taxi.moveTo(target)}`)
      } else {
        target.move(taxi) // get towed
        DEBUG && console.log(`target.move(creep) returned ${target.move(taxi)}`)
        if (
          taxi.pos.x === target.memory.destination.x &&
          taxi.pos.y === target.memory.destination.y &&
          taxi.pos.roomName === target.memory.destination.roomName
        ) {
          // switch places because we arrived
          taxi.move(taxi.pos.getDirectionTo(target))
        } else {
          taxi.moveTo(
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
      taxi.moveTo(Game.spawns.Spawn1.pos)
    }
  },
}
