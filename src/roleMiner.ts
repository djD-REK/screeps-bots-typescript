import { actionMine } from "actionMine"
import { getMineablePositions } from "getMineablePositions"

const assessSources = (creep: Creep) => {
  const mineablePositions: RoomPosition[] = getMineablePositions(creep.room)
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

export const roleMiner = {
  run(creep: Creep) {
    if (creep.memory.state === "THINK") {
      creep.say("🚶 MINE")
      creep.memory.state = "MINE"
      assessSources(creep)
    }
    if (creep.memory.state === "MINE") {
      // Go harvest active resources
      actionMine(creep)
    }
  },
}
