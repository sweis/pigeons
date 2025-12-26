# Pigeon Game - Developer Notes

> **Note:** Update this file as you make changes to the codebase. Keep it current with any architectural decisions, new features, or important implementation details.

> **Important:** Bump the version number in `index.html` (the `.version` div) on every commit.

## Project Overview

A 2D top-down browser game where you control a pigeon collecting breadcrumbs while avoiding cats. The game features an infinite procedurally-generated world with trees, ponds, and power-ups.

## File Structure

```
pigeons/
├── index.html          # Main HTML entry point (minimal, just structure)
├── CLAUDE.md           # This file - developer notes
├── css/
│   └── styles.css      # All CSS styles (layout, animations, responsive)
└── js/
    ├── config.js       # Game constants and configuration
    ├── utils.js        # Utility functions (math, coordinates)
    ├── world.js        # Procedural world generation
    ├── renderer.js     # Canvas rendering system
    └── game.js         # Game engine and main loop
```

## Module Responsibilities

### config.js
- All game constants (speeds, sizes, timings, scoring)
- Easy to tweak game balance without touching logic
- Constants are grouped by category with comments

### utils.js
- `hash(x, y, seed)` - Deterministic hash for procedural generation
- `distance(x1, y1, x2, y2)` - Euclidean distance
- `normalize(dx, dy)` - Vector normalization
- `randomAngle()` - Random angle in radians
- `worldToTile()`, `tileToWorld()` - Coordinate conversion

### world.js
- Procedural generation using deterministic hashing
- Tree placement with `hasTreeAt()`, `getNearestTree()`
- Pond generation with `hasPondAt()`, `isInPond()`
- Ground tile variation (grass, dirt, flowers, rocks)
- Caches generated content in Maps for performance

### renderer.js
- All canvas 2D drawing operations
- Organized by category: ground, water, trees, characters, collectibles, status icons
- Private helper methods prefixed with `_`
- Handles world-to-screen coordinate conversion
- Status icons drawn in bottom-left corner (⚡ speed, 😈 eat cats, 😺 friendly)
- Fly meter bar drawn on left side (🕊️ with vertical power bar)

### game.js
- Game state management
- Input handling (keyboard + touch + touch-to-move on canvas)
- Entity spawning and despawning
- Collision detection
- Power-up effects
- Main game loop (update → render)
- DOM elements cached in `Game.elements` for performance

## Key Gameplay Mechanics

### Movement
- Arrow keys or WASD to move
- Pigeon stays centered, world scrolls around it
- Diagonal movement is normalized to prevent speed boost

### Flying
- SPACE to fly (avoids cats while airborne)
- Flying is powered by a fly meter that charges when eating breadcrumbs
- Each breadcrumb adds 1 second of fly time (max 30 seconds)
- Fly meter displayed as vertical bar on the left side of screen
- Flying onto/off trees is free (no meter cost)
- Can fly onto nearby trees for safety

### Entities
- **Breadcrumbs**: +10 points, +1s fly time, spawn continuously
- **Chests**: Speed boost for 20 seconds, +50 points
- **Diamonds**: "Eat Cats" mode for 20 seconds, +100 points
- **Cats**: Chase pigeon, flee during Eat Cats mode, can't climb trees

### World Generation
- Infinite world using deterministic hash functions
- Trees and ponds generated procedurally by tile position
- Entities despawn when far from player
- Ground has subtle color variation and decorations

## Technical Notes

### Coordinate Systems
- **World coordinates**: Infinite, pigeon starts at (0, 0)
- **Tile coordinates**: World divided into CONFIG.TILE_SIZE grid
- **Screen coordinates**: Canvas pixels, camera-relative

### Depth Sorting
- Entities sorted by Y coordinate before rendering
- Creates proper overlap (entities lower on screen appear in front)

### Cat AI
- Cats chase pigeon using direction vectors
- Navigate around ponds by trying perpendicular movement
- Cannot climb trees (trees are safe zones for the pigeon)
- Run away (30% faster) during Eat Cats mode
- Friendly mode (press C): Cats wander randomly and don't hurt the pigeon

### Performance Considerations
- DOM elements cached at init to avoid repeated lookups
- Ground tiles cached in Map
- Trees/ponds use lazy generation with caching
- Entities beyond DESPAWN_RADIUS are removed
- Single requestAnimationFrame loop

## Mobile Support
- Touch controls: D-pad for movement, fly button, peaceful mode button
- Touch-to-move: Tap anywhere on canvas to move pigeon there
- Responsive CSS scales canvas to screen
- Touch events use `passive: false` to prevent scrolling
- Fly indicator hidden on mobile (uses button instead)

## Future Ideas
- Sound effects
- More enemy types
- Day/night cycle
- Achievements
- Leaderboard
