import { ws } from "msw";
import { toSocketIo } from "@mswjs/socket.io-binding";
import { getDb, persistDb } from "../db";

const UPDATE_INTERVAL_MS = 4000;

/** Mesmo truque do apiPath: "*" casa qualquer origem (localhost, Vercel...). */
const realtimeChannel = ws.link("*/socket.io/*");

export const realtimeHandlers = [
  realtimeChannel.addEventListener("connection", (connection) => {
    const io = toSocketIo(connection);

    const interval = setInterval(() => {
      const db = getDb();
      if (db.nfts.length === 0) return;

      const nft = db.nfts[Math.floor(Math.random() * db.nfts.length)];
      nft.likes += 1;

      // 30% das vezes, simula também alguém comprando uma edição (estoque cai ao vivo).
      if (Math.random() < 0.3) {
        const inStock = nft.editions.filter((edition) => edition.available > 0);
        if (inStock.length > 0) {
          const edition = inStock[Math.floor(Math.random() * inStock.length)];
          edition.available -= 1;
          nft.available = nft.editions.reduce((sum, item) => sum + item.available, 0);
        }
      }

      nft.version += 1;
      persistDb();

      io.client.emit("nft:update", {
        id: nft.id,
        likes: nft.likes,
        available: nft.available,
        priceEth: nft.priceEth,
        version: nft.version,
      });
    }, UPDATE_INTERVAL_MS);

    connection.client.addEventListener("close", () => clearInterval(interval));
  }),
];
