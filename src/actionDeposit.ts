export const actionDeposit = (creep: Creep) => {
  // Find a drop off site and move to it
  const targetDropOffSite = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: (structure) => {
      return (
        (structure.structureType === STRUCTURE_EXTENSION ||
          structure.structureType === STRUCTURE_SPAWN) &&
        structure.energy < structure.energyCapacity
      )
    },
  })
  /* TODO: Add container logic (unowned, thus different)
  if(targetDropOffSite===null) {
    // There is no extension or spawn, but maybe there is a contrainer
    targetDropOffSite = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return (
          (structure.structureType === STRUCTURE_CONTAINER &&
            _.sum(structure.store) < structure.storeCapacity)
        )
      },
    })
  }*/
  if (targetDropOffSite != null) {
    // There is somewhere to drop it off in the current room
    if (
      creep.transfer(targetDropOffSite, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      const moveResult = creep.moveTo(targetDropOffSite, {
        visualizePathStyle: { stroke: "#ffffff" },
        ignoreCreeps: false, // don't ignore creeps when depositing
        reusePath: 5, // reuse path for 5 turns
      })
    }
  } else {
    // There is nowhere to drop it off in the current room
    // Move to within 5 tiles of the spawn. Then we drop it if everything is full
    creep.moveTo(Game.spawns.Spawn1.pos, {
      visualizePathStyle: { stroke: "#ffffff" },
    })
    if (
      creep.room === Game.spawns.Spawn1.room &&
      creep.pos.getRangeTo(Game.spawns.Spawn1.pos) < 3
    ) {
      console.log("Drop it! There are 0 available targets in the home room.")
      creep.say("DROP IT!")
      // There's an issue, so let's drop our resources and mosey on
      creep.drop(RESOURCE_ENERGY)
    }
  }
}
