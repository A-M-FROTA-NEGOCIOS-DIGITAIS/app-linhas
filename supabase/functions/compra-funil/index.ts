// compra-funil · recebe do funil de vendas (quiz.almaurora.com) cada compra feita na
// Hotmart e deixa o app pronto para a pessoa entrar.
//
// Chamado só pelo webhook da Hotmart do funil, com o segredo FUNIL_APP_SECRET no header
// x-funil-secret. Para cada compra:
// 1. acha a conta pelo e-mail da compra; se não existe e a compra foi aprovada, cria
//    (sem mandar e-mail: a pessoa entra em almaurora.com com o código por e-mail)
// 2. registra a compra em `compras` (chave hotmart:<transação>, idempotente); reembolso
//    e cancelamento só atualizam o status, o que tira o acesso
// 3. na primeira vez que vê a compra da Leitura Completa, grava o que veio do funil:
//    nome e nascimento no perfil, quiz e leitura da mão em `sessoes` e a leitura pronta
//    em `readings`. Com o nome preenchido, o app não pede o quiz de novo.
// 4. com a compra aprovada, manda gerar em segundo plano todo produto automático que a
//    pessoa comprou e ainda não tem (Mestra, Ano Interior, Capítulo, Ritual, Sentença,
//    Áudio). Um upsell que chega antes da leitura completa falha e é gerado de novo na
//    próxima compra aprovada ou quando a pessoa abre a Estante.
//
// Deploy: supabase functions deploy compra-funil --no-verify-jwt
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { lerPedido, textoCompleto, chaveTransacao, dataValida, segredoValido } from './logica.ts'
import { dispararGeracoes } from '../_shared/produtos.ts'

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, motivo: 'método não permitido' }, 405)

  const segredo = Deno.env.get('FUNIL_APP_SECRET') ?? ''
  if (!segredo) {
    console.error('[compra-funil] FUNIL_APP_SECRET não configurado')
    return json({ ok: false, motivo: 'não configurado' }, 500)
  }
  if (!segredoValido(req.headers.get('x-funil-secret'), segredo)) {
    return json({ ok: false, motivo: 'não autorizado' }, 401)
  }

  const lido = lerPedido(await req.json().catch(() => null))
  if (!lido.ok) return json({ ok: false, motivo: lido.motivo }, 400)
  const p = lido.pedido

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    // 1. conta
    const { data: existente, error: erroBusca } = await supabase.rpc('user_id_por_email', { p_email: p.email })
    if (erroBusca) throw erroBusca
    let userId = (existente as string | null) ?? null
    let contaCriada = false
    if (!userId) {
      if (p.status !== 'aprovado') return json({ ok: true, ignorado: 'sem conta para atualizar' })
      const { data: criado, error: erroCriar } = await supabase.auth.admin.createUser({
        email: p.email,
        email_confirm: true,
      })
      if (erroCriar) throw erroCriar
      userId = criado.user.id
      contaCriada = true
    }
    // O perfil nasce por gatilho junto com o usuário; guarda o e-mail nele.
    await supabase.from('profiles').update({ email: p.email }).eq('id', userId).is('email', null)

    // 2. compra
    const chave = chaveTransacao(p.transacao)
    const { data: compraAntes } = await supabase.from('compras').select('id').eq('bluen_tx_id', chave).maybeSingle()
    const { data: compra, error: erroCompra } = await supabase
      .from('compras')
      .upsert(
        {
          user_id: userId,
          bluen_tx_id: chave,
          produto: p.produto,
          valor_brl: p.valor,
          status: p.status,
          payload_bluen: { origem: 'funil-hotmart', transacao: p.transacao },
        },
        { onConflict: 'bluen_tx_id' },
      )
      .select('id')
      .single()
    if (erroCompra) throw erroCompra

    // 3. dados do funil, só na primeira vez que a compra principal aprovada aparece
    let dadosAplicados = false
    if (!compraAntes && p.status === 'aprovado' && p.produto === 'leitura_core' && p.dados) {
      const d = p.dados
      const perfil: Record<string, unknown> = {}
      if (d.nome) perfil.name = d.nome
      const nascimento = dataValida(d.data_nascimento)
      if (nascimento) perfil.date_of_birth = nascimento
      if (d.marca_adormecida) perfil.marca_adormecida = d.marca_adormecida
      if (Object.keys(perfil).length) {
        const { error } = await supabase.from('profiles').update(perfil).eq('id', userId)
        if (error) throw error
      }

      const temLeitura = !!d.capitulos?.length
      const { data: sessao, error: erroSessao } = await supabase
        .from('sessoes')
        .insert({
          user_id: userId,
          respostas: d.respostas_quiz,
          analise_visual: d.analise_palma,
          marca_adormecida: d.marca_adormecida,
          status: temLeitura ? 'concluida' : 'pendente',
        })
        .select('id')
        .single()
      if (erroSessao) throw erroSessao

      if (temLeitura) {
        const completo = textoCompleto(d.capitulos!)
        const { error } = await supabase.from('readings').insert({
          user_id: userId,
          sessao_id: sessao.id,
          compra_id: compra.id,
          reading_type: 'core',
          produto: 'leitura_core',
          capitulos: d.capitulos,
          full_content: completo,
          preview_content: completo.slice(0, 400),
          word_count: completo.split(/\s+/).length,
          qualidade_aprovada: true,
          tentativas_qualidade: 0,
        })
        if (error) throw error
      }
      // Sem capítulos (motor do funil falhou), a sessão fica pendente e o app gera a
      // leitura com o gerar-leitura a partir do quiz e da leitura da mão.
      dadosAplicados = true
    }

    // 4. gera os produtos automáticos comprados (o gerar-produto ignora o que já existe)
    if (p.status === 'aprovado') {
      const { data: compradas } = await supabase
        .from('compras').select('produto').eq('user_id', userId).eq('status', 'aprovado')
      const produtos = (compradas ?? []).map((c: { produto: string }) => c.produto)
      const disparo = dispararGeracoes(produtos, {
        userId,
        supabaseUrl: Deno.env.get('SUPABASE_URL')!,
        chaveServico: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      })
      if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(disparo)
      else await disparo
    }

    console.log(
      `[compra-funil] ${p.transacao} ${p.produto} ${p.status} → ${userId}` +
        `${contaCriada ? ' (conta criada)' : ''}${dadosAplicados ? ' (dados do funil gravados)' : ''}`,
    )
    return json({ ok: true, user_id: userId, conta_criada: contaCriada, dados_aplicados: dadosAplicados })
  } catch (e) {
    // 500 faz o funil (e a Hotmart) tentarem de novo; tudo acima é idempotente.
    console.error(`[compra-funil] falha em ${p.transacao}:`, e)
    return json({ ok: false, motivo: 'falha ao gravar' }, 500)
  }
})
