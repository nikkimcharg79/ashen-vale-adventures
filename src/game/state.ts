import { useCallback, useMemo, useReducer } from "react";
import { initialItems } from "./data";
import type {
  BaseStats,
  CalculatedStats,
  EnemyTemplate,
  EquipSlot,
  EquipmentSlots,
  GameState,
  Item,
  LogChannel,
} from "./types";

const emptyEquipment: EquipmentSlots = {
  weapon: null,
  armor: null,
  head: null,
  gloves: null,
  boots: null,
  necklace: null,
  ring1: null,
  ring2: null,
};

const baseStats: BaseStats = {
  attack: 34,
  defense: 18,
  crit: 8,
  maxHp: 428,
  maxMp: 163,
};

/** Pure stat evaluation: base stats plus every equipped item's contribution. */
export function calculateStats(
  stats: BaseStats,
  equipment: EquipmentSlots,
  inventory: Item[],
): CalculatedStats {
  const equipped = Object.values(equipment)
    .filter((id): id is string => Boolean(id))
    .map((id) => inventory.find((item) => item.id === id))
    .filter((item): item is Item => Boolean(item));

  return equipped.reduce<CalculatedStats>(
    (total, item) => ({
      attack: total.attack + (item.attack ?? 0),
      defense: total.defense + (item.defense ?? 0),
      crit: total.crit + (item.crit ?? 0),
      maxHp: total.maxHp,
      maxMp: total.maxMp,
    }),
    { ...stats },
  );
}

let logSeed = 0;
const makeLog = (channel: LogChannel, text: string) => ({
  id: `log-${++logSeed}`,
  channel,
  text,
  timestamp: Date.now(),
});

function withStats(state: GameState): GameState {
  const calculatedStats = calculateStats(
    state.character.baseStats,
    state.equipment,
    state.inventory,
  );
  return {
    ...state,
    character: {
      ...state.character,
      calculatedStats,
      hp: Math.min(state.character.hp, calculatedStats.maxHp),
      mp: Math.min(state.character.mp, calculatedStats.maxMp),
    },
  };
}

export const initialGameState: GameState = withStats({
  character: {
    name: "Nikki",
    classTitle: "Wanderer",
    level: 12,
    xp: 4320,
    maxXp: 12800,
    hp: baseStats.maxHp,
    mp: baseStats.maxMp,
    baseStats,
    calculatedStats: baseStats,
  },
  equipment: { ...emptyEquipment, weapon: "moonsteel", armor: "wanderer" },
  inventory: initialItems,
  currencies: { gold: 2450, crystals: 380 },
  activeLocation: {
    name: "Moonlit Ridge",
    region: "Valley of Whispers",
    coordinates: { x: 128, y: 76 },
    notice: "A narrow pass overlooks the distant temple city.",
  },
  activeQuest: {
    label: "Main Quest",
    title: "The Hollow Moon",
    objective: "Investigate the strange lights in the valley.",
  },
  combat: { enemy: null, cooldowns: {}, result: null },
  logs: [
    makeLog("System", "You have entered Moonlit Ridge."),
    makeLog("System", "Gained 120 experience."),
    makeLog("World", "Kaei: LFG temple city run"),
  ],
  bagCapacity: 40,
});

type Action =
  | { type: "EQUIP"; itemId: string }
  | { type: "UNEQUIP"; slot: EquipSlot }
  | { type: "USE_ITEM"; itemId: string }
  | { type: "ADD_ITEM"; item: Item }
  | { type: "GAIN_XP"; amount: number }
  | { type: "MODIFY_CURRENCIES"; gold: number; crystals: number }
  | { type: "MODIFY_HP"; delta: number }
  | { type: "MODIFY_MP"; delta: number }
  | { type: "ADD_LOG"; channel: LogChannel; text: string }
  | { type: "SET_NOTICE"; text: string }
  | { type: "START_COMBAT"; enemy: EnemyTemplate }
  | { type: "SPEND_SKILL"; skillId: string; mana: number; cooldown: number }
  | { type: "DAMAGE_ENEMY"; damage: number }
  | { type: "DAMAGE_PLAYER"; damage: number }
  | { type: "END_COMBAT" };

