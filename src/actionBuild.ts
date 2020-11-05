import {
  getAccessibleAdjacentRoomNames,
  getRoomsFromRoomNamesIfVision,
} from "helperFunctions"

export const actionBuild = (creep: Creep) => {
  // Build a structure (i.e. a road) if we are close to one
  const targetConstructionSite = creep.pos.findClosestByPath(
    FIND_MY_CONSTRUCTION_SITES
  )
  if (!targetConstructionSite) {
    const accessibleAdjacentRooms = getRoomsFromRoomNamesIfVision(
      getAccessibleAdjacentRoomNames(Game.spawns.Spawn1.room)
    )
    // Pick a construction site in a surrounding room with vision
    // Save the destination to memory
    // TODO: New state for "transitioning" or "patrolling" to a
    // different room; then pick the closest site when arrived.
    for (const accessibleAdjacentRoom of accessibleAdjacentRooms) {
      const sites = Game.rooms[accessibleAdjacentRoom.name].find(
        FIND_CONSTRUCTION_SITES
      )
      if (sites.length) {
        creep.memory.destination = new RoomPosition(0, 0, creep.room.name)
        // destination would be the exit
        // if the current room name doesn't match, we've transited to the destination
        // at that point, change state to find a construction site
        // if there are no sites anywhere, set destination for home spawn
      }
    }
  }
  if (targetConstructionSite) {
    // There is a construction site in the creep's current room
    const buildResult = creep.build(targetConstructionSite)
    switch (buildResult) {
      // Move to the nearest one
      case ERR_NOT_IN_RANGE: // The target is too far away.
        creep.moveTo(targetConstructionSite, {
          visualizePathStyle: { stroke: "#ffffff" },
        })
        break

      // Do nothing cases
      case OK: // The operation has been scheduled successfully.
        break

      // Unhandled cases
      case ERR_NOT_OWNER: // You are not the owner of this creep.
      case ERR_BUSY: // The creep is still being spawned.
      case ERR_NOT_ENOUGH_RESOURCES: // The creep does not have any carried energy.
      case ERR_INVALID_TARGET: // The target is not a valid construction site object or the structure cannot be built here (probably because of a creep at the same square).
      case ERR_NO_BODYPART: // There are no WORK body parts in this creep’s body.
      default:
        console.log(
          `Unexpected error in build routine: ${buildResult} by ${creep.name}`
        )
    }
  }
}
