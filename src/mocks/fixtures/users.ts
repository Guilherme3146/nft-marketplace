export interface UserFixture {
  id: string
  name: string
  email: string
  password: string
  username: string
  ensName: string
  walletNickname: string
  avatarUrl?: string
}

export const userFixtures: UserFixture[] = [
  {
    id: 'user-1',
    name: 'Ana Collector',
    email: 'ana@kurio.test',
    password: 'mock1234',
    username: 'ana.collector',
    ensName: 'ana',
    walletNickname: 'Carteira principal',
  },
  {
    id: 'user-2',
    name: 'Bruno Criador',
    email: 'bruno@kurio.test',
    password: 'mock1234',
    username: 'bruno.criador',
    ensName: 'bruno',
    walletNickname: 'Carteira principal',
  },
]
