# Pigeon Game - Developer Notes

> **Note:** Update this file as you make changes to the codebase. Keep it current with any architectural decisions, new features, or important implementation details.

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
- `randomAngle()`, `randomRange(min, max)` - Random helpers
- `worldToTile()`, `tileToWorld()` - Coordinate conversion

### world.js
- Procedural generation using deterministic hashing
- Tree placement with `hasTreeAt()`, `getNearestTree()`
- Pond generation with `hasPondAt()`, `isInPond()`
- Ground tile variation (grass, dirt, flowers, rocks)
- Caches generated content in Maps for performance

### renderer.js
- All canvas 2D drawing operations
- Organized by category: ground, water, trees, characters, collectibles
- Private helper methods prefixed with `_`
- Handles world-to-screen coordinate conversion

### game.js
- Game state management
- Input handling (keyboard + touch)
- Entity spawning and despawning
- Collision detection
- Power-up effects
- Main game loop (update → render)

## Key Gameplay Mechanics

### Movement
- Arrow keys or WASD to move
- Pigeon stays centered, world scrolls around it
- Diagonal movement is normalized to prevent speed boost

### Jumping
- SPACE to jump (avoids cats, enters/exits trees)
- Jump cooldown prevents spam
- Can jump onto nearby trees for safety

### Entities
- **Breadcrumbs**: +10 points, spawn continuously
- **Chests**: Speed boost for 20 seconds, +50 points
- **Diamonds**: "Eat Cats" mode for 20 seconds, +100 points
- **Cats**: Chase pigeon, climb trees, flee during Eat Cats mode

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

### Performance Considerations
- Ground tiles cached in Map
- Trees/ponds use lazy generation with caching
- Entities beyond DESPAWN_RADIUS are removed
- Single requestAnimationFrame loop

## Mobile Support
- Touch controls: D-pad for movement, jump button
- Responsive CSS scales canvas to screen
- Touch events use `passive: false` to prevent scrolling

## Future Ideas
- Sound effects
- More enemy types
- Day/night cycle
- Achievements
- Leaderboard
