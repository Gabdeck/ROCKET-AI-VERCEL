export const NICHOS = [
  { id: "barbearia", label: "Barbearia", desc: "Cortes, barba, estética masculina." },
  { id: "estetica", label: "Estética", desc: "Procedimentos faciais e corporais." },
  { id: "roupas", label: "Loja de roupas", desc: "Moda, coleções, lançamentos." },
  { id: "restaurante", label: "Restaurante", desc: "Gastronomia, delivery, cardápio." },
  { id: "academia", label: "Academia / Personal", desc: "Treinos, resultados, alunos." },
  { id: "dentista", label: "Dentista", desc: "Tratamentos, sorriso, prevenção." },
  { id: "imobiliaria", label: "Imobiliária", desc: "Imóveis, locação, venda." },
  { id: "confeitaria", label: "Confeitaria", desc: "Doces, bolos, encomendas." },
  { id: "outro", label: "Outro nicho", desc: "Defina seu próprio segmento." },
];

export const OBJETIVOS = [
  { id: "vender", label: "Vender mais", desc: "Posts para gerar compras, orçamentos e direct." },
  { id: "atrair", label: "Atrair seguidores", desc: "Conteúdo chamativo para alcance novo." },
  { id: "engajar", label: "Gerar engajamento", desc: "Curtidas, comentários, salvamentos." },
  { id: "promo", label: "Divulgar promoção", desc: "Descontos, combos, ofertas." },
  { id: "autoridade", label: "Mostrar autoridade", desc: "Confiança e domínio do assunto." },
  { id: "captar", label: "Captar clientes", desc: "Transformar seguidores em leads." },
];

export const TEMAS = [
  { id: "antes-depois", label: "Antes e depois", desc: "Mostre transformações reais e prove qualidade." },
  { id: "erros", label: "Erros comuns", desc: "Mostre erros do público para gerar atenção." },
  { id: "dicas", label: "Dicas rápidas", desc: "Ensine algo útil e gere confiança." },
  { id: "bastidores", label: "Bastidores", desc: "Mostre o ambiente e o processo." },
  { id: "oferta", label: "Oferta da semana", desc: "Chamada direta para agendamento ou promo." },
  { id: "prova", label: "Prova social", desc: "Clientes satisfeitos e depoimentos reais." },
];

export const IDEIAS = [
  {
    id: 1,
    titulo: "3 erros que deixam sua barba com aparência mal cuidada",
    explicacao: "Conteúdo educativo + provocação leve. Excelente para captar atenção e gerar agendamentos.",
    legenda:
      "Sua barba pode estar passando uma imagem errada sobre você. Às vezes o problema não é deixar crescer, é não cuidar do acabamento, do desenho e da hidratação.\n\nAqui na barbearia, a gente ajusta sua barba para combinar com seu rosto e deixar o visual mais limpo.\n\nChame no direct e agende seu horário.",
    hashtags: "#barbearia #barba #barbeiro #cuidadosmasculinos #visualmasculino",
    formato: "Carrossel",
  },
  {
    id: 2,
    titulo: "O corte certo muda tudo: veja a diferença",
    explicacao: "Antes e depois com foco em transformação visual rápida. Ideal para Reels curtos.",
    legenda:
      "Não é o cabelo, é o corte. Veja como o ajuste certo deixa o visual mais alinhado e moderno.\n\nAgende seu horário e venha sentir a diferença.",
    hashtags: "#corteperfeito #barbearia #antesedepois #visualmasculino",
    formato: "Vídeo",
  },
  {
    id: 3,
    titulo: "Bastidores: como cuidamos do seu visual",
    explicacao: "Mostra o processo, ambiente e cuidado — gera confiança para novos clientes.",
    legenda:
      "Cada detalhe importa. Da toalha quente ao acabamento da navalha, tudo pensado para você sair daqui se sentindo outro homem.\n\nReserve seu horário pelo direct.",
    hashtags: "#bastidores #barbearia #experiencia #cuidadomasculino",
    formato: "Foto",
  },
];

export const FREQUENCIAS = [
  { id: "2", label: "2 posts por semana", desc: "Mantenha o perfil ativo sem produzir muito." },
  { id: "3", label: "3 posts por semana", desc: "Frequência equilibrada para crescer." },
  { id: "5", label: "5 posts por semana", desc: "Acelere testes e crescimento." },
  { id: "7", label: "Todos os dias", desc: "Presença forte e constante." },
];

export const PERIODOS = [
  { id: "1s", label: "1 semana" },
  { id: "2s", label: "2 semanas" },
  { id: "1m", label: "1 mês" },
];

