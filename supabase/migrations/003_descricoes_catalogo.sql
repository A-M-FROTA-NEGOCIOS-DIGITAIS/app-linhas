-- Descricoes da Estante.
--
-- Ate aqui o catalogo tinha so o nome de cada produto, e "Leitura Mestra" nao
-- diz a ninguem o que ela vai receber. Cada texto abaixo descreve a entrega
-- concreta, nao a promessa: o que chega, em que formato, e o que exige dela.
--
-- Sao editaveis pelo dashboard sem deploy. Se mudar o nome do produto na
-- plataforma de pagamento, mude aqui junto.

update public.produtos_catalogo set descricao =
  'Vai fundo onde a Leitura Completa parou. Nenhuma frase se repete: Aurora parte da sua Marca Adormecida e mostra de onde ela veio.'
  where produto = 'mestra';

update public.produtos_catalogo set descricao =
  'A leitura de quem você ama, cruzada com a sua. Você informa o nome e a data de nascimento dele; Aurora mostra o que os dois padrões fazem quando se encontram.'
  where produto = 'quem_ama';

update public.produtos_catalogo set descricao =
  'Os seus próximos doze meses, um a um. Cada mês com o seu próprio movimento — nenhum repete o anterior.'
  where produto = '12meses';

update public.produtos_catalogo set descricao =
  'O encaixe entre a sua mão e a de outra pessoa: onde vocês se sustentam e onde se desgastam.'
  where produto = 'compatibilidade';

update public.produtos_catalogo set descricao =
  'A mão que você não usa para escrever guarda o que você trouxe, não o que construiu. Aurora compara as duas e mede a distância entre elas. Exige um segundo scan.'
  where produto = 'outra_mao';

update public.produtos_catalogo set descricao =
  'A sua leitura na voz da Madame Aurora. Para ouvir com os olhos fechados, sem tela.'
  where produto = 'audio';

update public.produtos_catalogo set descricao =
  'O que fazer com o que você descobriu. Um protocolo prático construído a partir da sua Marca — não é meditação genérica.'
  where produto = 'ritual';

update public.produtos_catalogo set descricao =
  'O capítulo isolado sobre a sua Marca Adormecida: como ela nasceu e o que a mantém viva.'
  where produto = 'downsell';

update public.produtos_catalogo set descricao =
  'Uma frase só, tirada da sua leitura, em uma imagem para guardar ou compartilhar.'
  where produto = 'sentenca';

-- O Despertar entra no catalogo. Ate agora ele era um botao fixo no codigo da
-- Estante, sem descricao e sem lugar para o link de checkout. Assinatura, entao
-- o status vem da tabela assinaturas, nao de compras — a Estante trata isso.
insert into public.produtos_catalogo (produto, nome, descricao, preco_brl, ordem) values
  ('despertar', 'O Despertar',
   'A sua mão muda. A cada três meses Aurora relê as suas linhas e escreve o que se moveu. Exige a Leitura Mestra.',
   null, 10)
on conflict (produto) do update
  set nome = excluded.nome,
      descricao = excluded.descricao,
      ordem = excluded.ordem,
      updated_at = now();
