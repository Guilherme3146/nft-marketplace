export function CatalogHero() {
  return (
    <section className="flex flex-col items-center gap-8 rounded-xl bg-card p-8 md:flex-row md:items-center md:gap-10 md:p-10">
      <div className="flex flex-1 flex-col gap-4">
        <p className="text-sm font-bold tracking-[1.4px] text-accent">Bem-vindo à Kurio</p>
        <h1 className="text-3xl font-bold leading-tight text-foreground md:text-[43px] md:leading-[1.1]">
          SEJA DONO DO FUTURO
          <br />
          DA ARTE DIGITAL
        </h1>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
          digital rara, apoie artistas e tenha uma parte da cultura da internet.
        </p>
        <a
          href="#catalogo"
          className="mt-2 flex h-10 w-[140px] items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
        >
          EXPLORAR
        </a>
      </div>

      <img
        src="/nft-art/emerald-ape.jpg"
        alt="Arte digital em destaque"
        width={450}
        height={450}
        fetchPriority="high"
        decoding="async"
        className="aspect-square w-full max-w-[360px] rounded-2xl object-cover"
      />
    </section>
  );
}
