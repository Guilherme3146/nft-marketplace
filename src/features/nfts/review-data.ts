export interface NftReview {
  author: string;
  stars: number;
  comment: string;
}

const REVIEWERS = [
  { author: "Marina Costa", comment: "Peça incrível, chegou exatamente como descrito." },
  { author: "Theo Park", comment: "Ótima qualidade de metadados e procedência clara." },
  { author: "Ayumi Sato", comment: "Coleção impecável, recomendo a todos os colecionadores." },
  { author: "Lucas Brandt", comment: "Transação rápida e segura na rede Ethereum." },
  { author: "Nadia Rahman", comment: "Arte linda, autenticidade verificada sem problemas." },
  { author: "Iris Vega", comment: "Suporte do criador muito atencioso durante a compra." },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getReviewCount(nftId: string): number {
  return 5 + (hashString(nftId) % 36);
}

export function getReviews(nftId: string): NftReview[] {
  const hash = hashString(nftId);
  const count = 2 + (hash % 2);

  return Array.from({ length: count }, (_, i) => {
    const reviewer = REVIEWERS[(hash + i * 7) % REVIEWERS.length];
    return {
      author: reviewer.author,
      comment: reviewer.comment,
      stars: 4 + ((hash + i) % 2),
    };
  });
}
