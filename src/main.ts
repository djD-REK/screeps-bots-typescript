import { ErrorMapper } from "utils/ErrorMapper"
import { roleHarvester } from "roleHarvester"
import { roleMiner } from "roleMiner"
import { roleUpgrader } from "roleUpgrader"
import { roleDefender } from "roleDefender"
import { roleBuilder } from "roleBuilder"

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
  if (constructionSiteCount === 0) {
    console.log(`We might need some roads`)
    // Plan roads from spawn to sources
    for (const source of sources) {
      const pathToSource = Game.spawns.Spawn1.pos.findPathTo(source, {
        ignoreCreeps: true,
      })
      for (const pathStep of pathToSource) {
        if (pathStep.x === source.pos.x && pathStep.y === source.pos.y) {
          // Don't build construction sites directly on top of sources
        } else {
          Game.spawns.Spawn1.room.createConstructionSite(
            pathStep.x,
            pathStep.y,
            STRUCTURE_ROAD
          )
        }
      }
    }
    // Plan roads from spawn to room controller
    const controller = Game.spawns.Spawn1.room.controller
    if (controller) {
      const pathToSource = Game.spawns.Spawn1.pos.findPathTo(controller, {
        ignoreCreeps: true,
      })
      for (const pathStep of pathToSource) {
        if (
          pathStep.x === controller.pos.x &&
          pathStep.y === controller.pos.y
        ) {
          // Don't build construction sites directly on top of controllers
        } else {
          Game.spawns.Spawn1.room.createConstructionSite(
            pathStep.x,
            pathStep.y,
            STRUCTURE_ROAD
          )
        }
      }
    }
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

    const miners = _.filter(
      Game.creeps,
      (creep) => creep.memory.role === "miner"
    )
    console.log("Miners: " + miners.length)

    const upgraders = _.filter(
      Game.creeps,
      (creep) => creep.memory.role === "upgrader"
    )
    console.log("Upgraders: " + upgraders.length)

    const builders = _.filter(
      Game.creeps,
      (creep) => creep.memory.role === "builder"
    )
    console.log("Builders: " + builders.length)

    const defenders = _.filter(
      Game.creeps,
      (creep) => creep.memory.role === "defender"
    )
    console.log("Defenders: " + defenders.length)

    // Spawn a creep
    // if (harvesters.length < 4 * sources.length) {
    if (harvesters.length < 7) {
      const harvesterName = Game.time + "_" + "Harvester" + harvesters.length
      console.log("Spawning new harvester: " + harvesterName)
      Game.spawns.Spawn1.spawnCreep(
        // [MOVE, MOVE, WORK, CARRY], // 250
        [MOVE, MOVE, WORK, CARRY, CARRY], // 300
        harvesterName,
        {
          memory: {
            role: "harvester",
            room: Game.spawns.Spawn1.room.name,
            working: false,
            state: "THINK",
            destination: new RoomPosition(0, 0, Game.spawns.Spawn1.room.name),
            sourceNumber: 0,
          },
        }
      )
    } else if (
      upgraders.length < 3 &&
      constructionSiteCount === 0 &&
      builders.length === 0
    ) {
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
    } else if (
      builders.length < 3 &&
      constructionSiteCount > 0 &&
      upgraders.length === 0
    ) {
      const builderName = Game.time + "_" + "Builder" + builders.length
      console.log("Spawning new builder: " + builderName)
      Game.spawns.Spawn1.spawnCreep(
        [WORK, WORK, MOVE, CARRY], // 300
        builderName,
        {
          memory: {
            role: "builder",
            room: Game.spawns.Spawn1.room.name,
            working: false,
            state: "THINK",
            destination: new RoomPosition(0, 0, Game.spawns.Spawn1.room.name),
            sourceNumber: -1,
          },
        }
      )
    } else if (defenders.length < 3) {
      const defenderName = Game.time + "_" + "Defender" + defenders.length
      console.log("Spawning new defender: " + defenderName)
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
        if (creep.memory.role === "miner") {
          roleHarvester.run(creep)
        }
        if (creep.memory.role === "upgrader") {
          roleUpgrader.run(creep)
        }
        if (creep.memory.role === "builder") {
          roleBuilder.run(creep)
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