export const CRONOGRAMA_MOCK = [
  { dia: "Segunda", tema: "Erros comuns", formato: "Carrossel", titulo: "3 erros que deixam a barba mal cuidada", status: "Pendente" },
  { dia: "Quarta", tema: "Bastidores", formato: "Reels", titulo: "Como cuidamos do seu visual", status: "Em produção" },
  { dia: "Sexta", tema: "Oferta", formato: "Foto", titulo: "Combo corte + barba com 20% off", status: "Pronto" },
];

export const SLIDES_CARROSSEL = [
  "3 erros que deixam sua barba mal cuidada",
  "Erro 1: deixar crescer sem desenhar",
  "Erro 2: não hidratar os fios",
  "Erro 3: tentar alinhar em casa",
  "Quer uma barba alinhada de verdade? Chame no direct.",
];

export const ROTEIRO_VIDEO = [
  { cena: "Cena 1", acao: "Mostre o cabelo do cliente antes do corte.", texto: "Talvez o problema não seja seu cabelo..." },
  { cena: "Cena 2", acao: "Mostre o barbeiro cortando e fazendo o degradê.", texto: "Talvez seja o corte errado." },
  { cena: "Cena 3", acao: "Mostre o resultado final.", texto: "O corte certo muda tudo." },
  { cena: "Cena 4", acao: "Mostre o cliente saindo da cadeira.", texto: "Agenda aberta. Chame no direct." },
];

export const MEUS_CONTEUDOS = [
  { id: 1, titulo: "3 erros que deixam sua barba mal cuidada", tipo: "Carrossel", status: "Pronto para postar" },
  { id: 2, titulo: "Bastidores da barbearia", tipo: "Reels", status: "Em produção" },
  { id: 3, titulo: "Combo corte + barba", tipo: "Foto", status: "Ideia" },
  { id: 4, titulo: "Antes e depois do João", tipo: "Carrossel", status: "Publicado" },
];

// Pool de temas extras adicionados ao clicar em "Gerar mais temas".
// Servidos em blocos de 6 a cada clique (faz ciclo se acabar).
export const TEMAS_EXTRAS_POOL = [
  { id: "te1", label: "Corte que valoriza o rosto", desc: "Mostre como o corte certo melhora a aparência do cliente." },
  { id: "te2", label: "Barba desalinhada", desc: "Erros comuns que deixam a barba com cara de mal cuidada." },
  { id: "te3", label: "Agenda aberta da semana", desc: "Conteúdo direto para incentivar agendamentos." },
  { id: "te4", label: "Transformação real", desc: "Antes e depois para provar a qualidade do serviço." },
  { id: "te5", label: "Erro no degradê", desc: "Detalhes que fazem um degradê parecer mal feito." },
  { id: "te6", label: "Cliente inseguro com o visual", desc: "Como a barbearia ajuda o cliente a se sentir melhor." },
  { id: "te7", label: "Combo corte + barba", desc: "Pacote ideal para quem quer renovar o visual de uma vez." },
  { id: "te8", label: "Rotina de cuidados em casa", desc: "Ensine o cliente a manter o visual entre uma visita e outra." },
  { id: "te9", label: "Tipos de corte por rosto", desc: "Mini guia visual de cortes que combinam com cada formato de rosto." },
  { id: "te10", label: "Atendimento premium", desc: "Mostre o cuidado, a toalha quente e a experiência completa." },
  { id: "te11", label: "Produtos que usamos", desc: "Apresente pomadas e óleos e por que você confia neles." },
  { id: "te12", label: "Depoimento de cliente", desc: "Mostre um cliente satisfeito falando da experiência." },
];

