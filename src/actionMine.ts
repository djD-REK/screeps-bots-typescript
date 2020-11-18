export const actionMine = (creep: Creep) => {
  const destinationRoomName = creep.memory.destination.roomName
  if (
    creep.pos.x === creep.memory.destination.x &&
    creep.pos.y === creep.memory.destination.y &&
    creep.room.name === destinationRoomName
  ) {
    // We're at the destination, so it's harvest time
    const source = creep.pos.findClosestByRange(FIND_SOURCES)
    if (source) {
      const harvestResult = creep.harvest(source)
      switch (harvestResult) {
        // Do nothing cases
        case OK: // The operation has been scheduled successfully.
        case ERR_NOT_ENOUGH_RESOURCES: // The target does not contain any harvestable energy or mineral.
          break
        // Unhandled cases
        case ERR_NOT_IN_RANGE: // The target is too far away.
        case ERR_NOT_OWNER: // You are not the owner of this creep, or the room controller is owned or reserved by another player.
        case ERR_BUSY: // The creep is still being spawned.
        case ERR_NOT_FOUND: // Extractor not found. You must build an extractor structure to harvest minerals.
        case ERR_INVALID_TARGET: // The target is not a valid source or mineral object.
        case ERR_TIRED: // The extractor or the deposit is still cooling down.
        case ERR_NO_BODYPART: // There are no WORK body parts in this creep’s body.
        default:
          console.log(
            `${creep.name} had an unexpected error in harvest routine: ${harvestResult}`
          )
      }
    }
  } else {
    // We need to move to the assigned destination

    if (
      Game.rooms[destinationRoomName] &&
      Game.rooms[destinationRoomName].lookForAt(
        LOOK_CREEPS,
        creep.memory.destination.x,
        creep.memory.destination.y
      ).length > 0
    ) {
      console.log(
        `${creep.name} says there is a creep at ` +
          `${creep.memory.destination.x},${creep.memory.destination.y}`
      )
      // There's a creep where we are trying to go, so let's pick a new destination
      creep.memory.state = "THINK"
    }

    // Now let's actually move (to our destination or the random location)
    const moveResult = creep.moveTo(
      new RoomPosition(
        creep.memory.destination.x,
        creep.memory.destination.y,
        creep.memory.destination.roomName
      ),
      {
        visualizePathStyle: { stroke: "#ffaa00" },
      }
    )
    switch (moveResult) {
      // Do nothing cases
      case OK: // The operation has been scheduled successfully.
      case ERR_TIRED: // The fatigue indicator of the creep is non-zero.
        break // Do nothing
      // Reset state to THINK cases (MINE --> THINK state transition)
      // THINK --> OFF due to novice walls (TODO Fix)
      case ERR_NO_PATH: // No path to the target could be found.
        // (There are probably creeps in the way)
        console.log(
          `${creep.name} said there was no path to take so it turned off`
        )
        creep.memory.state = "OFF"
        break
      // Unhandled cases
      case ERR_NOT_OWNER: // You are not the owner of this creep.
      case ERR_BUSY: // The power creep is not spawned in the world.
      case ERR_INVALID_TARGET: // The target provided is invalid.
      default:
        console.log(
          `${creep.name} had an unexpected error in move routine: ${moveResult}`
        )
    }
  }
}
