export type ItemCategory = "Weapons" | "Armor" | "Consumables" | "Materials" | "Quest";
export type ItemRarity = "common" | "uncommon" | "rare" | "epic";

export type EquipSlot =
  | "weapon"
  | "armor"
  | "head"
  | "gloves"
  | "boots"
  | "necklace"
  | "ring1"
  | "ring2";

export type EquipmentSlots = Record<EquipSlot, string | null>;

export type Item = {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  icon: string;
  count: number;
  attack?: number;
  defense?: number;
  crit?: number;
  heal?: number;
  mana?: number;
  description: string;
  equipSlot?: EquipSlot;
};

export type BaseStats = {
  attack: number;
  defense: number;
  crit: number;
  maxHp: number;
  maxMp: number;
};

export type CalculatedStats = BaseStats;

export type Character = {
  name: string;
  classTitle: string;
  level: number;
  xp: number;
  maxXp: number;
  hp: number;
  mp: number;
  baseStats: BaseStats;
  calculatedStats: CalculatedStats;
};

export type Currencies = {
  gold: number;
  crystals: number;
};

export type LogChannel = "System" | "World" | "Combat";

export type LogMessage = {
  id: string;
  channel: LogChannel;
  text: string;
  timestamp: number;
};

export type EnemyTemplate = {
  name: string;
  maxHp: number;
  attack: number;
  xp: number;
  icon: string;
  flavor: string;
};

export type Enemy = EnemyTemplate & { hp: number };

export type CombatState = {
  enemy: Enemy | null;
  cooldowns: Record<string, number>;
  result: "victory" | "defeat" | null;
};

export type Location = {
  name: string;
  region: string;
  coordinates: { x: number; y: number };
  notice: string;
};

export type Quest = {
  label: string;
  title: string;
  objective: string;
};

export type GameState = {
  character: Character;
  equipment: EquipmentSlots;
  inventory: Item[];
  currencies: Currencies;
  activeLocation: Location;
  activeQuest: Quest;
  combat: CombatState;
  logs: LogMessage[];
  bagCapacity: number;
};
