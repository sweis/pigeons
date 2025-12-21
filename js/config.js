/**
 * Game configuration constants
 */
const CONFIG = {
    // Canvas dimensions
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 500,
    TILE_SIZE: 40,

    // Player settings
    PIGEON_SPEED: 3,
    JUMP_DURATION: 400,
    JUMP_COOLDOWN: 600,

    // Enemy settings
    CAT_BASE_SPEED: 1.5,
    CAT_FLEE_MULTIPLIER: 1.3,

    // Spawning
    SPAWN_RADIUS: 400,
    DESPAWN_RADIUS: 600,

    // World generation
    TREE_DENSITY: 0.02,
    POND_DENSITY: 0.015,

    // Timing (ms)
    BREADCRUMB_SPAWN_INTERVAL: 2000,
    CHEST_SPAWN_INTERVAL: 15000,
    DIAMOND_SPAWN_INTERVAL: 25000,
    POWERUP_DURATION: 20000,

    // Scoring
    BREADCRUMB_POINTS: 10,
    CHEST_POINTS: 50,
    DIAMOND_POINTS: 100,
    CAT_EAT_POINTS: 200,

    // Collision radii
    PICKUP_RADIUS: 25,
    POWERUP_RADIUS: 35,
    CAT_COLLISION_RADIUS: 35,
    TREE_COLLISION_RADIUS: 25,

    // Limits
    MAX_CHESTS: 2,
    MAX_DIAMONDS: 1,
    INITIAL_BREADCRUMBS: 8,

    // Debug
    DEBUG: false
};
