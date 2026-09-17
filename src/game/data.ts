import type { EnemyIntent, EnemyTemplate, Item, ItemCategory, Location, LocationId } from "./types";

export type { Item, ItemCategory };

export type Skill = {
  id: string;
  name: string;
  key: string;
  icon: string;
  mana: number;
  cooldown: number;
  multiplier: number;
  /** Posture damage dealt on a landed hit. */
  posture: number;
  kind: "attack" | "guard";
  /** Always crits against a staggered foe. */
  lunar?: boolean;
  description: string;
};

export const initialItems: Item[] = [
  {
    id: "moonsteel",
    name: "Moonsteel Sword",
    category: "Weapons",
    icon: "⚔",
    rarity: "rare",
    count: 1,
    attack: 18,
    crit: 5,
    posture: 6,
    equipSlot: "weapon",
    description: "A silver blade tempered beneath the hollow moon.",
    flavor: "Balanced reach. Rewards clean, measured openings.",
  },
  {
    id: "dagger",
    name: "Iron Dagger",
    category: "Weapons",
    icon: "🗡",
    rarity: "common",
    count: 1,
    attack: 9,
    crit: 9,
    posture: 3,
    equipSlot: "weapon",
    description: "A quick, practical blade favored by ridge bandits.",
    flavor: "Fast strikes, thin posture pressure. Punishes feints.",
  },
  {
    id: "ashen",
    name: "Ashen Blade",
    category: "Weapons",
    icon: "♠",
    rarity: "epic",
    count: 1,
    attack: 28,
    crit: 3,
    posture: 9,
    equipSlot: "weapon",
    description: "Embers pulse beneath its blackened edge.",
    flavor: "Heavy ember steel. Breaks guards, slow to recover.",
  },
  {
    id: "bandit-mace",
    name: "Bandit Mace",
    category: "Weapons",
    icon: "⚒",
    rarity: "uncommon",
    count: 1,
    attack: 22,
    posture: 16,
    equipSlot: "weapon",
    description: "A spiked iron head on a battered haft, taken from a mace bandit.",
    flavor: "Crushing weight. The finest posture breaker on the ridge.",
  },
  {
    id: "wanderer",
    name: "Wanderer's Raiment",
    category: "Armor",
    icon: "♜",
    rarity: "uncommon",
    count: 1,
    defense: 12,
    equipSlot: "armor",
    description: "Layered leather and silk for the long road.",
    flavor: "Quiet, road-worn, and surprisingly resilient.",
  },
  {
    id: "moonlit-boots",
    name: "Moonlit Boots",
    category: "Armor",
    icon: "♞",
    rarity: "rare",
    count: 1,
    defense: 7,
    crit: 2,
    equipSlot: "boots",
    description: "Soft-stepping boots touched by silver light.",
    flavor: "Silent footing helps you read a telegraph early.",
  },
  {
    id: "health-potion",
    name: "Crimson Potion",
    category: "Consumables",
    icon: "♥",
    rarity: "common",
    count: 4,
    heal: 120,
    description: "Restores 120 health.",
  },
  {
    id: "silverleaf-potion",
    name: "Silverleaf Potion",
    category: "Consumables",
    icon: "✦",
    rarity: "uncommon",
    count: 2,
    mana: 75,
    description: "Restores 75 mana.",
  },
  {
    id: "wild-herb",
    name: "Wild Herb",
    category: "Materials",
    icon: "☘",
    rarity: "common",
    count: 7,
    description: "A hardy medicinal herb from the ridge.",
  },
  {
    id: "iron-ore",
    name: "Iron Ore",
    category: "Materials",
    icon: "◆",
    rarity: "common",
    count: 2,
    description: "Dense ore veined with dark metal.",
  },
  {
    id: "silverleaf",
    name: "Silverleaf",
    category: "Materials",
    icon: "❧",
    rarity: "rare",
    count: 1,
    description: "A luminous leaf used by temple alchemists.",
  },
  {
    id: "hollow-scroll",
    name: "Hollow Moon Scroll",
    category: "Quest",
    icon: "▤",
    rarity: "epic",
    count: 1,
    description: "Its ink rearranges itself in moonlight.",
  },
];

export const skills: Skill[] = [
  {
    id: "quick",
    name: "Quick Slash",
    key: "1",
    icon: "╱",
    mana: 0,
    cooldown: 0,
    multiplier: 1,
    posture: 14,
    kind: "attack",
    description: "A swift, reliable cut that builds momentum.",
  },
  {
    id: "guard",
    name: "Guard / Parry",
    key: "Q",
    icon: "⛨",
    mana: 8,
    cooldown: 1,
    multiplier: 0,
    posture: 46,
    kind: "guard",
    description: "Brace against the telegraphed strike, then answer with heavy posture damage.",
  },
  {
    id: "power",
    name: "Power Strike",
    key: "3",
    icon: "⚡",
    mana: 24,
    cooldown: 2,
    multiplier: 1.65,
    posture: 40,
    kind: "attack",
    description: "A slow, heavy blow that shatters posture.",
  },
  {
    id: "moonveil",
    name: "Moonveil",
    key: "4",
    icon: "☽",
    mana: 36,
    cooldown: 3,
    multiplier: 1.4,
    posture: 22,
    kind: "attack",
    lunar: true,
    description: "Lunar steel. Always critical against a staggered foe.",
  },
  {
    id: "shadow",
    name: "Shadow Step",
    key: "5",
    icon: "✣",
    mana: 18,
    cooldown: 2,
    multiplier: 1.2,
    posture: 20,
    kind: "attack",
    description: "Strike from the enemy's blind side.",
  },
];

