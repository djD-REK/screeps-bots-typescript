const changeSource = (creep: Creep) => {
  const sources = creep.room.find(FIND_SOURCES_ACTIVE)
  // Randomize current source assignment
  creep.memory.sourceNumber = Math.floor(Math.random() * sources.length)
  creep.say("🔄 harvest")
  console.log(
    `${creep.name} assigned to @sources[${creep.memory.sourceNumber}]`
  )
}

export const actionHarvest = (creep: Creep) => {
  const sources = creep.room.find(FIND_SOURCES_ACTIVE)
  if (creep.memory.sourceNumber === -1) {
    changeSource(creep)
  }

  const harvestResult = creep.harvest(sources[creep.memory.sourceNumber])
  switch (harvestResult) {
    case OK: // The operation has been scheduled successfully.
      // Log destination while harvesting
      creep.memory.destination = creep.pos
      break
    case ERR_NOT_IN_RANGE: // The target is too far away.
      creep.moveTo(sources[creep.memory.sourceNumber], {
        visualizePathStyle: { stroke: "#ffaa00" },
      })
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
