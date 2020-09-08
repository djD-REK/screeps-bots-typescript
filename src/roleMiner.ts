import { actionMine } from "actionMine"
import { getMineablePositions } from "getMineablePositions"

const assessSources = (creep: Creep) => {
  const mineablePositions: RoomPosition[] = getMineablePositions(creep.room)
  // Select an array of creeps with assigned destinations in this room:
  const miners = Object.keys(Game.creeps).filter(
    (creepName) =>
      (Game.creeps[creepName].memory.role === "harvester" ||
        Game.creeps[creepName].memory.role === "miner") &&
      Game.creeps[creepName].room === creep.room &&
      creepName !== creep.name
  )

  console.log("Found miners:" + miners.length)

  const occupiedMineablePositions: RoomPosition[] = []
  miners.forEach((creepName) => {
    // Actually occupied positions
    occupiedMineablePositions.push(Game.creeps[creepName].pos)
    // Designated mining positions (miner may be in transit)
    occupiedMineablePositions.push(
      new RoomPosition(
        Game.creeps[creepName].memory.destination.x,
        Game.creeps[creepName].memory.destination.y,
        creep.room.name
      )
    )
  })
  console.log(`Mineable: ${mineablePositions.length}`)

  // Use a Map object to filter out all the occupied positions
  const unoccupiedMineableMap = new Map<string, boolean>()
  mineablePositions.forEach((possiblePosition) => {
    unoccupiedMineableMap.set(
      `${possiblePosition.x},${possiblePosition.y}`,
      true
    )
  })
  occupiedMineablePositions.forEach((occupiedPosition) => {
    unoccupiedMineableMap.delete(`${occupiedPosition.x},${occupiedPosition.y}`)
  })
  const unoccupiedMineablePositions: RoomPosition[] = []
  for (const stringPosition of unoccupiedMineableMap.keys()) {
    const regExp = /(?<x>\d+),(?<y>\d+)/
    // Board is a 50x50 grid with coordinates ranging from 0 to 49 i.e. 1-2 digits
    const resultOfRegExp = regExp.exec(stringPosition)

    if (resultOfRegExp) {
      if (resultOfRegExp.groups) {
        const xCoordinate = Number(resultOfRegExp.groups.x) // e.g. 23
        const yCoordinate = Number(resultOfRegExp.groups.y) // e.g. 26
        unoccupiedMineablePositions.push(
          new RoomPosition(xCoordinate, yCoordinate, creep.room.name)
        )
      }
    } else {
      console.log(`Failed RegExp exec on ${stringPosition}`)
    }
  }

  console.log(`Occupied: ${occupiedMineablePositions.length}`)
  console.log(`Unoccupied: ${unoccupiedMineablePositions.length}`)

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

export const roleMiner = {
  run(creep: Creep) {
    if (creep.memory.state === "THINK") {
      creep.say("🚶 MINE")
      creep.memory.state = "MINE"
      assessSources(creep)
    }
    if (creep.memory.state === "EXPLORE") {
      creep.memory.state = "THINK"
      console.log("Uhhh, we tried to explore but it's a TODO")
    }
    if (creep.memory.state === "MINE") {
      // Go harvest active resources
      actionMine(creep)
    }
  },
}
