/**
 * Utility functions for the game
 */

/**
 * Deterministic hash function for procedural generation
 * Returns a value between 0 and 1
 */
function hash(x, y, seed = 0) {
    const h = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.758) * 43758.5453;
    return h - Math.floor(h);
}

/**
 * Calculate distance between two points
 */
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize a vector and return its components
 */
function normalize(dx, dy) {
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return { x: 0, y: 0 };
    return { x: dx / len, y: dy / len };
}

/**
 * Get a random angle in radians
 */
function randomAngle() {
    return Math.random() * Math.PI * 2;
}

/**
 * Convert world coordinates to tile coordinates
 */
function worldToTile(worldX, worldY) {
    return {
        tx: Math.floor(worldX / CONFIG.TILE_SIZE),
        ty: Math.floor(worldY / CONFIG.TILE_SIZE)
    };
}

/**
 * Convert tile coordinates to world coordinates (center of tile)
 */
function tileToWorld(tx, ty) {
    return {
        x: tx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
        y: ty * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2
    };
}
