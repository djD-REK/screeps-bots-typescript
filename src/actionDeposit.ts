export const actionDeposit = (creep: Creep) => {
  const targetDropOffSite = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    // var targets = creep.room.find(FIND_MY_STRUCTURES, {
    // var targets = Game.spawns["Spawn1"].room.find(FIND_MY_STRUCTURES, {
    filter: (structure) => {
      return (
        structure.structureType === STRUCTURE_EXTENSION ||
        structure.structureType === STRUCTURE_SPAWN ||
        structure.structureType === STRUCTURE_TOWER ||
        structure.structureType === STRUCTURE_STORAGE
        // && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      )
    },
  })
  if (targetDropOffSite != null) {
    // There is somewhere to drop it off in the current room
    if (
      creep.transfer(targetDropOffSite, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      creep.moveTo(targetDropOffSite, {
        visualizePathStyle: { stroke: "#ffffff" },
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