// Ideias parecidas geradas ao clicar em "Gerar outra parecida".
export const IDEIAS_PARECIDAS: Record<number, Array<{
  titulo: string; explicacao: string; legenda: string; hashtags: string; formato: string;
}>> = {
  1: [
    {
      titulo: "3 sinais de que sua barba precisa de um barbeiro",
      explicacao: "Mesma lógica de erros, com gancho mais direto e urgente.",
      legenda: "Sua barba está mandando uns sinais bem claros. Pontas abertas, fios espetados e desenho sumido são sinais de que está na hora.\n\nChama no direct e vem alinhar.",
      hashtags: "#barba #barbearia #barbeiro #cuidadosmasculinos",
      formato: "Carrossel",
    },
    {
      titulo: "O erro que deixa sua barba com cara de desleixo",
      explicacao: "Foco em um único erro forte, ótimo para Reels curto.",
      legenda: "Existe um erro que sozinho destrói qualquer barba: deixar crescer sem desenhar. Veja como isso muda tudo.",
      hashtags: "#barba #estilo #barbearia #visualmasculino",
      formato: "Vídeo",
    },
    {
      titulo: "Sua barba está te envelhecendo?",
      explicacao: "Provocação leve que faz o público parar para pensar.",
      legenda: "Barba mal cuidada envelhece o rosto. A boa notícia: 30 minutos aqui resolvem.\n\nAgende seu horário.",
      hashtags: "#barba #barbearia #autoestima #estilomasculino",
      formato: "Foto",
    },
  ],
  2: [
    {
      titulo: "Antes e depois: o corte certo para o seu rosto",
      explicacao: "Variação direta com foco no formato do rosto.",
      legenda: "O corte ideal não é o da moda, é o que combina com você. Veja a diferença.",
      hashtags: "#corte #antesedepois #barbearia",
      formato: "Vídeo",
    },
    {
      titulo: "5 segundos de transformação",
      explicacao: "Reels rápido com corte seco antes/depois.",
      legenda: "Em 5 segundos você muda de cara. Marca seu horário?",
      hashtags: "#reels #barbearia #transformacao",
      formato: "Vídeo",
    },
    {
      titulo: "O detalhe que separa um corte comum de um corte bem feito",
      explicacao: "Educativo, mostrando acabamento.",
      legenda: "Está tudo nos detalhes: contorno, degradê e finalização. Veja por que isso muda o visual inteiro.",
      hashtags: "#barbearia #corteperfeito #detalhes",
      formato: "Carrossel",
    },
  ],
  3: [
    {
      titulo: "Um dia na barbearia em 30 segundos",
      explicacao: "Bastidores acelerados, ótimo para engajamento.",
      legenda: "Da primeira cadeira ao último cliente: um dia completo aqui.",
      hashtags: "#bastidores #barbearia #rotina",
      formato: "Vídeo",
    },
    {
      titulo: "Os 3 cuidados que fazem o cliente voltar",
      explicacao: "Mostra processo e diferenciais.",
      legenda: "Toalha quente, conversa boa e acabamento na navalha. É por isso que o cliente volta.",
      hashtags: "#experiencia #barbearia #atendimento",
      formato: "Carrossel",
    },
    {
      titulo: "Conheça quem cuida do seu visual",
      explicacao: "Apresentação do barbeiro, gera proximidade.",
      legenda: "Por trás de cada corte tem alguém que ama o que faz. Vem conhecer.",
      hashtags: "#barbeiro #barbearia #equipe",
      formato: "Foto",
    },
  ],
};

// Gera temas a partir de um texto livre do usuário (mock contextual simples).
export function gerarTemasDeTexto(texto: string): Array<{ id: string; label: string; desc: string }> {
  const t = texto.toLowerCase();
  const base: Array<{ id: string; label: string; desc: string }> = [];
  if (/engra|humor|divert|jovem/.test(t)) {
    base.push(
      { id: "g1", label: "O combo que salva o visual do fim de semana", desc: "Tom jovem e descontraído para vender corte + barba." },
      { id: "g2", label: "3 sinais de que você precisa cortar o cabelo urgente", desc: "Lista bem-humorada para gerar engajamento." },
      { id: "g3", label: "Quando a barba começa a pedir socorro", desc: "Provocação leve com chamada para agendamento." },
      { id: "g4", label: "Corte + barba: o pacote anti desleixo", desc: "Oferta direta com linguagem informal." },
    );
  }
  if (/vend|promo|oferta|combo/.test(t)) {
    base.push(
      { id: "v1", label: "Oferta relâmpago da semana", desc: "Combo com desconto e validade curta para gerar urgência." },
      { id: "v2", label: "Pacote pré evento", desc: "Para clientes que têm festa, casamento ou entrevista." },
    );
  }
  if (/educ|dica|ensin/.test(t)) {
    base.push(
      { id: "e1", label: "Mini guia: como manter o corte em casa", desc: "Carrossel educativo que aumenta autoridade." },
      { id: "e2", label: "O que não fazer com sua barba", desc: "Lista de erros comuns explicados de forma simples." },
    );
  }
  if (base.length === 0) {
    base.push(
      { id: "c1", label: `Tema sob medida: ${texto.slice(0, 40)}`, desc: "Tema gerado com base no que você descreveu." },
      { id: "c2", label: "Variação direta para o seu público", desc: "Mesmo assunto com gancho mais forte." },
      { id: "c3", label: "Versão para vender", desc: "Mesmo tema com chamada para ação clara." },
      { id: "c4", label: "Versão para engajar", desc: "Mesmo tema focado em comentários e salvamentos." },
    );
  }
  return base;
}

