/**
 * World generation and management
 * Handles procedural generation of trees, ponds, and ground tiles
 */
const World = {
    trees: new Map(),
    ponds: new Map(),
    groundCache: new Map(),

    /**
     * Check if a tree exists at the given world coordinates
     * Uses deterministic generation based on tile position
     */
    hasTreeAt(worldX, worldY) {
        const { tx, ty } = worldToTile(worldX, worldY);
        const key = `${tx},${ty}`;

        if (this.trees.has(key)) {
            return this.trees.get(key);
        }

        const h = hash(tx, ty, 42);
        if (h < CONFIG.TREE_DENSITY) {
            const pos = tileToWorld(tx, ty);
            const tree = {
                x: pos.x,
                y: pos.y,
                radius: CONFIG.TREE_COLLISION_RADIUS,
                climbingCat: null
            };
            this.trees.set(key, tree);
            return tree;
        }

        this.trees.set(key, null);
        return null;
    },

    /**
     * Check if a pond exists at the given world coordinates
     */
    hasPondAt(worldX, worldY) {
        const { tx, ty } = worldToTile(worldX, worldY);
        const key = `${tx},${ty}`;

        if (this.ponds.has(key)) {
            return this.ponds.get(key);
        }

        // Don't place pond where tree exists
        if (this.hasTreeAt(worldX, worldY)) {
            this.ponds.set(key, null);
            return null;
        }

        const h = hash(tx, ty, 99);
        if (h < CONFIG.POND_DENSITY) {
            const pos = tileToWorld(tx, ty);
            const pond = {
                x: pos.x,
                y: pos.y,
                radiusX: 35 + hash(tx, ty, 100) * 20,
                radiusY: 25 + hash(tx, ty, 101) * 15
            };
            this.ponds.set(key, pond);
            return pond;
        }

        this.ponds.set(key, null);
        return null;
    },

    /**
     * Check if a point is inside any pond
     */
    isInPond(worldX, worldY) {
        const { tx, ty } = worldToTile(worldX, worldY);
        const searchRadius = 2;

        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                const checkX = (tx + dx) * CONFIG.TILE_SIZE;
                const checkY = (ty + dy) * CONFIG.TILE_SIZE;
                const pond = this.hasPondAt(checkX, checkY);

                if (pond) {
                    const normX = (worldX - pond.x) / pond.radiusX;
                    const normY = (worldY - pond.y) / pond.radiusY;
                    if (normX * normX + normY * normY < 1) {
                        return pond;
                    }
                }
            }
        }
        return null;
    },

    /**
     * Get ground tile data for procedural terrain
     */
    getGroundTile(tx, ty) {
        const key = `${tx},${ty}`;

        if (this.groundCache.has(key)) {
            return this.groundCache.get(key);
        }

        const h1 = hash(tx, ty, 1);
        const h2 = hash(tx, ty, 2);
        const h3 = hash(tx, ty, 3);

        let type = 'grass';
        if (h1 > 0.92) type = 'dirt';
        else if (h1 > 0.85) type = 'darkgrass';

        const tile = {
            type,
            variation: h2 * 20 - 10,
            hasFlower: h3 > 0.95,
            hasRock: h3 < 0.03,
            hasTuft: h2 > 0.9
        };

        this.groundCache.set(key, tile);
        return tile;
    },

    /**
     * Get all trees visible in the camera view
     */
    getTreesInView(camX, camY, width, height) {
        return this._getEntitiesInView(camX, camY, width, height, (x, y) => this.hasTreeAt(x, y));
    },

    /**
     * Get all ponds visible in the camera view
     */
    getPondsInView(camX, camY, width, height) {
        return this._getEntitiesInView(camX, camY, width, height, (x, y) => this.hasPondAt(x, y));
    },

    /**
     * Helper to get entities in view
     */
    _getEntitiesInView(camX, camY, width, height, getter) {
        const result = [];
        const margin = CONFIG.TILE_SIZE * 2;
        const startX = Math.floor((camX - margin) / CONFIG.TILE_SIZE);
        const startY = Math.floor((camY - margin) / CONFIG.TILE_SIZE);
        const endX = Math.ceil((camX + width + margin) / CONFIG.TILE_SIZE);
        const endY = Math.ceil((camY + height + margin) / CONFIG.TILE_SIZE);

        for (let ty = startY; ty <= endY; ty++) {
            for (let tx = startX; tx <= endX; tx++) {
                const entity = getter(tx * CONFIG.TILE_SIZE, ty * CONFIG.TILE_SIZE);
                if (entity) {
                    result.push(entity);
                }
            }
        }
        return result;
    },

    /**
     * Find the nearest tree within a given distance
     */
    getNearestTree(worldX, worldY, maxDist) {
        const { tx, ty } = worldToTile(worldX, worldY);
        const searchRadius = Math.ceil(maxDist / CONFIG.TILE_SIZE) + 1;

        let nearest = null;
        let nearestDist = maxDist;

        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                const tree = this.hasTreeAt((tx + dx) * CONFIG.TILE_SIZE, (ty + dy) * CONFIG.TILE_SIZE);
                if (tree) {
                    const dist = distance(worldX, worldY, tree.x, tree.y);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearest = tree;
                    }
                }
            }
        }
        return nearest;
    },

    /**
     * Reset all cached world data
     */
    reset() {
        this.trees.clear();
        this.ponds.clear();
        this.groundCache.clear();
    }
};
