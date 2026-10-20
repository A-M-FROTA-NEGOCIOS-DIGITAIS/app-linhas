import React from 'react'
import ReactDOM from 'react-dom/client'
import { createPortal } from 'react-dom'
import { App } from './App'
import { AuroraFundo } from '@/components/ui/AuroraFundo'
import './index.css'
import { initAnalytics } from '@/lib/analytics'
import '@/lib/i18n'

initAnalytics()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

// Só em desenvolvimento: ?preview=<tela> mostra uma tela isolada com dados de exemplo,
// para conferir o visual contra as referências do design sem passar pelo login.
const preview = import.meta.env.DEV ? new URLSearchParams(location.search).get('preview') : null
const Raiz = preview
  ? React.lazy(() => import('./dev/Preview').then((m) => ({ default: () => <m.Preview tela={preview} /> })))
  : App

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Fundo aurora: fora do #root (portal no body), atrás de todas as telas */}
    {createPortal(<AuroraFundo />, document.body)}
    <React.Suspense fallback={null}>
      <Raiz />
    </React.Suspense>
  </React.StrictMode>,
)
