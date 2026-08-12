import { useCallback, useEffect, useRef } from 'react'
import { salvarCapitulo } from '@/lib/progresso'

/**
 * Os leitores mostram todos os capitulos numa rolagem so, entao nao existe
 * evento de "trocou de capitulo". Isto observa quais capitulos entram na tela e
 * guarda o mais avancado que a pessoa alcancou.
 *
 * Devolve uma funcao que produz o ref-callback de cada capitulo:
 *   <div ref={registrar(i)}>
 */
export function useProgressoCapitulo(readingId: string | null, inicial: number) {
  const progresso = useRef(inicial)
  const indices = useRef(new Map<Element, number>())
  const observer = useRef<IntersectionObserver | null>(null)

  useEffect(() => { progresso.current = inicial }, [inicial])

  useEffect(() => {
    if (!readingId || typeof IntersectionObserver === 'undefined') return

    const obs = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue
          const indice = indices.current.get(entrada.target)
          if (indice == null) continue
          void salvarCapitulo(readingId, indice, progresso.current)
            .then((valor) => { progresso.current = valor })
        }
      },
      { threshold: 0.5 },
    )
    observer.current = obs
    for (const el of indices.current.keys()) obs.observe(el)

    return () => { obs.disconnect(); observer.current = null }
  }, [readingId])

  const registrar = useCallback(
    (indice: number) => (el: HTMLElement | null) => {
      if (!el) return
      indices.current.set(el, indice)
      observer.current?.observe(el)
    },
    [],
  )

  return registrar
}
