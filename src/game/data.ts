export type ItemCategory = "Weapons" | "Armor" | "Consumables" | "Materials" | "Quest";
export type Item = {
  id: string;
  name: string;
  category: ItemCategory;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "epic";
  count: number;
  attack?: number;
  defense?: number;
  crit?: number;
  heal?: number;
  mana?: number;
  description: string;
};

export type Skill = {
  id: string;
  name: string;
  key: string;
  icon: string;
  mana: number;
  cooldown: number;
  multiplier: number;
  description: string;
};

export const initialItems: Item[] = [
  { id: "moonsteel", name: "Moonsteel Sword", category: "Weapons", icon: "⚔", rarity: "rare", count: 1, attack: 18, crit: 5, description: "A silver blade tempered beneath the hollow moon." },
  { id: "dagger", name: "Iron Dagger", category: "Weapons", icon: "🗡", rarity: "common", count: 1, attack: 9, crit: 9, description: "A quick, practical blade favored by ridge bandits." },
  { id: "ashen", name: "Ashen Blade", category: "Weapons", icon: "♠", rarity: "epic", count: 1, attack: 28, crit: 3, description: "Embers pulse beneath its blackened edge." },
  { id: "wanderer", name: "Wanderer's Raiment", category: "Armor", icon: "♜", rarity: "uncommon", count: 1, defense: 12, description: "Layered leather and silk for the long road." },
  { id: "moonlit-boots", name: "Moonlit Boots", category: "Armor", icon: "♞", rarity: "rare", count: 1, defense: 7, crit: 2, description: "Soft-stepping boots touched by silver light." },
  { id: "health-potion", name: "Crimson Potion", category: "Consumables", icon: "♥", rarity: "common", count: 4, heal: 120, description: "Restores 120 health." },
  { id: "silverleaf-potion", name: "Silverleaf Potion", category: "Consumables", icon: "✦", rarity: "uncommon", count: 2, mana: 75, description: "Restores 75 mana." },
  { id: "wild-herb", name: "Wild Herb", category: "Materials", icon: "☘", rarity: "common", count: 3, description: "A hardy medicinal herb from the ridge." },
  { id: "iron-ore", name: "Iron Ore", category: "Materials", icon: "◆", rarity: "common", count: 2, description: "Dense ore veined with dark metal." },
  { id: "silverleaf", name: "Silverleaf", category: "Materials", icon: "❧", rarity: "rare", count: 1, description: "A luminous leaf used by temple alchemists." },
  { id: "hollow-scroll", name: "Hollow Moon Scroll", category: "Quest", icon: "▤", rarity: "epic", count: 1, description: "Its ink rearranges itself in moonlight." },
];

export const skills: Skill[] = [
  { id: "quick", name: "Quick Slash", key: "1", icon: "╱", mana: 0, cooldown: 0, multiplier: 1, description: "A swift, reliable cut." },
  { id: "power", name: "Power Strike", key: "3", icon: "⚡", mana: 24, cooldown: 2, multiplier: 1.65, description: "A heavy strike with high damage." },
  { id: "moonveil", name: "Moonveil", key: "4", icon: "☽", mana: 36, cooldown: 3, multiplier: 1.35, description: "Moonlit steel with increased critical chance." },
  { id: "shadow", name: "Shadow Step", key: "5", icon: "✣", mana: 18, cooldown: 2, multiplier: 1.2, description: "Strike from the enemy's blind side." },
];

export const enemies = [
  { name: "Ridge Bandit", maxHp: 210, attack: 26, xp: 220, icon: "♠", flavor: "A masked outlaw draws steel beneath the pines." },
  { name: "Ashen Wolf", maxHp: 175, attack: 31, xp: 190, icon: "♞", flavor: "An ember-eyed wolf prowls from the silver mist." },
  { name: "Hollow Guardian", maxHp: 285, attack: 35, xp: 310, icon: "♜", flavor: "Ancient armor awakens with an empty blue flame." },
] as const;