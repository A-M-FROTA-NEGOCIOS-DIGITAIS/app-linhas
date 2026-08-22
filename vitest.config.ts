import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // src/lib/supabase.ts chama createClient no carregamento do modulo, e
    // createClient('') lanca excecao. Sem isto, qualquer teste que importe
    // (mesmo indiretamente) o cliente quebra antes de rodar. Valores falsos de
    // proposito: nenhum teste deve tocar a rede.
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'chave-falsa-de-teste',
    },
  },
})
