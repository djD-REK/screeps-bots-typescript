const changeDestination = (creep: Creep) => {
  const x = Math.floor(Math.random() * 49) + 1
  const y = Math.floor(Math.random() * 49) + 1
  creep.memory.destination.x = x
  creep.memory.destination.y = y
  console.log(`${creep.name} assigned new destination: ${x} ${y}`)
}

export const actionPatrol = (creep: Creep) => {
  const terrain = new Room.Terrain(creep.room.name)

  switch (terrain.get(creep.memory.destination.x, creep.memory.destination.y)) {
    // No action cases
    case 0: // plain (valid destination)
      break
    // Change destination cases
    case TERRAIN_MASK_WALL:
    case TERRAIN_MASK_SWAMP:
    default:
      changeDestination(creep)
  }

  if (
    creep.memory.destination.x === creep.pos.x &&
    creep.memory.destination.y === creep.pos.y
  ) {
    console.log(
      `${creep.name} arrived at destination: {creep.pos.x} {creep.pos.y}`
    )
    changeDestination(creep)
  } else {
    // Get to moving
    const moveResult = creep.moveTo(
      creep.memory.destination.x,
      creep.memory.destination.y,
      {
        visualizePathStyle: { stroke: "#ffaa00" },
        reusePath: 5, // Disable path reuse; TODO This uses a lot of CPU
      }
    )
    switch (moveResult) {
      // Do nothing cases
      case OK: // The operation has been scheduled successfully.
      case ERR_TIRED: // The fatigue indicator of the creep is non-zero.
        break // Do nothing
      // Change source case (There are probably creeps in the way)
      case ERR_NO_PATH: // No path to the target could be found.
        changeDestination(creep)
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
