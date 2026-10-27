export interface UserFixture {
  id: string
  name: string
  email: string
  /** Texto puro só porque isso é um mock de estudo — nunca faça isso num backend real. */
  password: string
}

export const userFixtures: UserFixture[] = [
  { id: 'user-1', name: 'Ana Collector', email: 'ana@kurio.test', password: 'mock1234' },
  { id: 'user-2', name: 'Bruno Criador', email: 'bruno@kurio.test', password: 'mock1234' },
]
