import { useCallback, useMemo, useReducer } from "react";
import { initialItems, locations } from "./data";
import type {
  BaseStats,
  CalculatedStats,
  Enemy,
  EnemyIntent,
  EnemyTemplate,
  EquipSlot,
  EquipmentSlots,
  GameState,
  Item,
  LocationId,
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

/** Extra posture damage granted by the equipped weapon. */
export function postureBonus(equipment: EquipmentSlots, inventory: Item[]): number {
  const weapon = inventory.find((item) => item.id === equipment.weapon);
  return weapon?.posture ?? 0;
}

let logSeed = 0;
const makeLog = (channel: LogChannel, text: string) => ({
  id: `log-${++logSeed}`,
  channel,
  text,
  timestamp: Date.now(),
});

const pickIntent = (enemy: EnemyTemplate, roll: number): EnemyIntent =>
  enemy.intents[Math.floor(roll * enemy.intents.length) % enemy.intents.length] ??
  enemy.intents[0]!;

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

let chronicleSeed = 0;
function chronicle(state: GameState, id: string, title: string, detail: string): GameState {
  if (state.chronicle.some((entry) => entry.id === id)) return state;
  return {
    ...state,
    chronicle: [
      ...state.chronicle,
      { id, title, detail, timestamp: Date.now() + ++chronicleSeed },
    ],
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
  activeLocation: locations["moonlit-ridge"],
  activeQuest: {
    label: "Main Quest",
    title: "The Hollow Moon",
    objective: "Investigate the strange lights in the valley.",
  },
  combat: { enemy: null, cooldowns: {}, result: null, guarding: false, momentum: 0 },
  logs: [
    makeLog("System", "You have entered Moonlit Ridge."),
    makeLog("System", "Gained 120 experience."),
    makeLog("World", "Kaei: LFG temple city run"),
  ],
  chronicle: [
    {
      id: "awakening",
      title: "Awakening at Moonlit Ridge",
      detail: "Nikki woke beneath the hollow moon with no memory of the road behind her.",
      timestamp: Date.now(),
    },
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
  | { type: "ADD_CHRONICLE"; id: string; title: string; detail: string }
  | { type: "SET_NOTICE"; text: string }
  | { type: "TRAVEL"; location: LocationId }
  | { type: "START_COMBAT"; enemy: EnemyTemplate; roll: number }
  | { type: "SPEND_SKILL"; skillId: string; mana: number; cooldown: number }
  | { type: "GUARD" }
  | { type: "DAMAGE_ENEMY"; damage: number; posture: number }
  | { type: "ENEMY_TURN"; damageRoll: number; intentRoll: number }
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

function pushLog(state: GameState, channel: LogChannel, text: string): GameState {
  return { ...state, logs: [...state.logs.slice(-40), makeLog(channel, text)] };
}

/** Applies posture damage and flips the enemy into a staggered, vulnerable state at zero. */
function applyPosture(state: GameState, enemy: Enemy, amount: number): GameState {
  const posture = Math.max(0, enemy.posture - amount);
  if (posture > 0 || enemy.staggerTurns > 0) {
    return { ...state, combat: { ...state.combat, enemy: { ...enemy, posture } } };
  }
  const staggered = {
    ...state,
    combat: {
      ...state.combat,
      enemy: { ...enemy, posture: 0, staggerTurns: 1 },
    },
  };
  const logged = pushLog(
    staggered,
    "Combat",
    `${enemy.name} is STAGGERED! Its guard breaks — critical damage is guaranteed.`,
  );
  return chronicle(
    logged,
    "first-stagger",
    "First Stagger Executed",
    `Nikki shattered the posture of a ${enemy.name} and opened it for a killing blow.`,
  );
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
      return pushLog(state, action.channel, action.text);
    case "ADD_CHRONICLE":
      return chronicle(state, action.id, action.title, action.detail);
    case "SET_NOTICE":
      return { ...state, activeLocation: { ...state.activeLocation, notice: action.text } };
    case "TRAVEL": {
      const location = locations[action.location];
      const travelled = { ...state, activeLocation: location };
      const logged = pushLog(travelled, "System", `You arrive at ${location.name}.`);
      return action.location === "lantern-district"
        ? chronicle(
            logged,
            "lantern-entrance",
            "Entrance to Lantern District",
            "Nikki walked the lantern-lit stones of the temple city for the first time.",
          )
        : logged;
    }
    case "START_COMBAT": {
      const intent = pickIntent(action.enemy, action.roll);
      const enemy: Enemy = {
        ...action.enemy,
        hp: action.enemy.maxHp,
        posture: action.enemy.maxPosture,
        staggerTurns: 0,
        intent,
      };
      const started = {
        ...state,
        combat: { enemy, cooldowns: {}, result: null, guarding: false, momentum: 0 },
      };
      return pushLog(started, "Combat", `${enemy.name} is ${intent.telegraph}.`);
    }
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
    case "GUARD":
      return { ...state, combat: { ...state.combat, guarding: true } };
    case "DAMAGE_ENEMY": {
      const enemy = state.combat.enemy;
      if (!enemy) return state;
      const hp = Math.max(0, enemy.hp - action.damage);
      const momentum = Math.min(5, state.combat.momentum + 1);
      const hit: GameState = {
        ...state,
        combat: { ...state.combat, enemy: { ...enemy, hp }, momentum },
      };
      if (hp <= 0) {
        const defeated: GameState = {
          ...hit,
          combat: { ...hit.combat, enemy: { ...enemy, hp: 0 }, result: "victory" },
        };
        const marked = chronicle(
          defeated,
          "ridge-outlaws",
          "Defeat of the Ridge Outlaws",
          `A ${enemy.name} fell to Nikki's blade above the Valley of Whispers.`,
        );
        return levelUp(marked, enemy.xp);
      }
      return applyPosture(hit, { ...enemy, hp }, action.posture);
    }
    case "ENEMY_TURN": {
      const enemy = state.combat.enemy;
      if (!enemy || state.combat.result) return state;
      const nextIntent = pickIntent(enemy, action.intentRoll);
      const finish = (next: GameState, current: Enemy) =>
        pushLog(
          {
            ...next,
            combat: {
              ...next.combat,
              guarding: false,
              enemy: { ...current, intent: nextIntent },
            },
          },
          "Combat",
          `${enemy.name} is ${nextIntent.telegraph}.`,
        );

      if (enemy.staggerTurns > 0) {
        const recovered: Enemy = {
          ...enemy,
          staggerTurns: 0,
          posture: Math.round(enemy.maxPosture * 0.6),
        };
        const logged = pushLog(
          state,
          "Combat",
          `${enemy.name} is staggered and loses its turn, then recovers its footing.`,
        );
        return finish(logged, recovered);
      }

      if (enemy.intent.kind === "defend") {
        const braced: Enemy = {
          ...enemy,
          posture: Math.min(enemy.maxPosture, enemy.posture + Math.round(enemy.maxPosture * 0.15)),
        };
        const logged = pushLog(
          state,
          "Combat",
          `${enemy.name} holds ${enemy.intent.name} and steadies its guard.`,
        );
        return finish(logged, braced);
      }

      const { defense } = state.character.calculatedStats;
      const raw = enemy.attack * enemy.intent.multiplier * (0.85 + action.damageRoll * 0.3);
      const mitigation = enemy.intent.kind === "heavy" ? defense * 0.2 : defense * 0.35;
      const guarded = state.combat.guarding;
      const incoming = Math.max(3, Math.round((raw - mitigation) * (guarded ? 0.3 : 1)));
      const damaged = gameReducer(state, { type: "MODIFY_HP", delta: -incoming });
      const logged = pushLog(
        damaged,
        "Combat",
        guarded
          ? `You parry ${enemy.intent.name} — only ${incoming} damage lands.`
          : `${enemy.name} lands ${enemy.intent.name} for ${incoming} damage.`,
      );
      if (logged.combat.result === "defeat") return logged;
      const currentEnemy = logged.combat.enemy ?? enemy;
      if (!guarded) return finish(logged, currentEnemy);
      const countered = applyPosture(logged, currentEnemy, 46);
      const counterLogged = pushLog(
        countered,
        "Combat",
        `Your counter smashes ${enemy.name}'s posture.`,
      );
      return finish(counterLogged, counterLogged.combat.enemy ?? currentEnemy);
    }
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
        combat: { enemy: null, cooldowns: {}, result: null, guarding: false, momentum: 0 },
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
      addChronicle: (id: string, title: string, detail: string) =>
        dispatch({ type: "ADD_CHRONICLE", id, title, detail }),
      setNotice: (text: string) => dispatch({ type: "SET_NOTICE", text }),
      travel: (location: LocationId) => dispatch({ type: "TRAVEL", location }),
      startCombat: (enemy: EnemyTemplate) =>
        dispatch({ type: "START_COMBAT", enemy, roll: Math.random() }),
      spendSkill: (skillId: string, mana: number, cooldown: number) =>
        dispatch({ type: "SPEND_SKILL", skillId, mana, cooldown }),
      guard: () => dispatch({ type: "GUARD" }),
      damageEnemy: (damage: number, posture: number) =>
        dispatch({ type: "DAMAGE_ENEMY", damage, posture }),
      enemyTurn: () =>
        dispatch({ type: "ENEMY_TURN", damageRoll: Math.random(), intentRoll: Math.random() }),
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

  const weaponPosture = useMemo(
    () => postureBonus(state.equipment, state.inventory),
    [state.equipment, state.inventory],
  );

  return { state, actions, bagCount, equippedItem, weaponPosture };
}
