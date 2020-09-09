export const actionFillUp = (creep: Creep) => {
  creep.say("🚶 FILL UP")
  const targetFillUpSite = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: (structure) => {
      return (
        structure.structureType === STRUCTURE_CONTAINER &&
        structure.store.getUsedCapacity(RESOURCE_ENERGY) >= 1000
      )
    },
  })

  if (targetFillUpSite) {
    creep.say("🚶 WITHDRAW")
    if (
      creep.withdraw(targetFillUpSite, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
    ) {
      creep.moveTo(targetFillUpSite, {
        visualizePathStyle: { stroke: "#ffaa00" },
      })
    }
  } else {
    const allDroppedResources = creep.room.find(FIND_DROPPED_RESOURCES)
    const sortedDroppedResources = _.sortBy(
      allDroppedResources,
      (resource) =>
        // 0 - resource.amount / creep.pos.findPathTo(resource.pos).length
        0 - resource.amount ** 2 / creep.pos.getRangeTo(resource.pos)
      // zero minus is Ascending sort
    )

    const droppedResourceTarget = sortedDroppedResources[0]

    // Maybe there are some dropped resources we can go grab

    if (droppedResourceTarget != null) {
      creep.say("🔄 PICK UP")
      if (creep.pickup(droppedResourceTarget) === ERR_NOT_IN_RANGE) {
        creep.moveTo(droppedResourceTarget, {
          visualizePathStyle: { stroke: "#ffaa00" },
        })
      }
    }
  }
}