function levelUp(state: GameState, amount: number): GameState {
  let { xp, maxXp, level, baseStats: stats } = state.character;
  const logs = [...state.logs];
  xp += amount;
  while (xp >= maxXp) {
    xp -= maxXp;
    level += 1;
    maxXp = Math.round(maxXp * 1.35);
    stats = {
      ...stats,
      attack: stats.attack + 3,
      defense: stats.defense + 2,
      maxHp: stats.maxHp + 40,
      maxMp: stats.maxMp + 15,
    };
    logs.push(makeLog("System", `Level up! Nikki is now level ${level}.`));
  }
  const next = withStats({
    ...state,
    logs,
    character: { ...state.character, xp, maxXp, level, baseStats: stats },
  });
  return {
    ...next,
    character: {
      ...next.character,
      hp: level > state.character.level ? next.character.calculatedStats.maxHp : next.character.hp,
      mp: level > state.character.level ? next.character.calculatedStats.maxMp : next.character.mp,
    },
  };
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "EQUIP": {
      const item = state.inventory.find((entry) => entry.id === action.itemId);
      if (!item?.equipSlot) return state;
      return withStats({
        ...state,
        equipment: { ...state.equipment, [item.equipSlot]: item.id },
      });
    }
    case "UNEQUIP":
      return withStats({
        ...state,
        equipment: { ...state.equipment, [action.slot]: null },
      });
    case "USE_ITEM": {
      const item = state.inventory.find((entry) => entry.id === action.itemId);
      if (!item || item.category !== "Consumables" || item.count < 1) return state;
      const { maxHp, maxMp } = state.character.calculatedStats;
      return {
        ...state,
        character: {
          ...state.character,
          hp: Math.min(maxHp, state.character.hp + (item.heal ?? 0)),
          mp: Math.min(maxMp, state.character.mp + (item.mana ?? 0)),
        },
        inventory: state.inventory
          .map((entry) => (entry.id === item.id ? { ...entry, count: entry.count - 1 } : entry))
          .filter((entry) => entry.count > 0),
      };
    }
    case "ADD_ITEM": {
      const found = state.inventory.find((entry) => entry.id === action.item.id);
      return withStats({
        ...state,
        inventory: found
          ? state.inventory.map((entry) =>
              entry.id === action.item.id
                ? { ...entry, count: entry.count + action.item.count }
                : entry,
            )
          : [...state.inventory, action.item],
      });
    }
    case "GAIN_XP":
      return levelUp(state, action.amount);
    case "MODIFY_CURRENCIES":
      return {
        ...state,
        currencies: {
          gold: Math.max(0, state.currencies.gold + action.gold),
          crystals: Math.max(0, state.currencies.crystals + action.crystals),
        },
      };
    case "MODIFY_HP": {
      const hp = Math.max(
        0,
        Math.min(state.character.calculatedStats.maxHp, state.character.hp + action.delta),
      );
      return {
        ...state,
        character: { ...state.character, hp },
        combat:
          hp === 0 && state.combat.enemy ? { ...state.combat, result: "defeat" } : state.combat,
      };
    }
    case "MODIFY_MP":
      return {
        ...state,
        character: {
          ...state.character,
          mp: Math.max(
            0,
            Math.min(state.character.calculatedStats.maxMp, state.character.mp + action.delta),
          ),
        },
      };
    case "ADD_LOG":
      return {
        ...state,
        logs: [...state.logs.slice(-30), makeLog(action.channel, action.text)],
      };
    case "SET_NOTICE":
      return { ...state, activeLocation: { ...state.activeLocation, notice: action.text } };
    case "START_COMBAT":
      return {
        ...state,
        combat: {
          enemy: { ...action.enemy, hp: action.enemy.maxHp },
          cooldowns: {},
          result: null,
        },
      };
    case "SPEND_SKILL": {
      const cooldowns: Record<string, number> = {};
      for (const [key, value] of Object.entries(state.combat.cooldowns)) {
        cooldowns[key] = Math.max(0, value - 1);
      }
      if (action.cooldown) cooldowns[action.skillId] = action.cooldown;
      return {
        ...state,
        character: { ...state.character, mp: Math.max(0, state.character.mp - action.mana) },
        combat: { ...state.combat, cooldowns },
      };
    }
    case "DAMAGE_ENEMY": {
      const enemy = state.combat.enemy;
      if (!enemy) return state;
      const hp = Math.max(0, enemy.hp - action.damage);
      if (hp > 0) return { ...state, combat: { ...state.combat, enemy: { ...enemy, hp } } };
      const defeated = {
        ...state,
        combat: { ...state.combat, enemy: { ...enemy, hp: 0 }, result: "victory" as const },
      };
      return levelUp(defeated, enemy.xp);
    }
    case "DAMAGE_PLAYER":
      return gameReducer(state, { type: "MODIFY_HP", delta: -action.damage });
    case "END_COMBAT": {
      const revive = state.combat.result === "defeat";
      return {
        ...state,
        character: revive
          ? {
              ...state.character,
              hp: state.character.calculatedStats.maxHp,
              mp: state.character.calculatedStats.maxMp,
            }
          : state.character,
        combat: { enemy: null, cooldowns: {}, result: null },
      };
    }
    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  const actions = useMemo(
    () => ({
      equipItem: (itemId: string) => dispatch({ type: "EQUIP", itemId }),
      unequipItem: (slot: EquipSlot) => dispatch({ type: "UNEQUIP", slot }),
      useItem: (itemId: string) => dispatch({ type: "USE_ITEM", itemId }),
      addItem: (item: Item) => dispatch({ type: "ADD_ITEM", item }),
      gainXp: (amount: number) => dispatch({ type: "GAIN_XP", amount }),
      modifyCurrencies: (gold: number, crystals: number) =>
        dispatch({ type: "MODIFY_CURRENCIES", gold, crystals }),
      modifyHp: (delta: number) => dispatch({ type: "MODIFY_HP", delta }),
      modifyMp: (delta: number) => dispatch({ type: "MODIFY_MP", delta }),
      addLog: (channel: LogChannel, text: string) => dispatch({ type: "ADD_LOG", channel, text }),
      setNotice: (text: string) => dispatch({ type: "SET_NOTICE", text }),
      startCombat: (enemy: EnemyTemplate) => dispatch({ type: "START_COMBAT", enemy }),
      spendSkill: (skillId: string, mana: number, cooldown: number) =>
        dispatch({ type: "SPEND_SKILL", skillId, mana, cooldown }),
      damageEnemy: (damage: number) => dispatch({ type: "DAMAGE_ENEMY", damage }),
      damagePlayer: (damage: number) => dispatch({ type: "DAMAGE_PLAYER", damage }),
      endCombat: () => dispatch({ type: "END_COMBAT" }),
    }),
    [],
  );

  const bagCount = useMemo(
    () => state.inventory.reduce((sum, item) => sum + item.count, 0),
    [state.inventory],
  );

  const equippedItem = useCallback(
    (slot: EquipSlot) => state.inventory.find((item) => item.id === state.equipment[slot]) ?? null,
    [state.inventory, state.equipment],
  );

  return { state, actions, bagCount, equippedItem };
}
