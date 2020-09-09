import { resourceUsage } from "process"

export const actionFillUp = (creep: Creep) => {
  // We should compare the amount of all energy sources in the room
  // Specifically: dropped resources and energy stored in containers
  const allEnergySources: (StructureContainer | Resource)[] = []

  // First we compile a list of all the containers we could withdraw from
  const allContainers = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return structure.structureType === STRUCTURE_CONTAINER
    },
  })
  for (const container of allContainers) {
    if (container.structureType === STRUCTURE_CONTAINER) {
      allEnergySources.push(container)
    }
  }

  // Maybe there are some dropped resources we can go grab
  const allDroppedResources = creep.room.find(FIND_DROPPED_RESOURCES)
  for (const resource of allDroppedResources) {
    if (resource.resourceType === RESOURCE_ENERGY) {
      allEnergySources.push(resource)
    }
  }

  // Sort the available energy sources
  const sortedEnergySources = _.sortBy(allEnergySources, (source) => {
    let storedEnergy: number = 0
    if ("store" in source) {
      // Stored energy resource in a container in this room
      storedEnergy = source.store.energy
    }
    if ("amount" in source) {
      // Dropped energy resource in this room
      storedEnergy = source.amount * 2
      // Dropped resources are more important than stored resources because
      // they decay, so they get a times 2 multiplier in calculations
    }
    // Sort order is the amount of energy squared divided by the range plus 1
    return 0 - storedEnergy ** 2 / (creep.pos.getRangeTo(source.pos) + 1)
    // Zero minus is descending sort
  })

  const targetFillUpSite = sortedEnergySources[0]

  if (targetFillUpSite) {
    if ("store" in targetFillUpSite) {
      // Stored energy resource in a container in this room
      if (
        creep.withdraw(targetFillUpSite, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE
      ) {
        creep.moveTo(targetFillUpSite, {
          visualizePathStyle: { stroke: "#ffaa00" },
        })
      }
    }
    if ("amount" in targetFillUpSite) {
      // Dropped energy resource in this room
      if (creep.pickup(targetFillUpSite) === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetFillUpSite, {
          visualizePathStyle: { stroke: "#ffaa00" },
        })
      }
    }
  }
}
