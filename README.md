# Ashen Vale Echo

Build ASHEN VALE, a playable text-first fantasy MMORPG prototype directly matching the attached reference image visual design and layout.

Do NOT build a landing page, SaaS dashboard, or documentation site. The app must load directly into the playable MMORPG client interface.

Key Requirements:
1. Visual & Layout (Matching Attached Reference Image):
- Deep fantasy aesthetic inspired by classic Korean PC MMORPGs: dark aged metal/wood frames, intricate gold filigree, ornate borders, atmospheric depth, fantasy serif typography.
- Top Bar: Ashen Vale emblem, location breadcrumb ('Moonlit Ridge / Valley of Whispers'), gold currency (2,450), crystals (380), bag slots (23/40), utility buttons.
- Left Panel:
  - Nikki Lv. 12 Wanderer portrait with dynamic HP (428/428) and MP (163/163) bars and level badge.
  - Equipment window with equipped slots framing the central character preview.
  - Inventory window with category tabs (All, Weapons, Armor, Consumables, Materials, Quest), item grid with rarity borders and counts, item detail popover with stat comparisons and an [Equip] / [Use] button.
- Center World Stage:
  - Moonlit Ridge background: large glowing moon, misty mountains, waterfalls, lit pagoda temple city, cherry blossom trees, stone path.
  - Central standing character model (Nikki) whose equipment and weapon visuals update visibly when different gear is equipped (e.g. Moonsteel Sword vs Iron Dagger vs Ashen Blade, robes vs armor).
- Right Panel:
  - Ornate circular minimap showing Moonlit Ridge coordinates (128, 76).
  - Adventure Feed with narrative descriptions and interactive action cards: 'Explore the area', 'Hunt Bandits', 'Gather Resources', 'Travel to Temple City'.
  - Main Quest tracker: 'The Hollow Moon - Investigate the strange lights in the valley'.
- Bottom Area:
  - Combat / System / World chat log with message history and input.
  - Ornate Action Bar (hotbar) with slots (keys 1, 3, 4, 5, Q, W, E, R) showing skills with cooldowns and mana costs (Quick Slash, Power Strike, Moonveil, Potions).
  - EXP bar (e.g. 4,320 / 12,800 - 34%).

2. Fully Functional Gameplay Loop:
- Explore the area: triggers random events (discover resources, find secrets, or trigger combat encounters).
- Gather resources: yields materials (Wild Herb, Iron Ore, Silverleaf) directly into inventory.
- Combat system: Enter combat against enemies like Ridge Bandit, Ashen Wolf, or Hollow Guardian. Includes turn/action engine, player & enemy HP/MP, skill activations with cooldowns, damage calculations taking equipped stats into account, combat log entries, critical strikes, and victory/defeat screens.
- Victory drops XP and real loot (e.g. Bandit's Iron Dagger, Moonlit Boots, Silverleaf Potion).
- Inventory & Equipment: Loot is stored in inventory. Equipping an item modifies character stats (Attack, Defense, Crit) and visibly updates the character's appearance in the character window and world view.
- Responsive design: Fully playable on mobile screens via elegant collapsible side drawers or modal overlays without losing the immersive MMORPG look.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6fd70684-4717-4fc2-92af-2020b625bb98).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
