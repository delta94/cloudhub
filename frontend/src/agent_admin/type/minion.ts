export interface Minion {
  host: string
  ip?: string
  os?: string
  osVersion?: string
  status: string
  isRunning?: boolean
  isInstall?: boolean
  isSaveFile?: string
  isAccept?: boolean
  isCheck?: boolean
}

export interface MinionsObject {
  [x: string]: Minion
}
