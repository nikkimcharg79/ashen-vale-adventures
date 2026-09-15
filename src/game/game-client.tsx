import { useEffect, useMemo, useState } from "react";
import {
  Backpack, ChevronRight, Compass, Crosshair, Gem, Hammer, Map, Menu,
  MessageSquare, Navigation, ScrollText, Settings, Shield, Swords, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import moonlitRidge from "@/assets/moonlit-ridge.jpg";
import nikkiMoonsteel from "@/assets/nikki-moonsteel.png";
import nikkiDagger from "@/assets/nikki-dagger.png";
import nikkiAshen from "@/assets/nikki-ashen.png";
import { enemies, initialItems, skills, type Item } from "./data";

type Log = { channel: "System" | "World" | "Combat"; text: string };
type Enemy = (typeof enemies)[number] & { hp: number };

const characterImages: Record<string, string> = {
  moonsteel: nikkiMoonsteel,
  dagger: nikkiDagger,
  ashen: nikkiAshen,
};

const rarityClass: Record<Item["rarity"], string> = {
  common: "rarity-common", uncommon: "rarity-uncommon", rare: "rarity-rare", epic: "rarity-epic",
};

export function GameClient() {
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<Item | null>(initialItems[0] ?? null);
  const [category, setCategory] = useState("All");
  const [equippedWeapon, setEquippedWeapon] = useState("moonsteel");
  const [equippedArmor, setEquippedArmor] = useState("wanderer");
  const [hp, setHp] = useState(428);
  const [mp, setMp] = useState(163);
  const [xp, setXp] = useState(4320);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<Log[]>([
    { channel: "System", text: "You have entered Moonlit Ridge." },
    { channel: "System", text: "Gained 120 experience." },
    { channel: "World", text: "Kaei: LFG temple city run" },
  ]);
  const [chatTab, setChatTab] = useState("All");
  const [chatInput, setChatInput] = useState("");
  const [overlay, setOverlay] = useState<"character" | "adventure" | null>(null);
  const [notice, setNotice] = useState("A narrow pass overlooks the distant temple city.");
  const [combatResult, setCombatResult] = useState<"victory" | "defeat" | null>(null);

  const weapon = items.find((item) => item.id === equippedWeapon);
  const armor = items.find((item) => item.id === equippedArmor);
  const attack = 34 + (weapon?.attack ?? 0);
  const defense = 18 + (armor?.defense ?? 0);
  const crit = 8 + (weapon?.crit ?? 0) + (armor?.crit ?? 0);
  const image = characterImages[equippedWeapon] ?? nikkiMoonsteel;
  const visibleItems = category === "All" ? items : items.filter((item) => item.category === category);
  const visibleLogs = chatTab === "All" ? logs : logs.filter((log) => log.channel === chatTab);

  const addLog = (channel: Log["channel"], text: string) =>
    setLogs((current) => [...current.slice(-30), { channel, text }]);

  const addItem = (incoming: Item) => {
    setItems((current) => {
      const found = current.find((item) => item.id === incoming.id);
      return found
        ? current.map((item) => item.id === incoming.id ? { ...item, count: item.count + incoming.count } : item)
        : [...current, incoming];
    });
  };

  const startCombat = (index?: number) => {
    const base = enemies[index ?? Math.floor(Math.random() * enemies.length)];
    setEnemy({ ...base, hp: base.maxHp });
    setCooldowns({});
    setCombatResult(null);
    setNotice(base.flavor);
    addLog("Combat", `${base.name} blocks your path!`);
  };

  const gather = () => {
    const resources = [
      { id: "wild-herb", name: "Wild Herb", icon: "☘", rarity: "common", description: "A hardy medicinal herb from the ridge." },
      { id: "iron-ore", name: "Iron Ore", icon: "◆", rarity: "common", description: "Dense ore veined with dark metal." },
      { id: "silverleaf", name: "Silverleaf", icon: "❧", rarity: "rare", description: "A luminous leaf used by temple alchemists." },
    ] as const;
    const resource = resources[Math.floor(Math.random() * resources.length)] ?? resources[0];
    const count = 1 + Math.floor(Math.random() * 3);
    addItem({ ...resource, category: "Materials", count });
    setNotice(`You gathered ${count} × ${resource.name} beside the moonlit stream.`);
    addLog("System", `Obtained ${resource.name} ×${count}.`);
  };

  const explore = () => {
    const roll = Math.random();
    if (roll < 0.45) startCombat();
    else if (roll < 0.78) gather();
    else {
      setNotice("Behind a weathered shrine, you discover a moon-marked cache: 85 gold.");
      addLog("System", "Discovered a hidden shrine cache. Gained 85 gold.");
    }
  };

  const useSkill = (skillId: string) => {
    if (!enemy || combatResult) return;
    const skill = skills.find((entry) => entry.id === skillId);
    if (!skill || (cooldowns[skill.id] ?? 0) > 0 || mp < skill.mana) return;
    const isCritical = Math.random() * 100 < crit + (skill.id === "moonveil" ? 18 : 0);
    const damage = Math.round(attack * skill.multiplier * (0.84 + Math.random() * 0.25) * (isCritical ? 1.65 : 1));
    const nextHp = Math.max(0, enemy.hp - damage);
    setMp((value) => value - skill.mana);
    setCooldowns((current) => {
      const next: Record<string, number> = {};
      for (const [key, value] of Object.entries(current)) next[key] = Math.max(0, value - 1);
      if (skill.cooldown) next[skill.id] = skill.cooldown;
      return next;
    });
    addLog("Combat", `${skill.name} deals ${damage}${isCritical ? " critical" : ""} damage.`);
    if (nextHp <= 0) {
      setEnemy({ ...enemy, hp: 0 });
      setCombatResult("victory");
      setXp((value) => value + enemy.xp);
      const loot = enemy.name === "Ridge Bandit"
        ? { id: "dagger", name: "Iron Dagger", category: "Weapons" as const, icon: "🗡", rarity: "common" as const, count: 1, attack: 9, crit: 9, description: "A quick, practical blade favored by ridge bandits." }
        : { id: "silverleaf-potion", name: "Silverleaf Potion", category: "Consumables" as const, icon: "✦", rarity: "uncommon" as const, count: 1, mana: 75, description: "Restores 75 mana." };
      addItem(loot);
      addLog("System", `Victory! Gained ${enemy.xp} XP and ${loot.name}.`);
      return;
    }
    setEnemy({ ...enemy, hp: nextHp });
    window.setTimeout(() => {
      const incoming = Math.max(5, Math.round(enemy.attack * (0.85 + Math.random() * 0.3) - defense * 0.35));
      setHp((value) => {
        const next = Math.max(0, value - incoming);
        if (next === 0) setCombatResult("defeat");
        return next;
      });
      addLog("Combat", `${enemy.name} strikes for ${incoming} damage.`);
    }, 350);
  };

  const interactItem = (item: Item) => {
    if (item.category === "Weapons") {
      setEquippedWeapon(item.id);
      addLog("System", `Equipped ${item.name}. Attack is now ${34 + (item.attack ?? 0)}.`);
    } else if (item.category === "Armor") {
      setEquippedArmor(item.id);
      addLog("System", `Equipped ${item.name}.`);
    } else if (item.category === "Consumables" && item.count > 0) {
      setHp((value) => Math.min(428, value + (item.heal ?? 0)));
      setMp((value) => Math.min(163, value + (item.mana ?? 0)));
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, count: entry.count - 1 } : entry).filter((entry) => entry.count > 0));
      setSelected(null);
      addLog("System", `Used ${item.name}.`);
    }
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    addLog("World", `Nikki: ${text}`);
    setChatInput("");
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === "INPUT") return;
      const skill = skills.find((entry) => entry.key.toLowerCase() === event.key.toLowerCase());
      if (skill) useSkill(skill.id);
      if (event.key.toLowerCase() === "w") {
        const potion = items.find((item) => item.id === "health-potion");
        if (potion) interactItem(potion);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const panelTitle = (title: string, icon?: React.ReactNode) => (
    <div className="panel-title">{icon}<span>{title}</span><span className="panel-title-line" /></div>
  );

  const CharacterPanel = () => (
    <aside className="character-panel game-panel">
      <section className="player-card">
        <div className="portrait"><img src={image} alt="Nikki portrait" /></div>
        <div className="min-w-0 flex-1">
          <div className="player-name">Nikki</div><div className="player-class">Lv. 12 Wanderer</div>
          <Meter value={hp} max={428} kind="health" label={`${hp}/428`} />
          <Meter value={mp} max={163} kind="mana" label={`${mp}/163`} />
        </div>
      </section>
      <section className="equipment-section">
        {panelTitle("Equipment", <Shield />)}
        <div className="equipment-body">
          <div className="equip-slots left-slots"><EquipSlot icon="⚔" active /><EquipSlot icon="♜" /><EquipSlot icon="♢" /><EquipSlot icon="♧" /></div>
          <img className="equipment-character" src={image} alt={`Nikki equipped with ${weapon?.name}`} />
          <div className="equip-slots right-slots"><EquipSlot icon="◇" /><EquipSlot icon="◈" /><EquipSlot icon="◉" /><EquipSlot icon="♞" /></div>
        </div>
        <div className="stat-strip"><span>ATK <b>{attack}</b></span><span>DEF <b>{defense}</b></span><span>CRIT <b>{crit}%</b></span></div>
      </section>
      <section className="inventory-section">
        {panelTitle("Inventory", <Backpack />)}
        <div className="inventory-tabs">
          {["All", "Weapons", "Armor", "Consumables", "Materials", "Quest"].map((tab) => (
            <Button key={tab} variant="ghost" className={category === tab ? "active" : ""} onClick={() => setCategory(tab)} title={tab}>{tab === "All" ? "All" : tab[0]}</Button>
          ))}
        </div>
        <div className="inventory-grid">
          {visibleItems.map((item) => (
            <Button key={item.id} variant="ghost" className={`item-slot ${rarityClass[item.rarity]} ${selected?.id === item.id ? "selected" : ""}`} onClick={() => setSelected(item)} title={item.name}>
              <span>{item.icon}</span>{item.count > 1 && <small>{item.count}</small>}
            </Button>
          ))}
        </div>
        {selected && <div className="item-detail">
          <div><strong className={rarityClass[selected.rarity]}>{selected.name}</strong><small>{selected.rarity} · {selected.category}</small></div>
          <p>{selected.description}</p>
          <div className="item-stats">{selected.attack && <span>ATK +{selected.attack}</span>}{selected.defense && <span>DEF +{selected.defense}</span>}{selected.crit && <span>CRIT +{selected.crit}%</span>}</div>
          {["Weapons", "Armor", "Consumables"].includes(selected.category) && <Button className="gold-button" onClick={() => interactItem(selected)}>{selected.category === "Consumables" ? "Use" : "Equip"}</Button>}
        </div>}
        <div className="bag-count"><Backpack /> {items.reduce((sum, item) => sum + item.count, 0)}/40</div>
      </section>
    </aside>
  );

  const AdventurePanel = () => (
    <aside className="adventure-panel">
      <div className="minimap-wrap">
        <div className="minimap"><img src={moonlitRidge} alt="Moonlit Ridge minimap" /><Compass /><span className="north">N</span><span className="map-pin">◆</span></div>
        <div className="map-label">Moonlit Ridge <small>(128, 76)</small></div>
      </div>
      <section className="game-panel adventure-feed">
        {panelTitle("Adventure Feed", <ScrollText />)}
        <div className="narrative"><p>{notice}</p><p>The air is cool and the scent of cherry blossoms fills the wind.</p></div>
        <ActionCard icon={<Compass />} title="Explore the area" subtitle="Look for resources, secrets or encounters." onClick={explore} />
        <ActionCard icon={<Swords />} title="Hunt Bandits" subtitle="Defeat the bandits and claim their loot." onClick={() => startCombat(0)} />
        <ActionCard icon={<Hammer />} title="Gather Resources" subtitle="Collect herbs, ore or silverleaf." onClick={gather} />
        <ActionCard icon={<Navigation />} title="Travel to Temple City" subtitle="Head towards the distant city." onClick={() => { setNotice("The temple bells carry over the valley. The eastern gate remains sealed by moonlight."); addLog("System", "The road to Temple City is blocked by a lunar ward."); }} />
      </section>
      <section className="quest-card game-panel"><div className="quest-icon">▤</div><div><span>Main Quest</span><strong>The Hollow Moon</strong><p>Investigate the strange lights in the valley.</p></div></section>
    </aside>
  );

  return (
    <main className="game-shell">
      <img className="world-background" src={moonlitRidge} alt="Moonlit Ridge overlooking a lantern-lit temple city" width={1920} height={1080} />
      <div className="world-vignette" />
      <header className="topbar">
        <div className="brand"><span className="brand-mark">炎</span><span>ASHEN VALE</span></div>
        <div className="location"><strong>Moonlit Ridge</strong><div>Valley of Whispers <ChevronRight /> Moonlit Ridge</div></div>
        <div className="currencies"><span className="currency gold">● <b>2,450</b></span><span className="currency crystal"><Gem /> <b>380</b></span><span className="currency"><Backpack /> <b>23/40</b></span></div>
        <div className="utilities"><Button variant="ghost" size="icon" title="Messages"><MessageSquare /></Button><Button variant="ghost" size="icon" title="Settings"><Settings /></Button></div>
      </header>

      <div className={`desktop-left ${overlay === "character" ? "mobile-open" : ""}`}><CharacterPanel /><Button className="drawer-close" variant="ghost" size="icon" onClick={() => setOverlay(null)}><X /></Button></div>
      <div className={`desktop-right ${overlay === "adventure" ? "mobile-open" : ""}`}><AdventurePanel /><Button className="drawer-close" variant="ghost" size="icon" onClick={() => setOverlay(null)}><X /></Button></div>

      <section className="world-stage" aria-label="Moonlit Ridge world view">
        <img className="world-character" src={image} alt={`Nikki carrying ${weapon?.name}`} width={768} height={1280} />
        {enemy && <div className="enemy-card">
          <div className="enemy-icon">{enemy.icon}</div><div className="enemy-info"><span>HOSTILE</span><strong>{enemy.name}</strong><Meter value={enemy.hp} max={enemy.maxHp} kind="enemy" label={`${enemy.hp}/${enemy.maxHp}`} /></div>
        </div>}
        {combatResult && <div className={`result-banner ${combatResult}`}><strong>{combatResult === "victory" ? "VICTORY" : "FALLEN"}</strong><span>{combatResult === "victory" ? `The ${enemy?.name} is defeated. Spoils added to inventory.` : "The ridge claims another wanderer."}</span><Button className="gold-button" onClick={() => { if (combatResult === "defeat") { setHp(428); setMp(163); } setEnemy(null); setCombatResult(null); }}>Continue</Button></div>}
      </section>

      <div className="mobile-controls"><Button onClick={() => setOverlay("character")}><Backpack /> Character</Button><Button onClick={() => setOverlay("adventure")}><Map /> Adventure</Button></div>
      {overlay && <button className="drawer-scrim" aria-label="Close panel" onClick={() => setOverlay(null)} />}

      <section className="chat game-panel">
        <div className="chat-tabs">{["All", "World", "Combat", "System"].map((tab) => <Button key={tab} variant="ghost" className={chatTab === tab ? "active" : ""} onClick={() => setChatTab(tab)}>{tab}</Button>)}</div>
        <div className="chat-log">{visibleLogs.slice(-6).map((log, index) => <div key={`${log.text}-${index}`}><span>[{log.channel}]</span> {log.text}</div>)}</div>
        <form onSubmit={(event) => { event.preventDefault(); sendChat(); }}><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Type a message..." aria-label="Chat message" /><Button size="icon" title="Send message">➤</Button></form>
      </section>

      <section className="hotbar-wrap">
        <div className="hotbar">
          {skills.map((skill) => <Button key={skill.id} variant="ghost" className="skill-slot" disabled={!enemy || mp < skill.mana || (cooldowns[skill.id] ?? 0) > 0} onClick={() => useSkill(skill.id)} title={`${skill.name} · ${skill.mana} MP`}>
            <span className="skill-art">{skill.icon}</span><kbd>{skill.key}</kbd>{skill.mana > 0 && <small>{skill.mana}</small>}{(cooldowns[skill.id] ?? 0) > 0 && <i>{cooldowns[skill.id]}</i>}
          </Button>)}
          <Button variant="ghost" className="skill-slot potion-slot" onClick={() => { const potion = items.find((item) => item.id === "health-potion"); if (potion) interactItem(potion); }} title="Crimson Potion"><span className="skill-art">♥</span><kbd>W</kbd><small>{items.find((item) => item.id === "health-potion")?.count ?? 0}</small></Button>
          <Button variant="ghost" className="skill-slot" onClick={gather} title="Gather"><span className="skill-art">❧</span><kbd>E</kbd></Button>
          <Button variant="ghost" className="skill-slot" onClick={explore} title="Explore"><span className="skill-art">⌖</span><kbd>R</kbd></Button>
        </div>
        <div className="xp-row"><div style={{ width: `${Math.min(100, xp / 128)}%` }} /><span>EXP {xp.toLocaleString()} / 12,800 ({Math.floor(xp / 128)}%)</span></div>
      </section>
    </main>
  );
}

function Meter({ value, max, label, kind }: { value: number; max: number; label: string; kind: string }) {
  return <div className={`meter ${kind}`}><div style={{ width: `${Math.max(0, value / max * 100)}%` }} /><span>{label}</span></div>;
}

function EquipSlot({ icon, active = false }: { icon: string; active?: boolean }) {
  return <div className={`equip-slot ${active ? "active" : ""}`}>{icon}</div>;
}

function ActionCard({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return <Button variant="ghost" className="action-card" onClick={onClick}><span className="action-icon">{icon}</span><span><strong>{title}</strong><small>{subtitle}</small></span><ChevronRight /></Button>;
}