export const actionRepair = (creep: Creep) => {
  // Repair the structure around us with the lowest HP
  // TODO fix out of bounds errors (map is 0-49)
  const nearbyStructures = creep.room.lookForAtArea(
    LOOK_STRUCTURES,
    creep.pos.y - 3,
    creep.pos.x - 3,
    creep.pos.y + 3,
    creep.pos.x + 3,
    true
  ) // we can repair in a 3 range around us
  if (nearbyStructures.length > 0) {
    nearbyStructures.sort((a, b) => a.structure.hits - b.structure.hits)
    const repairResult = creep.repair(nearbyStructures[0].structure)
    if (repairResult !== OK) {
      console.log(`${creep.name} had repair error: ${repairResult}`)
    }
    creep.say("🔧Repair!🛠")
  }
}
