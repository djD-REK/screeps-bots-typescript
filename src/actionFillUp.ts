export const actionFillUp = (creep: Creep) => {
  creep.say("🚶 FILL UP")
  const targetFillUpSite = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    // var targets = creep.room.find(FIND_MY_STRUCTURES, {
    // var targets = Game.spawns["Spawn1"].room.find(FIND_MY_STRUCTURES, {
    filter: (structure) => {
      return (
        structure.structureType === STRUCTURE_SPAWN &&
        structure.store.getUsedCapacity(RESOURCE_ENERGY) >= 50
        /*        (structure.structureType == STRUCTURE_EXTENSION ||
          structure.structureType == STRUCTURE_SPAWN ||
          structure.structureType == STRUCTURE_TOWER ||
          structure.structureType == STRUCTURE_CONTAINER ||
          structure.structureType == STRUCTURE_STORAGE) &&
        structure.store.getUsedCapacity(RESOURCE_ENERGY) >= 50*/
      )
    },
  })

  const allDroppedResources = creep.room.find(FIND_DROPPED_RESOURCES)
  const sortedDroppedResources = _.sortBy(
    allDroppedResources,
    (resource) =>
      // 0 - resource.amount / creep.pos.findPathTo(resource.pos).length
      0 - resource.amount ** 2 / creep.pos.getRangeTo(resource.pos)
    // zero minus is Ascending sort
  )
  for (const resource of sortedDroppedResources) {
    console.log(resource.amount ** 2 / creep.pos.getRangeTo(resource.pos))
  }
  //
  console.log("ddfdfdfdfdf")

  const droppedResourceTarget = sortedDroppedResources[0]

  // Maybe there are some dropped resources we can go grab

  /*
  let droppedResourceTarget = creep.pos.findClosestByPath(
    FIND_DROPPED_RESOURCES,
    {
      filter(resource) {
        return resource.amount >= 300
      },
    }
  )

  if (droppedResourceTarget === null) {
    droppedResourceTarget = creep.pos.findClosestByPath(
      FIND_DROPPED_RESOURCES,
      {
        filter(resource) {
          return resource.amount >= 100
        },
      }
    )
  }

  if (droppedResourceTarget === null) {
    droppedResourceTarget = creep.pos.findClosestByPath(
      FIND_DROPPED_RESOURCES,
      {
        filter(resource) {
          return resource.amount >= 0
        },
      }
    )
  }*/

  if (droppedResourceTarget != null) {
    creep.say("🔄 PICK UP")
    if (creep.pickup(droppedResourceTarget) === ERR_NOT_IN_RANGE) {
      creep.moveTo(droppedResourceTarget, {
        visualizePathStyle: { stroke: "#ffaa00" },
      })
    }
  }
}
