import {
  getMineablePositionsIncludingSurroundingRooms,
  getAccessibleAdjacentRoomNames,
} from "helper_functions"

// Return [templates, targetCounts] based on
// the controller level in the Spawn's room
// (aka RCL, room controller level)
export const getCreepTemplatesAndTargetCounts = (currentRoom: Room) => {
  // Get the controller level (RCL) for this room
  let controllerLevel: number = 0
  if (currentRoom.controller) {
    controllerLevel = currentRoom.controller?.level
  }

  // Initialize empty creepTemplates with all possible roles
  const creepTemplates: { [role: string]: BodyPartConstant[] } = {
    Harvester: [],
    Miner: [],
    Fetcher: [],
    // Upgraders & Builders are Workers
    Worker: [],
    Defender: [],
    Eye: [],
  }
  const targetCounts: { [role: string]: number } = {
    Harvester: 0,
    Miner: 0,
    Fetcher: 0,
    // Upgraders & Builders are Workers
    Worker: 0,
    Defender: 0,
    Eye: 0,
  }

  // Get some counts relevant to the target creep counts
  const accessibleAdjacentRoomNames = getAccessibleAdjacentRoomNames(
    currentRoom
  )
  const mineablePositions = getMineablePositionsIncludingSurroundingRooms(
    currentRoom
  )

  /* NOTES from https://docs.screeps.com/control.html
  RCL 1 (0 energy): 	Roads, 5 Containers, 1 Spawn
  --> No extensions = 300 capacity total for a creep
  RCL 2 (200 energy): Roads, 5 Containers, 1 Spawn, 5 Extensions (50 capacity), Ramparts (300K max hits), Walls
  --> 5 extensions = 550 capacity total for a creep
  RCL 3 (45,000 energy): Roads, 5 Containers, 1 Spawn, 10 Extensions (50 capacity), Ramparts (1M max hits), Walls, 1 Tower
  --> 10 extensions = 800 capacity total for a creep */
  /* EMPIRE PLANNING
  RCL 1: Build "mini creeps"; upgrade to RCL 2
  RCL 2: Build containers & extensions, then roads; upgrade to RCL 3
  RCL 3: Build extensions, then defense (walls, ramparts, towers, & defenders); upgrade to RCL 4 */
  // TODO: Switch from "controller level logic" to # extensions logic
  // because that directly ties into what creeps can be built
  switch (controllerLevel) {
    // None of the cases break, because it's a flow-through
    // New beginning cases
    case 0:
    // no break
    case 1: // 0 progress required for RCL 1
      // "Mini creeps"
      creepTemplates.Eye = [MOVE] // 50
      targetCounts.Eye = accessibleAdjacentRoomNames.length
      creepTemplates.Miner = [WORK, WORK, MOVE] // 250
      targetCounts.Miner = mineablePositions.length
      creepTemplates.Fetcher = [MOVE, CARRY] // 100
      targetCounts.Fetcher = mineablePositions.length
      creepTemplates.Worker = [WORK, MOVE, CARRY, CARRY] // 250
      targetCounts.Worker = 1
      // TODO: Hold off on road planning checks
      break

    // Default cases:
    case 2: // 200 progress required for RCL 2

    // no break
    default:
      targetCounts.Miner = mineablePositions.length
      creepTemplates.Fetcher = [MOVE, CARRY, CARRY, CARRY, CARRY] // 300
      targetCounts.Fetcher = mineablePositions.length * 2
      targetCounts.Worker = Math.floor(mineablePositions.length / 2)
      /*creepTemplates = {
        Harvester: [WORK, WORK, MOVE, CARRY], // 300 energy
        Miner: [WORK, WORK, MOVE], // 250
        Fetcher: [MOVE, CARRY, CARRY, CARRY, CARRY], // 300
        // Upgraders & Builders are Workers
        Worker: [WORK, WORK, MOVE, CARRY], // 300
        Defender: [MOVE, MOVE, ATTACK, ATTACK], // 260
        Eye: [MOVE],
      }*/
      break
  }

  return [creepTemplates, targetCounts]
}
