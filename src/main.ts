import { ErrorMapper } from "utils/ErrorMapper"
import { roleHarvester } from "roleHarvester"
import { roleMiner } from "roleMiner"
import { roleUpgrader } from "roleUpgrader"
import { roleDefender } from "roleDefender"
import { roleBuilder } from "roleBuilder"
import { getMineablePositions } from "getMineablePositions"

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
    // Plan roads from spawn to all possible mining positions (i.e. all sources)
    const mineablePositions = getMineablePositions(Game.spawns.Spawn1.room)
    for (const source of mineablePositions) {
      const pathToSource = Game.spawns.Spawn1.pos.findPathTo(source, {
        ignoreCreeps: true,
      })
      for (const [index, pathStep] of pathToSource.entries()) {
        if (index < pathToSource.length - 2) {
          // Don't build construction sites directly on top of sources and
          // don't build them within 2 range of sources (mining positions)
          // TODO: Check for mining positions and build caddy corner to them
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
      const pathToController = Game.spawns.Spawn1.pos.findPathTo(controller, {
        ignoreCreeps: true,
      })
      for (const [index, pathStep] of pathToController.entries()) {
        if (index < pathToController.length - 4) {
          // Don't build construction sites within 3 range of controller
          // because the upgradeController command has 3 squares range
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
    // Define roles
    const creepRoles = ["Harvester", "Miner", "Upgrader", "Builder", "Defender"]
    const creepTemplates: { [role: string]: BodyPartConstant[] } = {
      Harvester: [WORK, WORK, MOVE, CARRY], // 300 energy
      Miner: [WORK, WORK, MOVE], // 250
      Upgrader: [WORK, WORK, MOVE, CARRY], // 300
      Builder: [WORK, WORK, MOVE, CARRY], // 300
      Defender: [MOVE, MOVE, ATTACK, ATTACK], // 260
    }
    const creepCounts: { [role: string]: number } = {}

    const mineablePositionsCount = getMineablePositions(Game.spawns.Spawn1.room)
      .length

    // Log current counts to console
    for (const role of creepRoles) {
      creepCounts[role] = _.filter(
        Game.creeps,
        (creep) => creep.memory.role === role
      ).length
      const outputMessage = `${role}s: ${creepCounts[role]}`
      if (role === "Miner") {
        console.log(
          `${outputMessage} of ${mineablePositionsCount} mineable positions`
        )
      } else {
        console.log(outputMessage)
      }
    }

    // Evolutions
    if (creepCounts.Miner >= creepCounts.Harvester) {
      _.filter(
        Game.creeps,
        (creep) => creep.memory.role === "Harvester"
      ).forEach((creep) => {
        // We've progressed to miners, so harvesters become builders
        creep.say("EVOLVE")
        console.log(`Harvester ${creep.name} has become a Builder`)
        creep.memory.role = "Builder"
        creep.memory.state = "THINK"
      })
    }

    const generateCreepName = (role: string) => {
      let randomNumber: number
      let name: string
      do {
        randomNumber = Math.floor(Math.random() * 100)
        name = `${role}_${randomNumber}`
      } while (_.filter(Game.creeps, (creep) => creep.name === name).length > 0)
      // Return a unique name for this creep
      return name
    }

    const spawnCreep = (role: string) => {
      const creepName = generateCreepName(role)
      console.log(`Spawning new creep: ${creepName}`)
      Game.spawns.Spawn1.spawnCreep(creepTemplates[role], creepName, {
        memory: {
          role,
          room: Game.spawns.Spawn1.room.name,
          state: "THINK",
          destination: new RoomPosition(0, 0, Game.spawns.Spawn1.room.name),
          sourceNumber: 0,
        },
      })
    }

    // Spawn a creep
    if (
      creepCounts.Harvester < mineablePositionsCount &&
      creepCounts.Miner === 0
    ) {
      // Brand new room
      spawnCreep("Harvester")
    } else if (creepCounts.Miner < mineablePositionsCount) {
      spawnCreep("Miner")
    } else if (
      creepCounts.Upgrader < 3 &&
      constructionSiteCount === 0 &&
      creepCounts.Builder === 0
    ) {
      spawnCreep("Upgrader")
    } else if (
      creepCounts.Builder < 3 &&
      constructionSiteCount > 0 &&
      creepCounts.Upgrader === 0
    ) {
      spawnCreep("Builder")
    } else if (creepCounts.Defender < 3) {
      spawnCreep("Defender")
    }
  }

  // Run all creeps
  for (const creepName in Game.creeps) {
    try {
      const creep = Game.creeps[creepName]
      if (creep.spawning === false) {
        if (creep.memory.role === "Harvester") {
          roleHarvester.run(creep)
        }
        if (creep.memory.role === "Miner") {
          roleMiner.run(creep)
        }
        if (creep.memory.role === "Upgrader") {
          roleUpgrader.run(creep)
        }
        if (creep.memory.role === "Builder") {
          roleBuilder.run(creep)
        }
        if (creep.memory.role === "Defender") {
          roleDefender.run(creep)
        }
      }
    } catch (e) {
      console.log(`${creepName} threw a ${e}`)
    }
  }
})
