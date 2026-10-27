/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" liga a API simulada (MSW). Veja .env.development e .env.production. */
  readonly VITE_ENABLE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
