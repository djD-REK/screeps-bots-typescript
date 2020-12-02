import { lookup } from "dns"

export const actionFillUp = (creep: Creep) => {
  const resourceAtCurrentPosition = creep.room.lookForAt(
    "resource",
    creep.pos.x,
    creep.pos.y
  )[0]
  if (resourceAtCurrentPosition) {
    const pickupResult = creep.pickup(resourceAtCurrentPosition)
    if (pickupResult === ERR_FULL) {
      // ignore this error, happens occasionally for unknown reason
    } else if (pickupResult !== OK) {
      console.log(`Creep ${creep.name} had pickup error ${pickupResult}`)
    }
  }
  // no else, always do the following
  // without else: creeps will pick up at their location & try to move
  {
    // We should compare the amount of all energy sources in the room
    // Specifically: dropped resources and energy stored in containers
    const allEnergySources: (StructureContainer | Resource)[] = []

    // Loop through all the romos that we have vision of
    for (const roomWithVision of Object.values(Game.rooms)) {
      // First we compile a list of all the containers we could withdraw from
      const allContainers = roomWithVision.find(FIND_STRUCTURES, {
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
      const allDroppedResources = roomWithVision.find(FIND_DROPPED_RESOURCES)
      for (const resource of allDroppedResources) {
        if (resource.resourceType === RESOURCE_ENERGY) {
          allEnergySources.push(resource)
        }
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
      // Calculate the range; for the current room we can use pos.getRangeTo()
      // but for other rooms we need Game.map.getRoomLinearDistance() * 50
      const range =
        source.pos.roomName === creep.room.name
          ? creep.pos.getRangeTo(source.pos)
          : 50 *
            Game.map.getRoomLinearDistance(source.pos.roomName, creep.room.name)
      // Sort order is the amount of energy squared divided by the range plus 1
      return 0 - storedEnergy ** 2 / (range + 1)
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
        const pickupResult = creep.pickup(targetFillUpSite)
        if (pickupResult === ERR_NOT_IN_RANGE) {
          creep.moveTo(targetFillUpSite, {
            visualizePathStyle: { stroke: "#ffaa00" },
          })
        } else if (pickupResult !== OK) {
          console.log(`Creep ${creep.name} had pickup error ${pickupResult}`)
        }
      }
    }
  }
}
