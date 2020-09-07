export const actionPatrol = (creep: Creep) => {
  const terrain = new Room.Terrain(creep.room.name)

  switch (terrain.get(creep.memory.destination.x, creep.memory.destination.y)) {
    case TERRAIN_MASK_WALL:
      break
    case TERRAIN_MASK_SWAMP:
      break
    case 0: // plain
      creep.memory.destination.x = Math.random() * 49
      creep.memory.destination.y = Math.random() * 49
      break
  }

  if (
    creep.memory.destination.x === creep.pos.x &&
    creep.memory.destination.y === creep.pos.y
  ) {
    console.log(
      `${creep.name} arrived at destination: {creep.pos.x} {creep.pos.y}`
    )
  } else {
    // Get to moving
    creep.moveTo(creep.memory.destination, {
      visualizePathStyle: { stroke: "#ffaa00" },
    })
  }
}
