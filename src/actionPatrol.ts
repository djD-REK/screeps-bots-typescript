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
    case 0: // plain (valid destination)
      break
    case TERRAIN_MASK_WALL:
    // intentionally don't break
    case TERRAIN_MASK_SWAMP:
    // intentionally don't break
    default:
      changeDestination(creep)
      break
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
    creep.moveTo(creep.memory.destination, {
      visualizePathStyle: { stroke: "#ffaa00" },
    })
  }
}
