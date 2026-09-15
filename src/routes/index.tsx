import { createFileRoute } from "@tanstack/react-router";
import { GameClient } from "@/game/game-client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ASHEN VALE — Moonlit Ridge" },
      { name: "description", content: "Enter Moonlit Ridge in a playable fantasy MMORPG adventure." },
      { property: "og:title", content: "ASHEN VALE — Moonlit Ridge" },
      { property: "og:description", content: "Explore, fight, gather, and uncover the secret of the Hollow Moon." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <GameClient />;
}