export function recomendarFormato(pergunta: string): {
  recomendado: "foto" | "carrossel" | "video";
  texto: string;
  alternativa: "foto" | "carrossel" | "video";
} {
  const t = pergunta.toLowerCase();
  if (/poucas? fotos|sem foto|nao tenho foto|não tenho foto/.test(t)) {
    return {
      recomendado: "carrossel",
      alternativa: "video",
      texto:
        "Para o seu caso, o melhor formato é carrossel. Como você tem poucas fotos, um carrossel educativo funciona bem porque depende mais de textos fortes e exemplos do que de imagens reais. Se conseguir gravar algo curto com o celular, um Reels mostrando o ambiente ou um corte também funciona.",
    };
  }
  if (/vender|venda|promo|oferta/.test(t)) {
    return {
      recomendado: "foto",
      alternativa: "carrossel",
      texto:
        "Para vender direto, foto única com chamada clara costuma performar melhor. Carrossel com 3 a 4 slides explicando o benefício também funciona bem se você quiser dar mais contexto antes da oferta.",
    };
  }
  if (/engaj|comenta|salv|alcance|seguidor/.test(t)) {
    return {
      recomendado: "video",
      alternativa: "carrossel",
      texto:
        "Para crescer alcance e engajamento, Reels curtos são o formato mais forte hoje. Como alternativa, um carrossel salvável (com dicas práticas) também gera muito engajamento sem precisar gravar nada.",
    };
  }
  return {
    recomendado: "carrossel",
    alternativa: "video",
    texto:
      "Para esse objetivo, carrossel costuma ser o formato mais versátil: você consegue explicar bem a ideia e ainda manter o post atrativo. Se quiser algo mais dinâmico, um Reels curto pode amplificar o alcance.",
  };
}

export function gerarCronograma(
  freqId: string,
  periodoId: string,
  preferencias: string,
): Array<{ semana: number; dia: string; tema: string; formato: string; titulo: string; status: string }> {
  const semanas = periodoId === "1s" ? 1 : periodoId === "2s" ? 2 : 4;
  const postsPorSemana = freqId === "7" ? 7 : Number(freqId);
  const t = preferencias.toLowerCase();

  const diasPadrao = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  const mapaDias: Array<[RegExp, string]> = [
    [/segunda/, "Segunda"], [/ter[çc]a/, "Terça"], [/quarta/, "Quarta"],
    [/quinta/, "Quinta"], [/sexta/, "Sexta"], [/s[áa]bado/, "Sábado"], [/domingo/, "Domingo"],
  ];
  const diasEscolhidos = mapaDias.filter(([rx]) => rx.test(t)).map(([, d]) => d);
  const dias = diasEscolhidos.length > 0
    ? diasEscolhidos
    : diasPadrao.slice(0, postsPorSemana);

  const evitaVideo = /sem v[íi]deo|nao quero v[íi]deo|não quero v[íi]deo|poucos? v[íi]deos|menos v[íi]deo/.test(t);
  const priCarrossel = /carross/.test(t);
  const priVendas = /vend|promo|oferta|combo|fim de semana/.test(t);
  const priEducativo = /educ|dica|ensin/.test(t);

  const blocos = [
    { tema: "Erros comuns", formato: "Carrossel", titulo: "3 erros que deixam a barba mal cuidada" },
    { tema: "Antes e depois", formato: "Foto", titulo: "Transformação de corte masculino" },
    { tema: "Corte ideal", formato: "Vídeo", titulo: "Você está usando o corte errado para o seu rosto?" },
    { tema: "Bastidores", formato: "Vídeo", titulo: "Um dia dentro da barbearia" },
    { tema: "Dica educativa", formato: "Carrossel", titulo: "Como manter o corte em casa" },
    { tema: "Oferta", formato: "Foto", titulo: "Combo corte + barba para o fim de semana" },
    { tema: "Prova social", formato: "Foto", titulo: "Depoimento de cliente satisfeito" },
  ];

  let pool = blocos.slice();
  if (evitaVideo) pool = pool.map((b) => b.formato === "Vídeo" ? { ...b, formato: "Carrossel" } : b);
  if (priCarrossel) pool.sort((a, b) => (b.formato === "Carrossel" ? 1 : 0) - (a.formato === "Carrossel" ? 1 : 0));
  if (priEducativo) pool.sort((a, b) => (b.tema.includes("Dica") || b.tema.includes("Erros") ? 1 : 0) - (a.tema.includes("Dica") || a.tema.includes("Erros") ? 1 : 0));

  const result: Array<{ semana: number; dia: string; tema: string; formato: string; titulo: string; status: string }> = [];
  for (let s = 1; s <= semanas; s++) {
    for (let i = 0; i < dias.length && i < postsPorSemana; i++) {
      const bloco = pool[(s * dias.length + i) % pool.length];
      const isFimDeSemana = dias[i] === "Sexta" || dias[i] === "Sábado" || dias[i] === "Domingo";
      const finalBloco = priVendas && isFimDeSemana
        ? { tema: "Oferta", formato: "Foto", titulo: "Combo corte + barba para o fim de semana" }
        : bloco;
      result.push({ semana: s, dia: dias[i], ...finalBloco, status: "Pendente" });
    }
  }
  return result;
}
