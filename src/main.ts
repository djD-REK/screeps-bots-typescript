import { ErrorMapper } from "utils/ErrorMapper"
import { roleHarvester } from "roleHarvester"
import { roleUpgrader } from "roleUpgrader"
import { roleDefender } from "roleDefender"

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`)

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name]
      console.log("Clearing non-existing creep memory:", name)
    }
  }

  // Find the active sources in this room
  // const sources = Game.spawns.Spawn1.room.find(FIND_SOURCES_ACTIVE)
  // Find all potential sources in this room
  const sources = Game.spawns.Spawn1.room.find(FIND_SOURCES)

  // Plan some roads if we have a brand new Spawn
  const constructionSiteCount = Game.spawns.Spawn1.room.find(
    FIND_MY_CONSTRUCTION_SITES
  ).length
  const roadCount = Game.spawns.Spawn1.room.find(FIND_MY_STRUCTURES, {
    filter: { structureType: STRUCTURE_ROAD },
  }).length
  if (constructionSiteCount + roadCount === 0) {
    for (const source of sources) {
      const pathToSource = Game.spawns.Spawn1.pos.findPathTo(source, {
        ignoreCreeps: true,
      })
      for (const pathStep of pathToSource) {
        Game.spawns.Spawn1.room.createConstructionSite(
          pathStep.x,
          pathStep.y,
          STRUCTURE_ROAD
        )
      }
    }
    console.log(`We need some roads`)
  }

  // Generate some creeps
  if (
    Game.spawns.Spawn1.room.energyAvailable >= 300 &&
    Game.spawns.Spawn1.spawning === null
  ) {
    const harvesters = _.filter(
      Game.creeps,
      (creep) => creep.memory.role === "harvester"
    )
    console.log("Harvesters: " + harvesters.length)

    const upgraders = _.filter(
      Game.creeps,
      (creep) => creep.memory.role === "upgrader"
    )
    console.log("Upgraders: " + upgraders.length)

    const defenders = _.filter(
      Game.creeps,
      (creep) => creep.memory.role === "defender"
    )
    console.log("Defenders: " + defenders.length)

    // Spawn a creep
    if (defenders.length <= Math.floor(harvesters.length / 2)) {
      const defenderName = Game.time + "_" + "Defender" + defenders.length
      console.log("Spawning new upgrader: " + defenderName)
      Game.spawns.Spawn1.spawnCreep(
        [MOVE, MOVE, ATTACK, ATTACK], // 260
        defenderName,
        {
          memory: {
            role: "defender",
            room: Game.spawns.Spawn1.room.name,
            working: false,
            state: "THINK",
            destination: new RoomPosition(0, 0, Game.spawns.Spawn1.room.name),
            sourceNumber: -1,
          },
        }
      )
    } else if (harvesters.length <= 3 * sources.length) {
      const harvesterName = Game.time + "_" + "Harvester" + harvesters.length
      console.log("Spawning new harvester: " + harvesterName)
      Game.spawns.Spawn1.spawnCreep(
        [MOVE, MOVE, WORK, CARRY], // 250
        harvesterName,
        {
          memory: {
            role: "harvester",
            room: Game.spawns.Spawn1.room.name,
            working: false,
            state: "THINK",
            destination: new RoomPosition(0, 0, Game.spawns.Spawn1.room.name),
            sourceNumber: Math.floor(harvesters.length / 4),
          },
        }
      )
    } else if (upgraders.length <= 2) {
      const upgraderName = Game.time + "_" + "Upgrader" + upgraders.length
      console.log("Spawning new upgrader: " + upgraderName)
      Game.spawns.Spawn1.spawnCreep(
        [WORK, WORK, MOVE, CARRY], // 300
        upgraderName,
        {
          memory: {
            role: "upgrader",
            room: Game.spawns.Spawn1.room.name,
            working: false,
            state: "THINK",
            destination: new RoomPosition(0, 0, Game.spawns.Spawn1.room.name),
            sourceNumber: -1,
          },
        }
      )
    }
  }

  // Run all creeps
  for (const creepName in Game.creeps) {
    try {
      const creep = Game.creeps[creepName]
      if (creep.spawning === false) {
        if (creep.memory.role === "harvester") {
          roleHarvester.run(creep)
        }
        if (creep.memory.role === "upgrader") {
          roleUpgrader.run(creep)
        }
        if (creep.memory.role === "defender") {
          roleDefender.run(creep)
        }
      }
    } catch (e) {
      console.log(`${creepName} threw a ${e}`)
    }
  }
})
