const MEDALLIONS = [
  {
    letter: "W",
    title: "Segurança da carteira",
    description: "Proteja sua carteira e colecione arte digital verificada com confiança.",
  },
  {
    letter: "C",
    title: "Criadores em destaque",
    description:
      "Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.",
  },
  {
    letter: "D",
    title: "Alertas de lançamentos",
    description:
      "Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.",
  },
];

const LINK_COLUMNS = [
  {
    title: "Meu perfil",
    items: ["Meu perfil", "Minha coleção", "Atividade", "Estúdio do criador", "Lista de interesse"],
  },
  {
    title: "Central de ajuda",
    items: [
      "Central de ajuda",
      "Como comprar NFTs",
      "Carteira e segurança",
      "Política do mercado",
      "Denunciar item",
    ],
  },
  {
    title: "Coleções",
    items: ["Arte digital", "Fotografia", "Música", "Arte 3D", "Utilidade"],
  },
];

const CURRENT_YEAR = new Date().getFullYear();

const SOCIAL_ICONS = [
  "/footer/social-1.svg",
  "/footer/social-2.svg",
  "/footer/social-3.svg",
  "/footer/social-4.svg",
  "/footer/social-5.svg",
];

export function Footer() {
  return (
    <footer className="mt-24 flex flex-col gap-px bg-card">
      <div className="grid grid-cols-1 gap-8 divide-border bg-card p-8 sm:grid-cols-2 sm:gap-10 sm:divide-x lg:grid-cols-4">
        {MEDALLIONS.map((medallion) => (
          <div key={medallion.letter} className="flex flex-col items-start gap-3 sm:pl-10">
            <div className="flex size-[74px] items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {medallion.letter}
            </div>
            <p className="font-bold text-foreground">{medallion.title}</p>
            <p className="max-w-[220px] text-sm leading-6 text-muted-foreground">
              {medallion.description}
            </p>
          </div>
        ))}

        <div className="flex flex-col items-start gap-4 sm:pl-10">
          <h2 className="text-lg font-bold text-foreground">Antecipe-se ao próximo lançamento</h2>
          <div className="flex w-full gap-2">
            <input
              type="email"
              disabled
              placeholder="digite seu e-mail..."
              className="h-10 min-w-0 flex-1 rounded-md border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="button"
              disabled
              className="h-10 w-[85px] shrink-0 rounded-md bg-primary text-sm font-bold text-primary-foreground opacity-60"
            >
              Enviar
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </div>
      </div>

      <div className="flex flex-col flex-wrap items-center justify-between gap-6 bg-surface-dark p-8 text-center sm:flex-row sm:text-left">
        <span className="text-lg font-bold tracking-[1.4px] text-foreground">KURIO</span>
        <p className="text-sm leading-6 text-muted-foreground">
          Feito para colecionadores,
          <br />
          criadores e cultura
        </p>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <a href="mailto:contato@email.com" className="hover:text-accent">
            contato@email.com
          </a>
          <span>+55 11 4002 8922</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 bg-card p-8 sm:grid-cols-2 lg:grid-cols-4">
        {LINK_COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-2">
            <h3 className="text-lg font-bold text-foreground">{column.title}</h3>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {column.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold text-foreground">Redes sociais</h3>
            <div className="flex items-center gap-2">
              {SOCIAL_ICONS.map((icon) => (
                <img key={icon} src={icon} alt="" aria-hidden="true" width={30} height={30} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold text-foreground">Carteiras compatíveis</h3>
            <span className="flex h-[26px] w-fit items-center rounded-md border border-border-soft bg-surface-dark px-3 text-[9px] font-bold tracking-[0.1px] text-accent">
              METAMASK • WALLETCONNECT • COINBASE
            </span>
          </div>
        </div>
      </div>

      <p className="bg-card py-6 text-center text-sm text-muted-foreground">
        © {CURRENT_YEAR} Kurio. Propriedade digital para todos.
      </p>
    </footer>
  );
}
