# ASHEN VALE v2.3 Mobile-First Adaptive Client

## Goal
Rebuild the client’s phone and tablet presentation around the v2.3 mobile-first rules while preserving the existing desktop MMORPG HUD, artwork, combat engine, inventory, travel, and Chronicle.

## What will change
- Make the game shell use the dynamic mobile viewport and device safe areas, with the world remaining visible between a compact identity strip and thumb-reach controls.
- Add capability-aware layout modes for mobile portrait, mobile landscape, tablet, and desktop. Layout detection will combine viewport shape/size with pointer and hover capability instead of relying on width alone.
- Replace mobile side drawers and centered dialogs with native-feeling bottom sheets for Character, Bag, Adventure, Combat ledger, Lantern Hub, Chronicle, item inspection, stat details, and NPC interactions.
- Give every sheet a drag handle, safe-area spacing, backdrop dismissal, smooth touch scrolling, and a single scrollable content region so the page cannot become trapped or frozen.
- Build the canonical six-item bottom navigation: Character, Bag, Adventure, Combat, Lantern Hub, Chronicle, including selected states and 44px minimum targets.
- Recompose the compact mobile identity strip to show Nikki, level, HP/MP, gold/crystals, bag count, and the current location without obscuring the world.
- Add a persistent compact quest preview above the bottom navigation.
- Rework phone combat around a thumb-accessible six-action bar: Guard/Parry, Quick Slash, Power Strike, Moonveil, Potion, Retreat. Mana costs, potion count, and cooldowns remain visible without hover.
- Keep enemy intent, warning, HP, and posture highly legible over the world. Add a collapsible latest-event ticker that opens the full battle ledger sheet.
- Add a retreat action to the existing reducer so leaving combat is explicit and logged, without changing damage, posture, stagger, loot, XP, or enemy-turn rules.
- Preserve the current ornate lacquer, antique-gold relief, icon atlases, Moonlit Ridge/Lantern District artwork, and Nikki equipment switching across every adaptive mode.

## Technical details
- Add a small adaptive-client hook returning `mobile-portrait`, `mobile-landscape`, `tablet`, or `desktop`, and expose that mode on the game shell for deterministic styling.
- Split the mobile sheet/navigation/combat presentation into focused components while continuing to use the existing centralized game state and action dispatchers.
- Keep desktop left/right panels, chat, utility rail, and hotbar available at desktop sizes; tablet progressively condenses them rather than inheriting the phone layout unchanged.
- Use `100dvh`, `env(safe-area-inset-*)`, `overscroll-behavior`, `touch-action`, and `-webkit-overflow-scrolling: touch`; remove the current mobile `100svh`, full-height side drawers, and nested overflow conflicts.
- Add accessible labels, current-tab state, focus handling, Escape dismissal, and 44×44px targets for all mobile controls.

## Verification
- Test mobile portrait and landscape, tablet, and desktop layouts for clipping, overlap, safe-area clearance, and horizontal overflow.
- Verify backdrop dismissal, sheet scrolling, all six navigation destinations, item inspection/equip/use, NPC interaction, combat ticker/ledger, potion use, retreat, and a complete combat victory flow.
- Run formatting, lint, and production build checks.

## Scope boundary
This overhaul changes adaptive presentation and adds retreat/log viewing behavior only. Existing combat balance, progression, loot, currencies, art direction, and desktop gameplay remain intact.
