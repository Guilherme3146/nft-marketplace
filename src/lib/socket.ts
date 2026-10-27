import type { Socket } from 'socket.io-client'

let instance: Socket | undefined
let pending: Promise<Socket> | undefined

export function getSocket(): Promise<Socket> {
  if (instance) return Promise.resolve(instance)
  if (!pending) {
    pending = import('socket.io-client').then(({ io }) => {
      instance = io({ transports: ['websocket'] })
      return instance
    })
  }
  return pending
}
