# ASHEN VALE Playable MMORPG Prototype

## Goal
Build a single-screen, text-first fantasy MMORPG client that opens directly into Moonlit Ridge and closely follows the uploaded reference’s composition, density, and ornate Korean-PC-MMORPG aesthetic.

## What will be built
- A full-screen game shell with the exact major regions from the reference: top status bar, left character/equipment/inventory panels, central world stage, right minimap/adventure/quest panels, chat, hotbar, and EXP bar.
- Original Moonlit Ridge artwork and character/equipment visuals inspired by the reference without embedding the reference screenshot.
- Responsive mobile controls that move the left and right panels into accessible drawers while keeping the world, combat state, and hotbar playable.
- A complete local gameplay loop:
  - Explore, hunt, gather, and travel actions with varied narrative outcomes.
  - Turn-based encounters against Ridge Bandit, Ashen Wolf, and Hollow Guardian.
  - HP/MP, damage, defense, crits, cooldowns, consumables, enemy turns, victory, defeat, XP, and loot.
  - Inventory categories, stack counts, item inspection, comparisons, equip/use actions, and live stat recalculation.
  - Visible weapon and armor changes in both character views.
  - Functional chat tabs/input, quest progress, action hotkeys, and combat history.

## Visual direction
- Near-black lacquered wood and aged metal, bronze-gold filigree, moonlit blue world lighting, crimson accents, compact fantasy serif typography, engraved borders, and restrained atmospheric motion.
- Dense desktop composition faithful to the reference; no landing page, marketing sections, dashboard framing, or documentation content.
- Semantic color and surface tokens will drive all styling, including contrast-safe mobile states.

## Technical details
- Keep the experience on `/` with route-specific title, description, Open Graph, and Twitter metadata.
- Use React state/reducer logic for deterministic, testable gameplay; persistence and multiplayer services are outside this prototype scope.
- Generate and bundle original environment, portrait, character, minimap, item, and skill artwork needed for a cohesive interface.
- Split the implementation into focused game-state, data, and interface modules rather than one oversized page file.
- Verify desktop and mobile rendering plus the primary gather → inventory, equip → stat/appearance, and combat → loot/XP flows.

## Scope boundary
This is a polished playable single-player prototype that simulates an MMORPG client. Accounts, shared online worlds, real-time multiplayer, and server persistence are not included.
