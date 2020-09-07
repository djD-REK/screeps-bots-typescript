export const actionDeposit = (creep: Creep) => {
  // Build a structure (i.e. a road) if we are close to one
  const targetConstructionSite = creep.pos.findClosestByRange(
    FIND_MY_CONSTRUCTION_SITES
  )
  if (targetConstructionSite) {
    const buildResult = creep.build(targetConstructionSite)
    switch (buildResult) {
      // Do nothing cases
      case OK: // The operation has been scheduled successfully.
      case ERR_NOT_IN_RANGE: // The target is too far away.
        break

      // Unhandled cases
      case ERR_NOT_OWNER: // You are not the owner of this creep.
      case ERR_BUSY: // The creep is still being spawned.
      case ERR_NOT_ENOUGH_RESOURCES: // The creep does not have any carried energy.
      case ERR_INVALID_TARGET: // The target is not a valid construction site object or the structure cannot be built here (probably because of a creep at the same square).
      case ERR_NO_BODYPART: // There are no WORK body parts in this creep’s body.
      default:
        console.log(
          "console.log(`Unexpected error in build routine: ${buildResult}`)"
        )
    }
  }

  // Find a drop off site and move to it
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
