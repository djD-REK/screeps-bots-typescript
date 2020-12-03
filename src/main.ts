import { ErrorMapper } from "utils/ErrorMapper"
import { roleHarvester } from "roleHarvester"
import { roleMiner } from "roleMiner"
import { roleFetcher } from "roleFetcher"
import { roleUpgrader } from "roleUpgrader"
import { roleDefender } from "roleDefender"
import { roleBuilder } from "roleBuilder"
import { roleEye } from "roleEye"
import {
  getAccessibleAdjacentRoomNames,
  getRoomsFromRoomNamesIfVision,
  getAccessibleRoomNamesWithVision,
  getAccessibleRoomNamesWithoutVision,
  getMineablePositionsInAllRoomsWithVision,
  getMineablePositions,
} from "helper_functions"
import { getCreepTemplatesAndTargetCounts } from "helper_functions/helpersEmpire"

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

  // ROAD PLANNING LOGIC
  const DELETE_CONSTRUCTION_SITES_EVERY_X_TICKS = 100
  const DELETE_CONSTRUCTION_SITES =
    Game.time % DELETE_CONSTRUCTION_SITES_EVERY_X_TICKS === 0 ? true : false
  if (DELETE_CONSTRUCTION_SITES) {
    console.log(
      `DELETING ALL NOT YET STARTED CONSTRUCTION SITES (every ${DELETE_CONSTRUCTION_SITES_EVERY_X_TICKS} ticks)`
    )
    for (const room of Object.values(Game.rooms)) {
      for (const site of room.find(FIND_CONSTRUCTION_SITES)) {
        if (site.progress === 0) {
          site.remove()
        }
      }
    }
  }

  const PLAN_CONSTRUCTION_SITES_EVERY_X_TICKS = 10
  const MAX_CONSTRUCTION_SITES_PER_TICK = 10
  if (Game.time % PLAN_CONSTRUCTION_SITES_EVERY_X_TICKS === 0) {
    let constructionSitesPlannedThisTick = 0 // only plan some sites each tick
    console.log(
      `=== Road planning check (every ${PLAN_CONSTRUCTION_SITES_EVERY_X_TICKS} ticks) ===`
    )

    // Road planning logic part 1: For mineable positions in the current room
    // Find the mineable positions we want to build roads to
    const mineablePositions = getMineablePositions(Game.spawns.Spawn1.room)
    // Sort mineable positions by range from the creep spawn
    mineablePositions.sort(
      (a, b) =>
        Game.spawns.Spawn1.pos.getRangeTo(a) -
        Game.spawns.Spawn1.pos.getRangeTo(b)
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
        if (
          constructionSitesPlannedThisTick < MAX_CONSTRUCTION_SITES_PER_TICK &&
          Game.spawns.Spawn1.room.createConstructionSite(
            mineablePosition.x,
            mineablePosition.y,
            STRUCTURE_CONTAINER
          ) === OK
        ) {
          containersCount++
          constructionSitesPlannedThisTick++
        }
      }

      // Build roads to each mineable position
      const pathToMineablePosition = Game.spawns.Spawn1.pos.findPathTo(
        mineablePosition,
        {
          ignoreCreeps: false, // maybe should be true for road planning,
          // maxRooms: 1, // don't path through other rooms
        }
      )
      for (const [index, pathStep] of pathToMineablePosition.entries()) {
        if (index < pathToMineablePosition.length - 1) {
          // Here's the reason it's pathToMineablePosition.length - 1:
          // Don't build construction sites directly on top of sources and
          // don't build them within 2 range of sources (mining positions)
          if (
            constructionSitesPlannedThisTick <
              MAX_CONSTRUCTION_SITES_PER_TICK &&
            Game.spawns.Spawn1.room.createConstructionSite(
              pathStep.x,
              pathStep.y,
              STRUCTURE_ROAD
            ) === OK
          ) {
            constructionSitesPlannedThisTick++
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
              if (
                constructionSitesPlannedThisTick <
                  MAX_CONSTRUCTION_SITES_PER_TICK &&
                Game.spawns.Spawn1.room.createConstructionSite(
                  x,
                  y,
                  STRUCTURE_ROAD
                ) === OK
              ) {
                constructionSitesPlannedThisTick++
              }
              break
          }
        }
      }
    }
    // Plan roads from spawn to room controller
    const controller = Game.spawns.Spawn1.room.controller
    if (controller) {
      const pathToController = Game.spawns.Spawn1.pos.findPathTo(controller, {
        ignoreCreeps: false, // maybe should be true for road planning,
        // maxRooms: 1,
      })
      for (const [index, pathStep] of pathToController.entries()) {
        if (index < pathToController.length - 4) {
          // Don't build construction sites within 3 range of controller
          // because the upgradeController command has 3 squares range
          if (
            constructionSitesPlannedThisTick <
              MAX_CONSTRUCTION_SITES_PER_TICK &&
            Game.spawns.Spawn1.room.createConstructionSite(
              pathStep.x,
              pathStep.y,
              STRUCTURE_ROAD
            ) === OK
          ) {
            constructionSitesPlannedThisTick++
          }
        }
      }
    }

    // Road planning logic part 3: Build roads surrounding each mineable position
    for (const mineablePosition of mineablePositions) {
      // Build roads surrounding each mineablePosition
      for (let x = mineablePosition.x - 1; x <= mineablePosition.x + 1; x++) {
        for (let y = mineablePosition.y - 1; y <= mineablePosition.y + 1; y++) {
          if (x !== mineablePosition.x && y !== mineablePosition.y) {
            // Don't build roads on mineable positions,
            // since miners sit there on top of containers
            switch (terrain.get(x, y)) {
              // No action cases
              case TERRAIN_MASK_WALL:
                break
              // Build road cases
              case 0: // plain
              case TERRAIN_MASK_SWAMP:
              default:
                if (
                  constructionSitesPlannedThisTick <
                    MAX_CONSTRUCTION_SITES_PER_TICK &&
                  Game.spawns.Spawn1.room.createConstructionSite(
                    x,
                    y,
                    STRUCTURE_ROAD
                  ) === OK
                ) {
                  constructionSitesPlannedThisTick++
                }
                break
            }
          }
        }
      }
    }

    // Road planning logic part 4: Build roads between each mineable position in the Spawn's room
    // Plan all roads in the previous loops before building roads between mineable positions
    for (const mineablePosition of mineablePositions) {
      // TODO: Build roads between mineable positions in other rooms
      for (const mineablePositionTwo of mineablePositions) {
        // TODO: Only build roads between mineable positions that are close to each other, like for the same source, like range < 5
        const pathToMineablePositionTwo = mineablePosition.findPathTo(
          mineablePositionTwo,
          {
            ignoreCreeps: false, // don't ignore creeps when pathing between mineable positions -- this should help traffic flow
            //swampCost: 1, // ignore swamps; we want to build on swamps
            // maxRooms: 1, // don't path through other rooms
          }
        )
        for (const [index, pathStep] of pathToMineablePositionTwo.entries()) {
          if (index > 0 && index < pathToMineablePositionTwo.length - 1) {
            // Here's the reason it's index > 0 and index < pathToMineablePositionTwo.length - 1:
            // Don't build roads on mineable positions,
            // since miners sit there on top of containers
            if (
              constructionSitesPlannedThisTick <
                MAX_CONSTRUCTION_SITES_PER_TICK &&
              Game.spawns.Spawn1.room.createConstructionSite(
                pathStep.x,
                pathStep.y,
                STRUCTURE_ROAD
              ) === OK
            ) {
              constructionSitesPlannedThisTick++
            }
          }
        }
      }
    }

    // Road planning logic part 5: Plan roads from every mineable position to the room's controller (for upgraders)
    for (const mineablePosition of mineablePositions) {
      const controller = Game.spawns.Spawn1.room.controller
      if (controller) {
        const pathToController = mineablePosition.findPathTo(controller, {
          ignoreCreeps: false, // maybe should be true for road planning,
          // maxRooms: 1,
        })
        for (const [index, pathStep] of pathToController.entries()) {
          if (index > 0 && index < pathToController.length - 4) {
            // Here's the reason it's index > 0 and index < pathToMineablePositionTwo.length - 1:
            // Don't build roads on mineable positions,
            // since miners sit there on top of containers AND
            // Don't build construction sites within 3 range of controller
            // because the upgradeController command has 3 squares range
            if (
              constructionSitesPlannedThisTick <
                MAX_CONSTRUCTION_SITES_PER_TICK &&
              Game.spawns.Spawn1.room.createConstructionSite(
                pathStep.x,
                pathStep.y,
                STRUCTURE_ROAD
              ) === OK
            ) {
              constructionSitesPlannedThisTick++
            }
          }
        }
      }
    }

    // Road planning logic part 6: Roads to energy sources in other rooms
    // Loop through the accessible rooms & plan roads to mineable positions
    for (const accessibleAdjacentRoom of accessibleAdjacentRoomsWithVision) {
      // Find the mineable positions we want to build roads to
      const mineablePositionsAdjacentRoom = getMineablePositions(
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
          if (
            constructionSitesPlannedThisTick <
              MAX_CONSTRUCTION_SITES_PER_TICK &&
            accessibleAdjacentRoom.createConstructionSite(
              mineablePosition.x,
              mineablePosition.y,
              STRUCTURE_CONTAINER
            ) === OK
          ) {
            containersCount++
            constructionSitesPlannedThisTick++
          }
        }
        // Build roads from the creep Spawn to each exit (mineable position)
        const pathFromSpawnToMineablePosition = Game.spawns.Spawn1.pos.findPathTo(
          mineablePosition,
          {
            ignoreCreeps: false, // maybe should be true for road planning,
            // maxRooms: 1, // Only plan roads in the Spawn's room on this loop
          }
        )
        for (const [
          index,
          pathStep,
        ] of pathFromSpawnToMineablePosition.entries()) {
          if (index > 0 && index < pathFromSpawnToMineablePosition.length - 1) {
            pathStep
            // Here's the reason it's index > 0 and index < pathToMineablePosition.length - 1:
            // Don't build roads on top of Spawns AND
            // Don't build roads on top of exit squares
            if (
              constructionSitesPlannedThisTick <
                MAX_CONSTRUCTION_SITES_PER_TICK &&
              Game.spawns.Spawn1.room.createConstructionSite(
                pathStep.x,
                pathStep.y,
                STRUCTURE_ROAD
              ) === OK
            ) {
              constructionSitesPlannedThisTick++
            }
          }
        }

        // Build roads from each mineable position back to the creep Spawn
        const pathFromMineablePositionToSpawn = mineablePosition.findPathTo(
          Game.spawns.Spawn1.pos,
          {
            ignoreCreeps: false, // maybe should be true for road planning,
            // maxRooms: 1, // Search in the source's room, not the Spawn's room
          }
        )
        for (const [
          index,
          pathStep,
        ] of pathFromMineablePositionToSpawn.entries()) {
          if (index > 0 && index < pathFromMineablePositionToSpawn.length - 1) {
            pathStep
            // Here's the reason it's index > 0 and index < pathToMineablePosition.length - 1:
            // Don't build roads on top of mineable positions AND
            // Don't build roads on top of exit squares
            if (
              constructionSitesPlannedThisTick <
                MAX_CONSTRUCTION_SITES_PER_TICK &&
              accessibleAdjacentRoom.createConstructionSite(
                pathStep.x,
                pathStep.y,
                STRUCTURE_ROAD
              ) === OK
            ) {
              constructionSitesPlannedThisTick++
            }
          }
        }

        // Build roads surrounding each mineablePosition
        for (let x = mineablePosition.x - 1; x <= mineablePosition.x + 1; x++) {
          for (
            let y = mineablePosition.y - 1;
            y <= mineablePosition.y + 1;
            y++
          ) {
            if (x !== mineablePosition.x && y !== mineablePosition.y) {
              // Don't build roads on mineable positions,
              // since miners sit there on top of containers
              switch (terrainAdjacentRoom.get(x, y)) {
                // No action cases
                case TERRAIN_MASK_WALL:
                  break
                // Build road cases
                case 0: // plain
                case TERRAIN_MASK_SWAMP:
                default:
                  if (
                    constructionSitesPlannedThisTick <
                      MAX_CONSTRUCTION_SITES_PER_TICK &&
                    accessibleAdjacentRoom.createConstructionSite(
                      x,
                      y,
                      STRUCTURE_ROAD
                    ) === OK
                  ) {
                    constructionSitesPlannedThisTick++
                  }
                  break
              }
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
    "MiniFetcher",
    "Miner",
    "Fetcher",
    "Upgrader",
    "Builder",
    "Defender",
    "Eye",
  ]
  const creepTemplates: { [role: string]: BodyPartConstant[] } = {
    MiniFetcher: [MOVE, CARRY], // 100
    Miner: [WORK, WORK, MOVE], // 250
    Fetcher: [MOVE, CARRY, CARRY, CARRY, CARRY], // 250
    Upgrader: [WORK, MOVE, CARRY, CARRY, CARRY], // 300
    Builder: [WORK, MOVE, CARRY, CARRY, CARRY], // 300
    Defender: [MOVE, MOVE, ATTACK, ATTACK], // 260
    Eye: [MOVE], // 50
  }
  const creepCounts: { [role: string]: number } = {}
  for (const role of creepRoles) {
    creepCounts[role] = _.filter(
      Game.creeps,
      (creep) => creep.memory.role === role
    ).length
  }

  // Generate some creeps
  // TODO: Smarter energy check (300)
  // WIP: Check every 10 turns
  const SPAWN_A_CREEP_EVERY_X_TURNS = 10
  if (
    Game.spawns.Spawn1.spawning === null &&
    (Game.spawns.Spawn1.room.energyAvailable >= 300 ||
      (Game.time % SPAWN_A_CREEP_EVERY_X_TURNS === 0 &&
        Game.spawns.Spawn1.room.energyAvailable >= 100))
  ) {
    // Count mineable positions in all rooms with vision
    let mineablePositionsCount = getMineablePositionsInAllRoomsWithVision()
      .length
    const accessibleRoomNamesWithVision: Array<string> = getAccessibleRoomNamesWithVision(
      Game.spawns.Spawn1.room
    )
    console.log(
      `Accessible room names with vision: ${accessibleRoomNamesWithVision}`
    )

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
      return Game.spawns.Spawn1.spawnCreep(creepTemplates[role], creepName, {
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

    // Spawn creeps on a "per-room" basis, 5 at a time
    const visibleRooms = Array.from(Object.values(Game.rooms))
    const roomCount = visibleRooms.length
    let creepsPerRoom = 0
    let spawnResult // we set this when we actually attempt a spawn
    while (creepsPerRoom < mineablePositionsCount) {
      if (spawnResult === OK || spawnResult === ERR_NOT_ENOUGH_ENERGY) {
        break
      }
      if (spawnResult !== undefined) {
        console.log(`Game.spawns.Spawn1 had spawn result ${spawnResult}`)
      }
      creepsPerRoom += mineablePositionsCount / roomCount
      // This is the average mineablePositions from rooms that we have vision in
      if (
        creepCounts.MiniFetcher < creepCounts.Miner &&
        creepCounts.MiniFetcher < creepsPerRoom
      ) {
        // Brand new room, spawn mini creeps instead
        spawnResult = spawnCreep("MiniFetcher")
      } else if (creepCounts.Upgrader < 1 && creepCounts.Miner > 0) {
        // Always spawn an Upgrader when we have at least one Miner
        spawnResult = spawnCreep("Upgrader")
      } else if (
        creepCounts.Miner < creepsPerRoom * 2 &&
        creepCounts.Miner < mineablePositionsCount
      ) {
        // spawn twice as many miners as we should per-room
        // until we hit mineable positions (the max miners)
        spawnResult = spawnCreep("Miner")
      } else if (creepCounts.Eye < creepsPerRoom) {
        spawnResult = spawnCreep("Eye")
      } else if (creepCounts.Upgrader < creepsPerRoom) {
        spawnResult = spawnCreep("Upgrader")
      } else if (
        creepCounts.Builder < creepsPerRoom &&
        constructionSiteCount > 0
      ) {
        spawnResult = spawnCreep("Builder")
      } else if (creepCounts.Fetcher < creepsPerRoom) {
        // normal size fetchers hopefully once roads are being built
        spawnResult = spawnCreep("Fetcher")
      } else if (creepCounts.Defender < creepsPerRoom) {
        spawnResult = spawnCreep("Defender")
      }
      // TODO: Defense against creep invasion
      // else if (creepCounts.Defender < 3) {      spawnCreep("Defender")    }
    }
    console.log(
      `🧠 creepsPerRoom is ${Math.ceil(
        creepsPerRoom
      )} of ${mineablePositionsCount} mineable positions in ${
        Array.from(Object.entries(Game.rooms)).length
      } visible rooms`
    )
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
          // no break
          case "MiniFetcher":
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
