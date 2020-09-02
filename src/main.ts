import { ErrorMapper } from "utils/ErrorMapper"
import { roleHarvester } from "roleHarvester"

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

    const newName = Game.time + "_" + "Harvester" + harvesters.length
    console.log("Spawning new harvester: " + newName)
    Game.spawns.Spawn1.spawnCreep(
      [MOVE, MOVE, WORK, CARRY], // 250
      newName,
      {
        memory: {
          role: "harvester",
          room: Game.spawns.Spawn1.room.name,
          working: false,
          state: "THINK",
          destination: new RoomPosition(0, 0, Game.spawns.Spawn1.room.name),
          sourceNumber: -1,
        },
      }
    )
  }

  // Run all creeps
  for (const creepName in Game.creeps) {
    try {
      const creep = Game.creeps[creepName]
      if (creep.spawning === false) {
        if (creep.memory.role === "harvester") {
          roleHarvester.run(creep)
        }
      }
    } catch (e) {
      console.log(`${creepName} threw a ${e}`)
    }
  }
})
