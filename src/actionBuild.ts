import { getAccessibleAdjacentRoomNames } from "helperFunctions"

export const actionBuild = (creep: Creep) => {
  // Build a structure (i.e. a road) if we are close to one
  const targetConstructionSite = creep.pos.findClosestByPath(
    FIND_MY_CONSTRUCTION_SITES
  )
  if (targetConstructionSite) {
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
