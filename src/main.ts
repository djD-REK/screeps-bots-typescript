import { ErrorMapper } from "utils/ErrorMapper"
import { roleHarvester } from "roleHarvester"
import { roleMiner } from "roleMiner"
import { roleFetcher } from "roleFetcher"
import { roleUpgrader } from "roleUpgrader"
import { roleDefender } from "roleDefender"
import { roleBuilder } from "roleBuilder"
import { roleEye } from "roleEye"
import {
  getMineablePositionsIncludingSurroundingRooms,
  getAccessibleAdjacentRoomNames,
  getRoomsFromRoomNamesIfVision,
  getAccessibleRoomNamesWithVision,
  getAccessibleRoomNamesWithoutVision,
} from "helperFunctions"

const MAX_CONTAINERS = 5

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
  // const sources = Game.spawns.Spawn1.room.find(FIND_SOURCES)

  // ROAD PLANNING CHECK: Plan some roads every so often
  // First, count the construction sites in this & surrounding rooms
  let constructionSiteCount = Game.spawns.Spawn1.room.find(
    FIND_CONSTRUCTION_SITES // not FIND_MY_CONSTRUCTION_SITES
  ).length
  // FIND_MY_CONSTRUCTION_SITES won't work on roads (neutral structures)
  // Find the rooms accessible from this one (this room exits there)
  const accessibleAdjacentRoomsWithVision: Array<Room> = getRoomsFromRoomNamesIfVision(
    getAccessibleAdjacentRoomNames(Game.spawns.Spawn1.room)
  )
  // Add the under-construction roads and containers in adjacent rooms
  for (const accessibleAdjacentRoom of accessibleAdjacentRoomsWithVision) {
    constructionSiteCount += accessibleAdjacentRoom.find(
      FIND_CONSTRUCTION_SITES // not FIND_MY_CONSTRUCTION_SITES
    ).length
  }
  if (Game.time % 5 === 0) {
    // if (Game.time % 100 === 0)
    console.log(`=== Road planning check (every 100 ticks) ===`)

    // Road planning logic part 1: For mineable positions in the current room
    // Find the mineable positions we want to build roads to
    const mineablePositions = getMineablePositionsIncludingSurroundingRooms(
      Game.spawns.Spawn1.room
    )
    // Create a terrain helper for quick lookups of terrain
    const terrain = new Room.Terrain(Game.spawns.Spawn1.room.name)
    // Count the containers because there's a maximum of 5 containers allowed
    let containersCount = Game.spawns.Spawn1.room.find(FIND_STRUCTURES, {
      filter: (structure) => structure.structureType === "container",
    }).length
    containersCount += Game.spawns.Spawn1.room.find(FIND_CONSTRUCTION_SITES, {
      filter: (constructionSite) =>
        constructionSite.structureType === "container",
    }).length

    // Plan containers at each mineable position as well as
    // roads to and around each mineable position
    for (const mineablePosition of mineablePositions) {
      if (containersCount < MAX_CONTAINERS) {
        Game.spawns.Spawn1.room.createConstructionSite(
          mineablePosition.x,
          mineablePosition.y,
          STRUCTURE_CONTAINER
        )
        containersCount++
      }

      // Build roads to each mineable position
      const pathToMineablePosition = Game.spawns.Spawn1.pos.findPathTo(
        mineablePosition,
        {
          ignoreCreeps: true,
        }
      )
      for (const [index, pathStep] of pathToMineablePosition.entries()) {
        if (index < pathToMineablePosition.length - 1) {
          // Here's the reason it's pathToMineablePosition.length - 1:
          // Don't build construction sites directly on top of sources and
          // don't build them within 2 range of sources (mining positions)
          Game.spawns.Spawn1.room.createConstructionSite(
            pathStep.x,
            pathStep.y,
            STRUCTURE_ROAD
          )
        }
      }

      // Build roads surrounding each mineablePosition
      for (let x = mineablePosition.x - 1; x <= mineablePosition.x + 1; x++) {
        for (let y = mineablePosition.y - 1; y <= mineablePosition.y + 1; y++) {
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
              break
          }
        }
      }
    }

    // Road planning logic part 2: for creep Spawns
    const roomSpawns = Game.spawns.Spawn1.room.find(FIND_STRUCTURES, {
      filter: (structure) => structure.structureType === "spawn",
    })
    const roomSpawnPositions = roomSpawns.map((aSpawn) => aSpawn.pos)
    // Plan roads to assist traffic around any Spawns in this room
    for (const roomSpawnPosition of roomSpawnPositions) {
      // Build roads completely surrounding each Spawn in this room
      for (let x = roomSpawnPosition.x - 1; x <= roomSpawnPosition.x + 1; x++) {
        for (
          let y = roomSpawnPosition.y - 1;
          y <= roomSpawnPosition.y + 1;
          y++
        ) {
          if (x === roomSpawnPosition.x && y === roomSpawnPosition.y) {
            // We don't want a road on the actual position of the Spawn
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

    // Road planning logic part 3: Roads to energy sources in other rooms
    // Loop through the accessible rooms & plan roads to mineable positions
    for (const accessibleAdjacentRoom of accessibleAdjacentRoomsWithVision) {
      const deleteRooms = () => {
        console.log(
          `DELETING ALL CONSTRUCTION SITES in ${accessibleAdjacentRoom.name}`
        )
        const sites = Game.rooms[accessibleAdjacentRoom.name].find(
          FIND_CONSTRUCTION_SITES
        )
        for (const site of sites) {
          site.remove()
        }
      }

      // Find the mineable positions we want to build roads to
      const mineablePositionsAdjacentRoom = getMineablePositionsIncludingSurroundingRooms(
        accessibleAdjacentRoom
      )
      // Create a terrain helper for quick lookups of terrain
      const terrainAdjacentRoom = new Room.Terrain(accessibleAdjacentRoom.name)
      // Count the containers because there's a maximum of 5 containers allowed
      let containersCount = accessibleAdjacentRoom.find(FIND_STRUCTURES, {
        filter: (structure) => structure.structureType === "container",
      }).length
      containersCount += accessibleAdjacentRoom.find(FIND_CONSTRUCTION_SITES, {
        filter: (constructionSite) =>
          constructionSite.structureType === "container",
      }).length

      // Plan containers at each mineable position as well as
      // roads to and around each mineable position
      for (const mineablePosition of mineablePositionsAdjacentRoom) {
        if (containersCount < MAX_CONTAINERS) {
          accessibleAdjacentRoom.createConstructionSite(
            mineablePosition.x,
            mineablePosition.y,
            STRUCTURE_CONTAINER
          )
          containersCount++
        }

        // Build roads from the creep Spawn to each exit (mineable position)
        const pathFromSpawnToMineablePosition = Game.spawns.Spawn1.pos.findPathTo(
          mineablePosition,
          {
            ignoreCreeps: true,
          }
        )
        for (const [
          index,
          pathStep,
        ] of pathFromSpawnToMineablePosition.entries()) {
          if (index < pathFromSpawnToMineablePosition.length - 1) {
            pathStep
            // Here's the reason it's pathToMineablePosition.length - 1:
            // Don't build on top of exits
            Game.spawns.Spawn1.room.createConstructionSite(
              pathStep.x,
              pathStep.y,
              STRUCTURE_ROAD
            )
          }
        }

        // Build roads from each mineable position back to the creep Spawn
        const pathFromMineablePositionToSpawn = mineablePosition.findPathTo(
          Game.spawns.Spawn1.pos,
          {
            ignoreCreeps: true,
          }
        )
        for (const [
          index,
          pathStep,
        ] of pathFromMineablePositionToSpawn.entries()) {
          if (index < pathFromMineablePositionToSpawn.length - 1) {
            pathStep
            // Here's the reason it's pathToMineablePosition.length - 1:
            // Don't build on top of exits
            accessibleAdjacentRoom.createConstructionSite(
              pathStep.x,
              pathStep.y,
              STRUCTURE_ROAD
            )
          }
        }

        // Build roads surrounding each mineablePosition
        for (let x = mineablePosition.x - 1; x <= mineablePosition.x + 1; x++) {
          for (
            let y = mineablePosition.y - 1;
            y <= mineablePosition.y + 1;
            y++
          ) {
            switch (terrainAdjacentRoom.get(x, y)) {
              // No action cases
              case TERRAIN_MASK_WALL:
                break
              // Build road cases
              case 0: // plain
              case TERRAIN_MASK_SWAMP:
              default:
                accessibleAdjacentRoom.createConstructionSite(
                  x,
                  y,
                  STRUCTURE_ROAD
                )
                break
            }
          }
        }
      }
    }
    // End of road planning logic
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
    "Eye",
  ]
  const creepTemplates: { [role: string]: BodyPartConstant[] } = {
    Harvester: [WORK, WORK, MOVE, CARRY], // 300 energy
    Miner: [WORK, WORK, MOVE], // 250
    Fetcher: [MOVE, CARRY, CARRY, CARRY, CARRY], // 300
    // Upgrader: [WORK, WORK, MOVE, CARRY], // 300
    // Builder: [WORK, WORK, MOVE, CARRY], // 300
    Worker: [WORK, WORK, MOVE, CARRY], // 300
    Defender: [MOVE, MOVE, ATTACK, ATTACK], // 260
    Eye: [MOVE],
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
    let mineablePositionsCount = getMineablePositionsIncludingSurroundingRooms(
      Game.spawns.Spawn1.room
    ).length
    const accessibleRoomNamesWithVision: Array<string> = getAccessibleRoomNamesWithVision(
      Game.spawns.Spawn1.room
    )
    if (accessibleRoomNamesWithVision.length > 0) {
      // There are accessible adjacent rooms with vision
      // So add their mineable positions to the count
      for (const accessibleRoom of accessibleRoomNamesWithVision) {
        mineablePositionsCount += getMineablePositionsIncludingSurroundingRooms(
          Game.rooms[accessibleRoom]
        ).length
      }
    }

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
    const accessibleRoomNamesWithoutVision = getAccessibleRoomNamesWithoutVision(
      Game.spawns.Spawn1.room
    )

    // Generate one creep at a time by looping
    for (let i = mineablePositionsCount - 1; i >= 0; i--) {
      if (creepCounts.Miner + i < mineablePositionsCount) {
        spawnCreep("Miner")
        break
      } else if (creepCounts.Fetcher + i < mineablePositionsCount) {
        spawnCreep("Fetcher")
        break
      } else if (
        creepCounts.Builder + creepCounts.Upgrader + i <
        Math.floor(mineablePositionsCount * 2)
      ) {
        spawnCreep("Worker")
        break
      } else if (creepCounts.Eye + i < mineablePositionsCount) {
        spawnCreep("Eye")
        break
      }
    }

    // TODO: Defense against creep invasion
    // else if (creepCounts.Defender < 3) {      spawnCreep("Defender")    }
  }

  // Run all creeps
  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName]
    const creepRole = creep.memory.role
    try {
      if (creep.spawning === false) {
        switch (creepRole) {
          case "Harvester":
            roleHarvester.run(creep)
            break
          case "Miner":
            roleMiner.run(creep)
            break
          case "Fetcher":
            roleFetcher.run(creep)
            break
          case "Upgrader":
            roleUpgrader.run(creep)
            break
          case "Builder":
            roleBuilder.run(creep)
            break
          case "Defender":
            roleDefender.run(creep)
            break
          case "Eye":
            roleEye.run(creep)
            break
          default:
            console.log(`Unknown creep role${creep.memory.role}`)
            break
        }
      }
    } catch (e) {
      console.log(`${creepName} of role ${creepRole} threw a ${e}`)
    }
  }
})
