import { ErrorMapper } from "utils/ErrorMapper"
import { roleHarvester } from "roleHarvester"
import { roleMiner } from "roleMiner"
import { roleFetcher } from "roleFetcher"
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
  // if (constructionSiteCount === 0) {
  if (Game.time % 100 === 0) {
    console.log(`=== Road planning check (every 100 ticks) ===`)
    const mineablePositions = getMineablePositions(Game.spawns.Spawn1.room)
    const terrain = new Room.Terrain(Game.spawns.Spawn1.room.name)
    // Count the containers because there's a maximum of 5 containers allowed
    const MAX_CONTAINERS = 5
    let containersCount = Game.spawns.Spawn1.room.find(FIND_STRUCTURES, {
      filter: (structure) => structure.structureType === "container",
    }).length
    containersCount += Game.spawns.Spawn1.room.find(FIND_CONSTRUCTION_SITES, {
      filter: (constructionSite) =>
        constructionSite.structureType === "container",
    }).length
    // Plan containers at each mineable position and roads around them
    for (const mineablePosition of mineablePositions) {
      if (containersCount < MAX_CONTAINERS) {
        Game.spawns.Spawn1.room.createConstructionSite(
          mineablePosition.x,
          mineablePosition.y,
          STRUCTURE_CONTAINER
        )
        containersCount++
      }
      // Build roads surrounding each mineablePosition
      for (let x = mineablePosition.x - 1; x < mineablePosition.x + 1; x++) {
        for (let y = mineablePosition.y - 1; y < mineablePosition.y + 1; y++) {
          if (x === mineablePosition.x && y === mineablePosition.y) {
            // We don't want a road on the actual mineable Position
            continue
          }
          switch (terrain.get(x, y)) {
            // No action cases
            case TERRAIN_MASK_WALL:
              break
            // Build road cases
            case 0: // plain
            case TERRAIN_MASK_SWAMP:
            default:
              Game.spawns.Spawn1.room.createConstructionSite(
                x,
                y,
                STRUCTURE_ROAD
              )
          }
        }
      }
    }

    // Plan roads from spawn to all possible mining positions (i.e. all sources)
    for (const mineablePosition of mineablePositions) {
      const pathToMineablePosition = Game.spawns.Spawn1.pos.findPathTo(
        mineablePosition,
        {
          ignoreCreeps: true,
        }
      )
      for (const [index, pathStep] of pathToMineablePosition.entries()) {
        if (index < pathToMineablePosition.length - 1) {
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

  // Constants and initializations
  // Define roles
  const creepRoles = [
    "Harvester",
    "Miner",
    "Fetcher",
    "Upgrader",
    "Builder",
    // "Worker", // Evolves into Upgrader or Builder
    "Defender",
  ]
  const creepTemplates: { [role: string]: BodyPartConstant[] } = {
    Harvester: [WORK, WORK, MOVE, CARRY], // 300 energy
    Miner: [WORK, WORK, MOVE], // 250
    Fetcher: [MOVE, CARRY, CARRY, CARRY, CARRY], // 300
    // Upgrader: [WORK, WORK, MOVE, CARRY], // 300
    // Builder: [WORK, WORK, MOVE, CARRY], // 300
    Worker: [WORK, WORK, MOVE, CARRY], // 300
    Defender: [MOVE, MOVE, ATTACK, ATTACK], // 260
  }
  const creepCounts: { [role: string]: number } = {}
  for (const role of creepRoles) {
    creepCounts[role] = _.filter(
      Game.creeps,
      (creep) => creep.memory.role === role
    ).length
  }

  // Evolutions
  // Harvester ==> Builder
  if (creepCounts.Harvester > 0 && creepCounts.Miner >= creepCounts.Harvester) {
    _.filter(Game.creeps, (creep) => creep.memory.role === "Harvester").forEach(
      (creep) => {
        // We've progressed to miners, so harvesters become builders
        creep.say("EVOLVE")
        const newRole = "Builder"
        console.log(`${creep.name} has evolved to a ${newRole}`)
        creep.memory.role = newRole
        creep.memory.state = "THINK"
      }
    )
  }
  // Upgrader || Worker ==> Builder
  if (constructionSiteCount > 0) {
    _.filter(
      Game.creeps,
      (creep) =>
        creep.memory.role === "Upgrader" || creep.memory.role === "Worker"
    ).forEach((creep) => {
      // We have stuff to build, so builders and workers become upgraders
      creep.say("EVOLVE")
      const newRole = "Builder"
      console.log(`${creep.name} has evolved to a ${newRole}`)
      creep.memory.role = newRole
      creep.memory.state = "THINK"
    })
  }
  // Builder || Worker ==> Upgrader
  if (constructionSiteCount === 0) {
    _.filter(
      Game.creeps,
      (creep) =>
        creep.memory.role === "Builder" || creep.memory.role === "Worker"
    ).forEach((creep) => {
      // We've run out of stuff to build, so builders and workers become upgraders
      creep.say("EVOLVE")
      const newRole = "Upgrader"
      console.log(`${creep.name} has evolved to a ${newRole}`)
      creep.memory.role = newRole
      creep.memory.state = "THINK"
    })
  }

  // Generate some creeps
  if (
    Game.spawns.Spawn1.room.energyAvailable >= 300 &&
    Game.spawns.Spawn1.spawning === null
  ) {
    const mineablePositionsCount = getMineablePositions(Game.spawns.Spawn1.room)
      .length

    // Log current counts to console
    for (const role of creepRoles) {
      const outputMessage = `${role}s: ${creepCounts[role]}`
      if (role === "Miner") {
        console.log(
          `${outputMessage} of ${mineablePositionsCount} mineable positions`
        )
      } else {
        console.log(outputMessage)
      }
    }

    // Helper Functions
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
    } else if (creepCounts.Fetcher < mineablePositionsCount / 2) {
      spawnCreep("Fetcher")
    } else if (
      creepCounts.Builder + creepCounts.Upgrader <
      mineablePositionsCount
    ) {
      spawnCreep("Worker")
    }

    // TODO: Defense against creep invasion
    // else if (creepCounts.Defender < 3) {      spawnCreep("Defender")    }
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
        if (creep.memory.role === "Fetcher") {
          roleFetcher.run(creep)
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
