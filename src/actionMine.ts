const changeSource = (creep: Creep) => {
  const sources = creep.room.find(FIND_SOURCES_ACTIVE)
  // Add one to source assignment (next closest) if possible
  if (creep.memory.sourceNumber < sources.length - 1) {
    creep.memory.sourceNumber += 1
  } else {
    // Randomize current source assignment
    creep.memory.sourceNumber = Math.floor(Math.random() * sources.length)
  }
  creep.say("🔄 harvest")
  console.log(
    `${creep.name} assigned to @sources[${creep.memory.sourceNumber}]`
  )
}

export const actionMine = (creep: Creep) => {
  const sources = creep.room.find(FIND_SOURCES_ACTIVE)
  if (creep.memory.sourceNumber === -1) {
    changeSource(creep)
  }

  // TODO doesn't work
  const source = sources[creep.memory.sourceNumber]
  const path = creep.pos.findPathTo(source)
  if (path) {
    const lastPathStep = path[path.length - 1]
    const foundCreep = creep.room.lookForAt(
      LOOK_CREEPS,
      lastPathStep.x,
      lastPathStep.y
    )
    if (foundCreep.length) {
      // There's a creep there already
      changeSource(creep)
    }
  } else {
    // No path found at all
    changeSource(creep)
  }

  const harvestResult = creep.harvest(source)
  switch (harvestResult) {
    case OK: // The operation has been scheduled successfully.
      // Log destination while harvesting
      creep.memory.destination = creep.pos
      break
    case ERR_NOT_IN_RANGE: // The target is too far away.
      const moveResult = creep.moveTo(source, {
        visualizePathStyle: { stroke: "#ffaa00" },
        reusePath: 5, // Disable path reuse; TODO This uses a lot of CPU
      })
      switch (moveResult) {
        // Do nothing cases
        case OK: // The operation has been scheduled successfully.
        case ERR_TIRED: // The fatigue indicator of the creep is non-zero.
          break // Do nothing
        // Change source case (There are probably creeps in the way)
        case ERR_NO_PATH: // No path to the target could be found.
          changeSource(creep)
          break
        // Unhandled cases
        case ERR_NOT_OWNER: // You are not the owner of this creep.
        case ERR_BUSY: // The power creep is not spawned in the world.
        case ERR_NOT_FOUND: // The creep has no memorized path to reuse.
        case ERR_INVALID_TARGET: // The target provided is invalid.
        default:
          console.log(`Unexpected error in move routine: ${moveResult}`)
      }
      break
    case ERR_NOT_ENOUGH_RESOURCES: // The target does not contain any harvestable energy or mineral.
      changeSource(creep)
      break
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
