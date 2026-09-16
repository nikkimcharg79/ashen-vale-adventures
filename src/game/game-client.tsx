import { useEffect, useState, type ReactNode } from "react";
import {
  Backpack,
  ChevronRight,
  Compass,
  Gem,
  Hammer,
  Landmark,
  Map,
  MessageSquare,
  Navigation,
  ScrollText,
  Settings,
  Shield,
  Swords,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import moonlitRidge from "@/assets/moonlit-ridge.jpg";
import lanternDistrict from "@/assets/lantern-district.jpg";
import nikkiMoonsteel from "@/assets/nikki-moonsteel.png";
import nikkiDagger from "@/assets/nikki-dagger.png";
import nikkiAshen from "@/assets/nikki-ashen.png";
import nikkiMace from "@/assets/nikki-mace.png";
import { ambientChatter, enemies, hubNpcs, partyBoard, skills } from "./data";
import type { Item, LogChannel } from "./types";
import { useGameState } from "./state";

const characterImages: Record<string, string> = {
  moonsteel: nikkiMoonsteel,
  dagger: nikkiDagger,
  ashen: nikkiAshen,
  "bandit-mace": nikkiMace,
};

const rarityClass: Record<Item["rarity"], string> = {
  common: "rarity-common",
  uncommon: "rarity-uncommon",
  rare: "rarity-rare",
  epic: "rarity-epic",
};

const chatTabs: Array<"All" | LogChannel> = [
  "All",
  "Nearby",
  "World",
  "Party",
  "Combat",
  "System",
];

type Overlay = "character" | "adventure" | "combat" | "hub" | "chronicle" | null;

export function GameClient() {
  const { state, actions, bagCount, equippedItem, weaponPosture } = useGameState();
  const {
    character,
    equipment,
    inventory,
    currencies,
    activeLocation,
    activeQuest,
    combat,
    logs,
    chronicle,
  } = state;
  const [selected, setSelected] = useState<Item | null>(null);
  const [category, setCategory] = useState("All");
  const [chatTab, setChatTab] = useState<"All" | LogChannel>("All");
  const [chatInput, setChatInput] = useState("");
  const [overlay, setOverlay] = useState<Overlay>(null);

  const weapon = equippedItem("weapon");
  const armor = equippedItem("armor");
  const stats = character.calculatedStats;
  const { attack, defense, crit, maxHp, maxMp } = stats;
  const { hp, mp, xp, maxXp } = character;
  const enemy = combat.enemy;
  const combatResult = combat.result;
  const cooldowns = combat.cooldowns;
  const staggered = (enemy?.staggerTurns ?? 0) > 0;
  const inHub = activeLocation.id === "lantern-district";
  const backdrop = inHub ? lanternDistrict : moonlitRidge;
  const image = characterImages[equipment.weapon ?? ""] ?? nikkiMoonsteel;
  const visibleItems =
    category === "All" ? inventory : inventory.filter((item) => item.category === category);
  const visibleLogs = chatTab === "All" ? logs : logs.filter((log) => log.channel === chatTab);
  const xpPercent = Math.min(100, Math.floor((xp / maxXp) * 100));

  const startCombat = (index?: number) => {
    const base = enemies[index ?? Math.floor(Math.random() * enemies.length)] ?? enemies[0]!;
    actions.startCombat(base);
    actions.setNotice(base.flavor);
    actions.addLog("Combat", `${base.name} blocks your path! ${base.trait}`);
  };

  const gather = () => {
    const resources = [
      {
        id: "wild-herb",
        name: "Wild Herb",
        icon: "☘",
        rarity: "common",
        description: "A hardy medicinal herb from the ridge.",
      },
      {
        id: "iron-ore",
        name: "Iron Ore",
        icon: "◆",
        rarity: "common",
        description: "Dense ore veined with dark metal.",
      },
      {
        id: "silverleaf",
        name: "Silverleaf",
        icon: "❧",
        rarity: "rare",
        description: "A luminous leaf used by temple alchemists.",
      },
    ] as const;
    const resource = resources[Math.floor(Math.random() * resources.length)] ?? resources[0];
    const count = 1 + Math.floor(Math.random() * 3);
    actions.addItem({ ...resource, category: "Materials", count });
    actions.setNotice(`You gathered ${count} × ${resource.name} beside the moonlit stream.`);
    actions.addLog("System", `Obtained ${resource.name} ×${count}.`);
  };

  const explore = () => {
    const roll = Math.random();
    if (roll < 0.45) startCombat();
    else if (roll < 0.78) gather();
    else {
      actions.modifyCurrencies(85, 0);
      actions.setNotice("Behind a weathered shrine, you discover a moon-marked cache: 85 gold.");
      actions.addLog("System", "Discovered a hidden shrine cache. Gained 85 gold.");
    }
  };

  const lootFor = (enemyId: string): Item => {
    if (enemyId === "dagger-bandit")
      return {
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
        flavor: "Fast strikes, thin posture pressure.",
      };
    if (enemyId === "mace-bandit")
      return {
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
      };
    return {
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
    };
  };

  const activateSkill = (skillId: string) => {
    if (!enemy || combatResult) return;
    const skill = skills.find((entry) => entry.id === skillId);
    if (!skill || (cooldowns[skill.id] ?? 0) > 0 || mp < skill.mana) return;

    if (skill.kind === "guard") {
      actions.spendSkill(skill.id, skill.mana, skill.cooldown);
      actions.guard();
      actions.addLog("Combat", `You brace to parry ${enemy.intent.name}.`);
      window.setTimeout(() => actions.enemyTurn(), 380);
      return;
    }

    const isCritical = staggered || Math.random() * 100 < crit + (skill.lunar ? 18 : 0);
    const critMultiplier = staggered ? 1.75 : 1.65;
    const damage = Math.round(
      attack * skill.multiplier * (0.84 + Math.random() * 0.25) * (isCritical ? critMultiplier : 1),
    );
    const postureDamage = skill.posture + weaponPosture + combat.momentum * 2;
    const nextHp = Math.max(0, enemy.hp - damage);
    actions.spendSkill(skill.id, skill.mana, skill.cooldown);
    actions.damageEnemy(damage, postureDamage);
    actions.addLog(
      "Combat",
      `${skill.name} deals ${damage}${isCritical ? (staggered ? " vulnerable critical" : " critical") : ""} damage and ${postureDamage} posture.`,
    );
    if (nextHp <= 0) {
      const loot = lootFor(enemy.id);
      actions.addItem(loot);
      actions.modifyCurrencies(40, 0);
      actions.addLog("System", `Victory! Gained ${enemy.xp} XP and ${loot.name}.`);
      return;
    }
    window.setTimeout(() => actions.enemyTurn(), 380);
  };

  const interactItem = (item: Item) => {
    if (item.equipSlot) {
      actions.equipItem(item.id);
      actions.addLog("System", `Equipped ${item.name}.`);
    } else if (item.category === "Consumables" && item.count > 0) {
      actions.useItem(item.id);
      setSelected(null);
      actions.addLog("System", `Used ${item.name}.`);
    }
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    actions.addLog(inHub ? "Nearby" : "World", `Nikki: ${text}`);
    setChatInput("");
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === "INPUT") return;
      const key = event.key.toLowerCase();
      const skill = skills.find((entry) => entry.key.toLowerCase() === key);
      if (skill) activateSkill(skill.id);
      if (key === "w") {
        const potion = inventory.find((item) => item.id === "health-potion");
        if (potion) interactItem(potion);
      }
      if (key === "e") gather();
      if (key === "r") explore();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!inHub) return;
    const timer = window.setInterval(() => {
      const line = ambientChatter[Math.floor(Math.random() * ambientChatter.length)]!;
      actions.addLog("Nearby", line);
    }, 14000);
    return () => window.clearInterval(timer);
  }, [inHub, actions]);

  const panelTitle = (title: string, icon?: ReactNode) => (
    <div className="panel-title">
      {icon}
      <span>{title}</span>
      <span className="panel-title-line" />
    </div>
  );

  const CharacterPanel = () => (
    <aside className="character-panel game-panel">
      <section className="player-card">
        <div className="portrait">
          <img src={image} alt={`${character.name} portrait`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="player-name">{character.name}</div>
          <div className="player-class">
            Lv. {character.level} {character.classTitle}
          </div>
          <Meter value={hp} max={maxHp} kind="health" label={`${hp}/${maxHp}`} />
          <Meter value={mp} max={maxMp} kind="mana" label={`${mp}/${maxMp}`} />
        </div>
      </section>
      <section className="equipment-section">
        {panelTitle("Equipment", <Shield />)}
        <div className="equipment-body">
          <div className="equip-slots left-slots">
            <EquipSlotView icon="⚔" active={Boolean(equipment.weapon)} label={weapon?.name ?? "Weapon — empty"} />
            <EquipSlotView icon="♜" active={Boolean(equipment.armor)} label={armor?.name ?? "Armor — empty"} />
            <EquipSlotView icon="♢" active={Boolean(equipment.head)} label="Head — empty" />
            <EquipSlotView icon="♧" active={Boolean(equipment.gloves)} label="Gloves — empty" />
          </div>
          <img
            className="equipment-character"
            src={image}
            alt={`${character.name} equipped with ${weapon?.name ?? "no weapon"}`}
          />
          <div className="equip-slots right-slots">
            <EquipSlotView icon="◇" active={Boolean(equipment.necklace)} label="Necklace — empty" />
            <EquipSlotView icon="◈" active={Boolean(equipment.ring1)} label="Ring — empty" />
            <EquipSlotView icon="◉" active={Boolean(equipment.ring2)} label="Ring — empty" />
            <EquipSlotView
              icon="♞"
              active={Boolean(equipment.boots)}
              label={equippedItem("boots")?.name ?? "Boots — empty"}
            />
          </div>
        </div>
        {weapon && (
          <p className="equip-tooltip">
            <strong className={rarityClass[weapon.rarity]}>{weapon.name}</strong>
            <span>{weapon.flavor ?? weapon.description}</span>
            <span>
              ATK +{weapon.attack ?? 0} · POSTURE +{weapon.posture ?? 0}
              {weapon.crit ? ` · CRIT +${weapon.crit}%` : ""}
            </span>
          </p>
        )}
        <div className="stat-strip">
          <span>
            ATK <b>{attack}</b>
          </span>
          <span>
            DEF <b>{defense}</b>
          </span>
          <span>
            CRIT <b>{crit}%</b>
          </span>
        </div>
      </section>
      <section className="inventory-section">
        {panelTitle("Inventory", <Backpack />)}
        <div className="inventory-tabs">
          {["All", "Weapons", "Armor", "Consumables", "Materials", "Quest"].map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              className={category === tab ? "active" : ""}
              onClick={() => setCategory(tab)}
              title={tab}
            >
              {tab === "All" ? "All" : tab[0]}
            </Button>
          ))}
        </div>
        <div className="inventory-grid">
          {visibleItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`item-slot ${rarityClass[item.rarity]} ${selected?.id === item.id ? "selected" : ""}`}
              onClick={() => setSelected(item)}
              title={item.name}
            >
              <span>{item.icon}</span>
              {item.count > 1 && <small>{item.count}</small>}
            </Button>
          ))}
        </div>
        {selected && (
          <div className="item-detail">
            <div>
              <strong className={rarityClass[selected.rarity]}>{selected.name}</strong>
              <small>
                {selected.rarity} · {selected.category}
              </small>
            </div>
            <p>{selected.description}</p>
            {selected.flavor && <p className="italic opacity-80">{selected.flavor}</p>}
            <div className="item-stats">
              {selected.attack && <span>ATK +{selected.attack}</span>}
              {selected.defense && <span>DEF +{selected.defense}</span>}
              {selected.crit && <span>CRIT +{selected.crit}%</span>}
              {selected.posture && <span>POSTURE +{selected.posture}</span>}
            </div>
            {selected.equipSlot && weapon && selected.equipSlot === "weapon" && (
              <div className="item-stats compare">
                <span>
                  vs {weapon.name}: {(selected.attack ?? 0) - (weapon.attack ?? 0) >= 0 ? "+" : ""}
                  {(selected.attack ?? 0) - (weapon.attack ?? 0)} ATK ·{" "}
                  {(selected.posture ?? 0) - (weapon.posture ?? 0) >= 0 ? "+" : ""}
                  {(selected.posture ?? 0) - (weapon.posture ?? 0)} POSTURE
                </span>
              </div>
            )}
            {(selected.equipSlot || selected.category === "Consumables") && (
              <Button className="gold-button" onClick={() => interactItem(selected)}>
                {selected.category === "Consumables" ? "Use" : "Equip"}
              </Button>
            )}
          </div>
        )}
        <div className="bag-count">
          <Backpack /> {bagCount}/{state.bagCapacity}
        </div>
      </section>
    </aside>
  );

  const AdventurePanel = () => (
    <aside className="adventure-panel">
      <div className="minimap-wrap">
        <div className="minimap">
          <img src={backdrop} alt={`${activeLocation.name} minimap`} />
          <Compass />
          <span className="north">N</span>
          <span className="map-pin">◆</span>
        </div>
        <div className="map-label">
          {activeLocation.name}{" "}
          <small>
            ({activeLocation.coordinates.x}, {activeLocation.coordinates.y})
          </small>
        </div>
      </div>
      <section className="game-panel adventure-feed">
        {panelTitle("Adventure Feed", <ScrollText />)}
        <div className="narrative">
          <p>{activeLocation.notice}</p>
          <p>
            {inHub
              ? "Traders call out from the market stalls while teahouse lanterns sway overhead."
              : "The air is cool and the scent of cherry blossoms fills the wind."}
          </p>
        </div>
        <ActionCard
          icon={<Compass />}
          title="Explore the area"
          subtitle="Look for resources, secrets or encounters."
          onClick={explore}
        />
        <ActionCard
          icon={<Swords />}
          title="Hunt Dagger Bandits"
          subtitle="Fast, evasive outlaws with thin posture."
          onClick={() => startCombat(0)}
        />
        <ActionCard
          icon={<Hammer />}
          title="Hunt Mace Bandits"
          subtitle="Heavy armour crushers — parry their windup."
          onClick={() => startCombat(1)}
        />
        <ActionCard
          icon={<Shield />}
          title="Challenge the Hollow Guardian"
          subtitle="Armoured construct with enormous posture."
          onClick={() => startCombat(2)}
        />
        <ActionCard
          icon={<Hammer />}
          title="Gather Resources"
          subtitle="Collect herbs, ore or silverleaf."
          onClick={gather}
        />
        {inHub ? (
          <ActionCard
            icon={<Navigation />}
            title="Return to Moonlit Ridge"
            subtitle="Back up the pass to the hunting grounds."
            onClick={() => {
              actions.travel("moonlit-ridge");
              actions.setNotice("The pass is quiet again. Only wind and distant water.");
            }}
          />
        ) : (
          <ActionCard
            icon={<Landmark />}
            title="Travel to The Lantern District"
            subtitle="Descend into the temple city's social hub."
            onClick={() => {
              actions.travel("lantern-district");
              actions.addLog("Nearby", "Lantern Keeper Oakhaven: Welcome back, wanderer.");
              setOverlay(null);
            }}
          />
        )}
      </section>
      <section className="quest-card game-panel">
        <div className="quest-icon">▤</div>
        <div>
          <span>{activeQuest.label}</span>
          <strong>{activeQuest.title}</strong>
          <p>{activeQuest.objective}</p>
        </div>
      </section>
    </aside>
  );

  const LanternPanel = () => (
    <aside className="hub-panel game-panel">
      {panelTitle("The Lantern District", <Landmark />)}
      {!inHub && (
        <p className="hub-hint">
          You are still on the ridge. Travel down to the district to speak with its keepers.
        </p>
      )}
      <div className="hub-subtitle">
        <Users /> Party Quest Board
      </div>
      {partyBoard.map((listing) => (
        <div key={listing.id} className="board-row">
          <div>
            <strong>{listing.title}</strong>
            <small>
              {listing.slots} — {listing.needs}
            </small>
          </div>
          <Button
            className="gold-button"
            onClick={() => {
              actions.addLog("Party", `You raised your lantern for ${listing.title} (${listing.slots}).`);
              actions.setNotice(`A recruiter waves you toward the ${listing.title} gathering stone.`);
            }}
          >
            Join
          </Button>
        </div>
      ))}
      <div className="hub-subtitle">
        <MessageSquare /> Teahouse &amp; Market
      </div>
      {hubNpcs.map((npc) => (
        <Button
          key={npc.id}
          variant="ghost"
          className="npc-row"
          onClick={() => {
            const line = npc.lines[Math.floor(Math.random() * npc.lines.length)]!;
            actions.addLog("Nearby", line);
            actions.setNotice(line);
          }}
        >
          <span className="npc-icon">{npc.icon}</span>
          <span>
            <strong>{npc.name}</strong>
            <small>{npc.role} · speak</small>
          </span>
          <ChevronRight />
        </Button>
      ))}
    </aside>
  );

  const ChroniclePanel = () => (
    <aside className="chronicle-panel game-panel">
      {panelTitle("Character Chronicle", <ScrollText />)}
      <ol className="chronicle-list">
        {chronicle.map((entry) => (
          <li key={entry.id}>
            <strong>{entry.title}</strong>
            <small>{entry.detail}</small>
          </li>
        ))}
      </ol>
    </aside>
  );

  const CombatPanel = () => (
    <aside className="combat-panel game-panel">
      {panelTitle("Combat", <Swords />)}
      {enemy ? (
        <>
          <div className="intent-badge">
            <span>{staggered ? "STAGGERED" : "INTENT"}</span>
            <strong>{staggered ? "Vulnerable — 1.75× critical" : enemy.intent.telegraph}</strong>
          </div>
          <Meter value={enemy.hp} max={enemy.maxHp} kind="enemy" label={`HP ${enemy.hp}/${enemy.maxHp}`} />
          <Meter
            value={enemy.posture}
            max={enemy.maxPosture}
            kind="posture"
            label={`POSTURE ${enemy.posture}/${enemy.maxPosture}`}
          />
          <p className="combat-trait">{enemy.trait}</p>
          <div className="combat-actions">
            {skills.map((skill) => (
              <Button
                key={skill.id}
                variant="ghost"
                className="combat-action"
                disabled={mp < skill.mana || (cooldowns[skill.id] ?? 0) > 0 || Boolean(combatResult)}
                onClick={() => activateSkill(skill.id)}
              >
                <span className="skill-art">{skill.icon}</span>
                <span>
                  <strong>{skill.name}</strong>
                  <small>{skill.description}</small>
                </span>
                <kbd>{skill.key}</kbd>
              </Button>
            ))}
            <Button
              variant="ghost"
              className="combat-action"
              onClick={() => {
                const potion = inventory.find((item) => item.id === "health-potion");
                if (potion) interactItem(potion);
              }}
            >
              <span className="skill-art">♥</span>
              <span>
                <strong>Crimson Potion</strong>
                <small>Quick-use health restoration.</small>
              </span>
              <kbd>W</kbd>
            </Button>
            <Button
              variant="ghost"
              className="combat-action"
              onClick={() => {
                const potion = inventory.find((item) => item.id === "silverleaf-potion");
                if (potion) interactItem(potion);
              }}
            >
              <span className="skill-art">✦</span>
              <span>
                <strong>Silverleaf Potion</strong>
                <small>Quick-use mana restoration.</small>
              </span>
            </Button>
          </div>
        </>
      ) : (
        <p className="hub-hint">No hostile nearby. Hunt from the Adventure feed to begin a duel.</p>
      )}
    </aside>
  );

  return (
    <main className="game-shell">
      <img
        className="world-background"
        src={backdrop}
        alt={
          inHub
            ? "The Lantern District, a lantern-lit market street of the temple city"
            : "Moonlit Ridge overlooking a lantern-lit temple city"
        }
        width={1920}
        height={1080}
      />
      <div className="world-vignette" />
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">炎</span>
          <h1>ASHEN VALE</h1>
        </div>
        <div className="location">
          <strong>{activeLocation.name}</strong>
          <div>
            {activeLocation.region} <ChevronRight /> {activeLocation.name}
          </div>
        </div>
        <div className="currencies">
          <span className="currency gold">
            ● <b>{currencies.gold.toLocaleString()}</b>
          </span>
          <span className="currency crystal">
            <Gem /> <b>{currencies.crystals.toLocaleString()}</b>
          </span>
          <span className="currency">
            <Backpack />{" "}
            <b>
              {bagCount}/{state.bagCapacity}
            </b>
          </span>
        </div>
        <div className="utilities">
          <Button variant="ghost" size="icon" title="Messages">
            <MessageSquare />
          </Button>
          <Button variant="ghost" size="icon" title="Settings">
            <Settings />
          </Button>
        </div>
      </header>

      <div className={`desktop-left ${overlay === "character" ? "mobile-open" : ""}`}>
        <CharacterPanel />
        <Button
          className="drawer-close"
          variant="ghost"
          size="icon"
          onClick={() => setOverlay(null)}
        >
          <X />
        </Button>
      </div>
      <div className={`desktop-right ${overlay === "adventure" ? "mobile-open" : ""}`}>
        <AdventurePanel />
        <Button
          className="drawer-close"
          variant="ghost"
          size="icon"
          onClick={() => setOverlay(null)}
        >
          <X />
        </Button>
      </div>

      <section className="world-stage" aria-label={`${activeLocation.name} world view`}>
        <img
          className="world-character"
          src={image}
          alt={`${character.name} carrying ${weapon?.name ?? "no weapon"}`}
          width={768}
          height={1280}
        />
        {enemy && (
          <div className={`enemy-card ${staggered ? "staggered" : ""}`}>
            <div className="enemy-icon">{enemy.icon}</div>
            <div className="enemy-info">
              <span>{staggered ? "STAGGERED · VULNERABLE" : "HOSTILE"}</span>
              <strong>{enemy.name}</strong>
              <Meter
                value={enemy.hp}
                max={enemy.maxHp}
                kind="enemy"
                label={`${enemy.hp}/${enemy.maxHp}`}
              />
              <Meter
                value={enemy.posture}
                max={enemy.maxPosture}
                kind="posture"
                label={`POSTURE ${enemy.posture}/${enemy.maxPosture}`}
              />
              <div className="intent-tag">
                {staggered ? "Guard broken — 1.75× critical" : enemy.intent.telegraph}
              </div>
            </div>
          </div>
        )}
        {inHub && !enemy && (
          <div className="hub-marker">
            <strong>Party Quest Board</strong>
            <small>Moon Temple PQ — 2/4 — Need Healer / Support</small>
          </div>
        )}
        {combatResult && (
          <div className={`result-banner ${combatResult}`}>
            <strong>{combatResult === "victory" ? "VICTORY" : "FALLEN"}</strong>
            <span>
              {combatResult === "victory"
                ? `The ${enemy?.name} is defeated. Spoils added to inventory.`
                : "The ridge claims another wanderer."}
            </span>
            <Button className="gold-button" onClick={() => actions.endCombat()}>
              Continue
            </Button>
          </div>
        )}
      </section>

      <div className="mobile-controls">
        <Button onClick={() => setOverlay("character")}>
          <Backpack /> Character
        </Button>
        <Button onClick={() => setOverlay("adventure")}>
          <Map /> Adventure
        </Button>
        <Button onClick={() => setOverlay("combat")}>
          <Swords /> Combat
        </Button>
        <Button onClick={() => setOverlay("hub")}>
          <Landmark /> Lantern
        </Button>
        <Button onClick={() => setOverlay("chronicle")}>
          <ScrollText /> Chronicle
        </Button>
      </div>
      {(overlay === "combat" || overlay === "hub" || overlay === "chronicle") && (
        <div className="floating-drawer">
          {overlay === "combat" && <CombatPanel />}
          {overlay === "hub" && <LanternPanel />}
          {overlay === "chronicle" && <ChroniclePanel />}
          <Button
            className="drawer-close"
            variant="ghost"
            size="icon"
            onClick={() => setOverlay(null)}
          >
            <X />
          </Button>
        </div>
      )}
      {overlay && (
        <button
          className="drawer-scrim"
          aria-label="Close panel"
          onClick={() => setOverlay(null)}
        />
      )}

      <section className="chat game-panel">
        <div className="chat-tabs">
          {chatTabs.map((tab) => (
            <Button
              key={tab}
              variant="ghost"
              className={chatTab === tab ? "active" : ""}
              onClick={() => setChatTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>
        <div className="chat-log">
          {visibleLogs.slice(-6).map((log) => (
            <div key={log.id}>
              <span>[{log.channel}]</span> {log.text}
            </div>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendChat();
          }}
        >
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Type a message..."
            aria-label="Chat message"
          />
          <Button size="icon" title="Send message">
            ➤
          </Button>
        </form>
      </section>

      <section className="hotbar-wrap">
        <div className="hotbar">
          {skills.map((skill) => (
            <Button
              key={skill.id}
              variant="ghost"
              className={`skill-slot ${skill.kind === "guard" ? "guard-slot" : ""}`}
              disabled={!enemy || mp < skill.mana || (cooldowns[skill.id] ?? 0) > 0}
              onClick={() => activateSkill(skill.id)}
              title={`${skill.name} · ${skill.mana} MP · ${skill.description}`}
            >
              <span className="skill-art">{skill.icon}</span>
              <kbd>{skill.key}</kbd>
              {skill.mana > 0 && <small>{skill.mana}</small>}
              {(cooldowns[skill.id] ?? 0) > 0 && <i>{cooldowns[skill.id]}</i>}
            </Button>
          ))}
          <Button
            variant="ghost"
            className="skill-slot potion-slot"
            onClick={() => {
              const potion = inventory.find((item) => item.id === "health-potion");
              if (potion) interactItem(potion);
            }}
            title="Crimson Potion"
          >
            <span className="skill-art">♥</span>
            <kbd>W</kbd>
            <small>{inventory.find((item) => item.id === "health-potion")?.count ?? 0}</small>
          </Button>
          <Button variant="ghost" className="skill-slot" onClick={gather} title="Gather">
            <span className="skill-art">❧</span>
            <kbd>E</kbd>
          </Button>
          <Button variant="ghost" className="skill-slot" onClick={explore} title="Explore">
            <span className="skill-art">⌖</span>
            <kbd>R</kbd>
          </Button>
        </div>
        <div className="xp-row">
          <div style={{ width: `${xpPercent}%` }} />
          <span>
            EXP {xp.toLocaleString()} / {maxXp.toLocaleString()} ({xpPercent}%)
          </span>
        </div>
      </section>

      <div className="desktop-extras">
        <LanternPanel />
        <ChroniclePanel />
      </div>
    </main>
  );
}

function Meter({
  value,
  max,
  label,
  kind,
}: {
  value: number;
  max: number;
  label: string;
  kind: string;
}) {
  return (
    <div className={`meter ${kind}`}>
      <div style={{ width: `${Math.max(0, (value / max) * 100)}%` }} />
      <span>{label}</span>
    </div>
  );
}

function EquipSlotView({
  icon,
  active = false,
  label,
}: {
  icon: string;
  active?: boolean;
  label?: string | undefined;
}) {
  return (
    <div className={`equip-slot ${active ? "active" : ""}`} title={label}>
      {icon}
    </div>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <Button variant="ghost" className="action-card" onClick={onClick}>
      <span className="action-icon">{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      <ChevronRight />
    </Button>
  );
}
