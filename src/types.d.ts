// Types declaration file - the place for custom typings

// interface creepTemplate {
// [role: string]: { parts: string[] }
// }

// memory extension
interface CreepMemory {
  role: string
  room: string
  state: string
  destination: RoomPosition
}

// memory extension (samples, cont.)
interface Memory {
  uuid: number
  log: any
}

// `global` extension (samples)
declare namespace NodeJS {
  interface Global {
    log: any
  }
}