const intent = (
  id: string,
  name: string,
  telegraph: string,
  kind: EnemyIntent["kind"],
  multiplier: number,
): EnemyIntent => ({ id, name, telegraph, kind, multiplier });

export const enemies: EnemyTemplate[] = [
  {
    id: "dagger-bandit",
    name: "Dagger Bandit",
    maxHp: 320,
    maxPosture: 70,
    attack: 25,
    xp: 210,
    icon: "🗡",
    flavor: "A masked outlaw slips between the pines, blade already low.",
    trait: "Fast strikes and evasive feints. Thin posture.",
    intents: [
      intent("poisoned", "Poisoned Blade", "Aiming Poisoned Thrust", "pierce", 1.35),
      intent("feint", "Evasive Feint", "Slipping into a Feint", "defend", 0),
      intent("flurry", "Cutting Flurry", "Winding up a Cutting Flurry", "pierce", 1.15),
    ],
  },
  {
    id: "mace-bandit",
    name: "Mace Bandit",
    maxHp: 430,
    maxPosture: 100,
    attack: 31,
    xp: 265,
    icon: "⚒",
    flavor: "A broad outlaw drags a spiked mace across the stone path.",
    trait: "Heavy swings that crush armor. Slow, readable openings.",
    intents: [
      intent("crushing", "Crushing Blow", "Preparing Crushing Blow", "heavy", 1.6),
      intent("armor-crush", "Armor Crush", "Winding up Armor Crush", "heavy", 1.35),
      intent("brace", "Iron Brace", "Settling into Iron Brace", "defend", 0),
    ],
  },
  {
    id: "hollow-guardian",
    name: "Hollow Guardian",
    maxHp: 580,
    maxPosture: 145,
    attack: 34,
    xp: 335,
    icon: "♜",
    flavor: "Ancient armor awakens with an empty blue flame.",
    trait: "Armored construct with enormous posture. Punish its slams.",
    intents: [
      intent("aegis", "Aegis Slam", "Preparing Aegis Slam", "heavy", 1.55),
      intent("stance", "Defensive Stance", "Locking into Defensive Stance", "defend", 0),
      intent("hollow", "Hollow Sweep", "Charging a Hollow Sweep", "heavy", 1.25),
    ],
  },
];

export const locations: Record<LocationId, Location> = {
  "moonlit-ridge": {
    id: "moonlit-ridge",
    name: "Moonlit Ridge",
    region: "Valley of Whispers",
    coordinates: { x: 128, y: 76 },
    notice: "A narrow pass overlooks the distant temple city.",
  },
  "lantern-district": {
    id: "lantern-district",
    name: "The Lantern District",
    region: "Temple City",
    coordinates: { x: 214, y: 43 },
    notice:
      "Ten thousand paper lanterns sway over wet stone. Teahouse steam mixes with market smoke.",
  },
};

export type PartyBoardListing = {
  id: string;
  title: string;
  slots: string;
  needs: string;
};

export const partyBoard: PartyBoardListing[] = [
  {
    id: "moon-temple",
    title: "Moon Temple PQ",
    slots: "2/4",
    needs: "Need Healer / Support",
  },
  {
    id: "hollow-vault",
    title: "Hollow Vault Delve",
    slots: "3/4",
    needs: "Need Posture Breaker",
  },
  {
    id: "ridge-patrol",
    title: "Ridge Outlaw Patrol",
    slots: "1/4",
    needs: "Open to all wanderers",
  },
];

export type HubNpc = {
  id: string;
  name: string;
  role: string;
  icon: string;
  lines: string[];
};

export const hubNpcs: HubNpc[] = [
  {
    id: "oakhaven",
    name: "Lantern Keeper Oakhaven",
    role: "Teahouse",
    icon: "☕",
    lines: [
      "Oakhaven: Sit, wanderer. The lanterns burn brightest for those who survived the ridge.",
      "Oakhaven: Read the swing before you answer it. That is all mastery ever was.",
      "Oakhaven: Word from the temple: the hollow lights moved again last night.",
    ],
  },
  {
    id: "alchemist",
    name: "Wandering Alchemist",
    role: "Market",
    icon: "⚗",
    lines: [
      "Alchemist: Silverleaf for mana, crimson root for blood. Two coins, no haggling.",
      "Alchemist: A staggered foe drinks damage like dry earth drinks rain.",
      "Alchemist: I traded a mace off a bandit once. Heavy thing. Broke his guard, then mine.",
    ],
  },
];

export const ambientChatter: string[] = [
  "Yuna: anyone for the bandit camp near the ridge?",
  "Kael: LFG temple city run, 2 spots",
  "Sora: selling Moonlit Boots, fair price",
  "Haneul: guardian staggers on the second slam, watch the badge",
];
