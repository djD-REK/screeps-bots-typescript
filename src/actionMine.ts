export const actionMine = (creep: Creep) => {
  if (
    creep.pos.x === creep.memory.destination.x &&
    creep.pos.y === creep.memory.destination.y
  ) {
    // We're at the destination, so it's harvest time
    const source = creep.pos.findClosestByRange(FIND_SOURCES)
    if (source) {
      const harvestResult = creep.harvest(source)
      switch (harvestResult) {
        // Do nothing cases
        case OK: // The operation has been scheduled successfully.
          break
        // Unhandled cases
        case ERR_NOT_IN_RANGE: // The target is too far away.
        case ERR_NOT_ENOUGH_RESOURCES: // The target does not contain any harvestable energy or mineral.
        case ERR_NOT_OWNER: // You are not the owner of this creep, or the room controller is owned or reserved by another player.
        case ERR_BUSY: // The creep is still being spawned.
        case ERR_NOT_FOUND: // Extractor not found. You must build an extractor structure to harvest minerals.
        case ERR_INVALID_TARGET: // The target is not a valid source or mineral object.
        case ERR_TIRED: // The extractor or the deposit is still cooling down.
        case ERR_NO_BODYPART: // There are no WORK body parts in this creep’s body.
        default:
          console.log(`Unexpected error in harvest routine: ${harvestResult}`)
      }
    }
    // Build a container if we can
    if (
      creep.room.lookForAt(LOOK_CONSTRUCTION_SITES, creep.pos).length > 0 ||
      creep.room.lookForAt(LOOK_STRUCTURES, creep.pos).length > 0
    ) {
      // We already have a container at this active mining position
    } else {
      // We need a container, unless we have more than 5 (the max)
      const containers = creep.room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_CONTAINER },
      })
      // TODO: Move containers logic to road building section
      // i.e. build roads before containers
      if (containers.length < 0) {
        // Does not run at the moment
        creep.room.createConstructionSite(
          creep.pos.x,
          creep.pos.y,
          STRUCTURE_CONTAINER
        )
      }
    }
  } else {
    // We need to move to the assigned destination
    if (
      creep.room.lookForAt(
        LOOK_CREEPS,
        creep.memory.destination.x,
        creep.memory.destination.y
      ).length > 0
    ) {
      console.log(
        `${creep.name} says there is a creep at ` +
          `${creep.memory.destination.x},${creep.memory.destination.y}`
      )
      // There's a creep where we are trying to go, so let's pick a new destination
      creep.memory.state = "THINK"
      // In the mean time, let's change our current destination to get out of the way
      if (creep.room.controller) {
        creep.memory.destination.x = creep.room.controller.pos.x
        creep.memory.destination.y = creep.room.controller.pos.y
      } else {
        // No controller so let's just move randomly for a turn
        creep.memory.destination.x = Math.floor(Math.random() * 48 + 1)
        creep.memory.destination.y = Math.floor(Math.random() * 48 + 1)
      }
    }

    // Now let's actually move (to our destination or the random location)
    const moveResult = creep.moveTo(
      creep.memory.destination.x,
      creep.memory.destination.y,
      {
        visualizePathStyle: { stroke: "#ffaa00" },
      }
    )
    switch (moveResult) {
      // Do nothing cases
      case OK: // The operation has been scheduled successfully.
      case ERR_TIRED: // The fatigue indicator of the creep is non-zero.
        break // Do nothing
      // Unhandled cases
      case ERR_NO_PATH: // No path to the target could be found.
      // (There are probably creeps in the way)
      case ERR_NOT_OWNER: // You are not the owner of this creep.
      case ERR_BUSY: // The power creep is not spawned in the world.
      case ERR_INVALID_TARGET: // The target provided is invalid.
      default:
        console.log(
          `${creep.name} had an unexpected error in move routine: ${moveResult}`
        )
    }
  }
}
