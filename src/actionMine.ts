const assessSources = (creep: Creep) => {
  // Select all sources with available energy from this room:
  const activeSources = creep.room.find(FIND_SOURCES_ACTIVE)
  // Make an array of valid destinations to mine sources
  const mineablePositions: RoomPosition[] = []
  activeSources.forEach((source) => {
    const sourceX = source.pos.x
    const sourceY = source.pos.y
    // lookForAtArea(type, top, left, bottom, right, [asArray])
    const lookArray = creep.room.lookForAtArea(
      LOOK_TERRAIN,
      sourceY - 1,
      sourceX - 1,
      sourceY + 1,
      sourceX + 1,
      true
    )
    lookArray
      .filter((positionAsJSON) => positionAsJSON.terrain !== "wall")
      .forEach((mineablePositionAsJSON) => {
        // Each item returned by lookForAtArea looks like:
        // {"type":"terrain","terrain":"plain","x":24,"y":42}
        const { x, y } = mineablePositionAsJSON
        mineablePositions.push(new RoomPosition(x, y, creep.room.name))
      })
  })

  // Select an array of creeps with assigned destinations in this room:
  const miners = Object.keys(Game.creeps).filter(
    (creepName) =>
      Game.creeps[creepName].memory.role === "miner" &&
      Game.creeps[creepName].room === creep.room &&
      creepName !== creep.name
  )

  const occupiedMineablePositions: RoomPosition[] = []
  miners.forEach((creepName) => {
    occupiedMineablePositions.push(Game.creeps.creepName.pos)
  })

  const unoccupiedMineablePositions: RoomPosition[] = mineablePositions.filter(
    (position) => !occupiedMineablePositions.includes(position)
  )

  // The array mineablePositions now only includes available positions
  if (unoccupiedMineablePositions.length === 0) {
    // No available mining positions
    // --> Mission: EXPLORE
    creep.memory.state = "EXPLORE"
  } else {
    // Found at least 1 available mining position
    // --> Mission: MINE
    creep.memory.state = "MINE"
    console.log("Mineable positions: " + [...unoccupiedMineablePositions])
    creep.memory.destination = unoccupiedMineablePositions[0]
    // Assign the creep to its destination
    console.log(
      `${creep.name} assigned mission to MINE from Destination ${creep.memory.destination}`
    )
  }
}

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
  } else {
    // We need to move to the assigned destination
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
        console.log(`Unexpected error in move routine: ${moveResult}`)
    }
  }
}
