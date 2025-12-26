/**
 * Rendering system for the game
 * Handles all canvas drawing operations
 */
const Renderer = {
    ctx: null,
    canvas: null,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    },

    clear() {
        this.ctx.fillStyle = '#4a7c3f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    worldToScreen(worldX, worldY, camX, camY) {
        return {
            x: worldX - camX,
            y: worldY - camY
        };
    },

    // ========================================
    // Ground and Environment
    // ========================================

    drawGround(camX, camY) {
        const startX = Math.floor(camX / CONFIG.TILE_SIZE) - 1;
        const startY = Math.floor(camY / CONFIG.TILE_SIZE) - 1;
        const tilesX = Math.ceil(this.canvas.width / CONFIG.TILE_SIZE) + 2;
        const tilesY = Math.ceil(this.canvas.height / CONFIG.TILE_SIZE) + 2;

        for (let ty = startY; ty < startY + tilesY; ty++) {
            for (let tx = startX; tx < startX + tilesX; tx++) {
                const tile = World.getGroundTile(tx, ty);
                const screenX = tx * CONFIG.TILE_SIZE - camX;
                const screenY = ty * CONFIG.TILE_SIZE - camY;

                this._drawGroundTile(screenX, screenY, tile);
            }
        }
    },

    _drawGroundTile(screenX, screenY, tile) {
        const colors = {
            dirt: { r: 139, g: 115, b: 85, vr: 1, vg: 0.7, vb: 0.5 },
            darkgrass: { r: 55, g: 95, b: 45, vr: 0.5, vg: 1, vb: 0.3 },
            grass: { r: 74, g: 124, b: 63, vr: 0.6, vg: 1, vb: 0.4 }
        };

        const c = colors[tile.type] || colors.grass;
        const r = c.r + tile.variation * c.vr;
        const g = c.g + tile.variation * c.vg;
        const b = c.b + tile.variation * c.vb;

        this.ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
        this.ctx.fillRect(screenX, screenY, CONFIG.TILE_SIZE + 1, CONFIG.TILE_SIZE + 1);

        // Add texture based on tile type
        this._drawTileTexture(screenX, screenY, tile.type, r, g, b);

        const centerX = screenX + CONFIG.TILE_SIZE / 2;
        const centerY = screenY + CONFIG.TILE_SIZE / 2;

        if (tile.hasFlower) this._drawFlower(centerX, centerY);
        if (tile.hasRock) this._drawRock(centerX, centerY);
        if (tile.hasTuft) this._drawGrassTuft(centerX, centerY);
    },

    _drawTileTexture(screenX, screenY, type, baseR, baseG, baseB) {
        const size = CONFIG.TILE_SIZE;

        if (type === 'grass' || type === 'darkgrass') {
            // Draw small grass blade marks
            const bladeColor = type === 'darkgrass'
                ? `rgb(${baseR - 15 | 0}, ${baseG + 10 | 0}, ${baseB - 10 | 0})`
                : `rgb(${baseR - 10 | 0}, ${baseG + 15 | 0}, ${baseB - 5 | 0})`;

            this.ctx.strokeStyle = bladeColor;
            this.ctx.lineWidth = 1;

            for (let i = 0; i < 6; i++) {
                const hx = hash(screenX + i, screenY, 20);
                const hy = hash(screenX, screenY + i, 21);
                const x = screenX + hx * size;
                const y = screenY + hy * size;
                const angle = hash(screenX + i, screenY + i, 22) * 0.6 - 0.3;

                this.ctx.beginPath();
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x + Math.sin(angle) * 4, y - 4);
                this.ctx.stroke();
            }

            // Add a few lighter spots
            this.ctx.fillStyle = `rgba(${baseR + 20 | 0}, ${baseG + 25 | 0}, ${baseB + 10 | 0}, 0.4)`;
            for (let i = 0; i < 3; i++) {
                const hx = hash(screenX, screenY + i, 23);
                const hy = hash(screenX + i, screenY, 24);
                this.ctx.beginPath();
                this.ctx.arc(screenX + hx * size, screenY + hy * size, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else if (type === 'dirt') {
            // Draw small pebbles and specks
            for (let i = 0; i < 5; i++) {
                const hx = hash(screenX + i, screenY, 25);
                const hy = hash(screenX, screenY + i, 26);
                const x = screenX + hx * size;
                const y = screenY + hy * size;
                const shade = hash(screenX + i, screenY + i, 27);

                // Pebble
                const pr = baseR + (shade > 0.5 ? 20 : -15);
                const pg = baseG + (shade > 0.5 ? 15 : -10);
                const pb = baseB + (shade > 0.5 ? 10 : -8);
                this.ctx.fillStyle = `rgb(${pr | 0}, ${pg | 0}, ${pb | 0})`;
                this.ctx.beginPath();
                this.ctx.ellipse(x, y, 2 + shade, 1.5 + shade * 0.5, shade * Math.PI, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Add some darker dirt specks
            this.ctx.fillStyle = `rgba(${baseR - 25 | 0}, ${baseG - 20 | 0}, ${baseB - 15 | 0}, 0.5)`;
            for (let i = 0; i < 4; i++) {
                const hx = hash(screenX + i * 2, screenY, 28);
                const hy = hash(screenX, screenY + i * 2, 29);
                this.ctx.beginPath();
                this.ctx.arc(screenX + hx * size, screenY + hy * size, 1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    },

    _drawFlower(x, y) {
        const colors = ['#FFE4B5', '#FFB6C1', '#E6E6FA', '#FFFACD'];
        this.ctx.fillStyle = colors[Math.floor(hash(x, y, 10) * colors.length)];

        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            this.ctx.beginPath();
            this.ctx.arc(x + Math.cos(angle) * 4, y + Math.sin(angle) * 4, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 2, 0, Math.PI * 2);
        this.ctx.fill();
    },

    _drawRock(x, y) {
        this.ctx.fillStyle = '#888';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 8, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#aaa';
        this.ctx.beginPath();
        this.ctx.ellipse(x - 2, y - 2, 3, 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
    },

    _drawGrassTuft(x, y) {
        this.ctx.strokeStyle = '#2d5a1e';
        this.ctx.lineWidth = 2;

        for (let i = 0; i < 3; i++) {
            const angle = -Math.PI / 2 + (i - 1) * 0.3;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8);
            this.ctx.stroke();
        }
    },

    // ========================================
    // Water
    // ========================================

    drawPond(screenX, screenY, radiusX, radiusY) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 50, 80, 0.6)';
        this.ctx.beginPath();
        this.ctx.ellipse(screenX + 3, screenY + 3, radiusX, radiusY, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Water gradient
        const grad = this.ctx.createRadialGradient(
            screenX - radiusX * 0.3, screenY - radiusY * 0.3, 0,
            screenX, screenY, radiusX
        );
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(0.4, '#4169E1');
        grad.addColorStop(0.8, '#1E90FF');
        grad.addColorStop(1, '#00008B');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.ellipse(screenX, screenY, radiusX, radiusY, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Ripples
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        const phase = performance.now() / 1000;

        for (let i = 0; i < 3; i++) {
            const size = 0.3 + ((phase + i * 0.3) % 1) * 0.5;
            this.ctx.beginPath();
            this.ctx.ellipse(screenX, screenY, radiusX * size, radiusY * size, 0, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(
            screenX - radiusX * 0.3, screenY - radiusY * 0.3,
            radiusX * 0.3, radiusY * 0.2, -0.5, 0, Math.PI * 2
        );
        this.ctx.fill();
    },

    // ========================================
    // Trees
    // ========================================

    drawTree(screenX, screenY, hasPigeon = false) {
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(screenX, screenY + 5, 30, 15, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Trunk
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillRect(screenX - 8, screenY - 50, 16, 55);

        // Foliage layers
        const foliageColors = ['#2E7D32', '#388E3C', '#43A047'];
        for (let i = 0; i < 3; i++) {
            this.ctx.fillStyle = foliageColors[i];
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY - 50 - i * 15, 30 - i * 5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        if (hasPigeon) this._drawPigeonOnTree(screenX, screenY);
    },

    _drawPigeonOnTree(x, y) {
        this.ctx.fillStyle = '#708090';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y - 85, 12, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#607080';
        this.ctx.beginPath();
        this.ctx.arc(x + 8, y - 90, 6, 0, Math.PI * 2);
        this.ctx.fill();
    },

    // ========================================
    // Characters
    // ========================================

    drawPigeon(screenX, screenY, direction = 1, isJumping = false) {
        const jumpOffset = isJumping ? -15 : 0;
        const y = screenY + jumpOffset;

        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(screenX, screenY + 5, isJumping ? 12 : 18, isJumping ? 6 : 9, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.save();
        this.ctx.translate(screenX, y);
        this.ctx.scale(direction, 1);

        // Body
        this.ctx.fillStyle = '#708090';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Wing
        this.ctx.fillStyle = '#5A6A7A';
        this.ctx.beginPath();
        this.ctx.ellipse(-3, 2, 12, 8, -0.2, 0, Math.PI * 2);
        this.ctx.fill();

        // Neck shimmer
        this.ctx.fillStyle = '#8B5CF6';
        this.ctx.beginPath();
        this.ctx.ellipse(8, -5, 8, 6, 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        // Head
        this.ctx.fillStyle = '#607080';
        this.ctx.beginPath();
        this.ctx.arc(14, -10, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // Eye
        this._drawEye(18, -12, '#FF6B35');

        // Beak
        this.ctx.fillStyle = '#FFB347';
        this.ctx.beginPath();
        this.ctx.moveTo(22, -10);
        this.ctx.lineTo(30, -8);
        this.ctx.lineTo(22, -6);
        this.ctx.closePath();
        this.ctx.fill();

        // Tail
        this.ctx.fillStyle = '#4A5A6A';
        this.ctx.beginPath();
        this.ctx.moveTo(-18, 0);
        this.ctx.lineTo(-28, 5);
        this.ctx.lineTo(-18, 8);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    },

    drawCat(screenX, screenY, direction = 1) {
        this.ctx.save();
        this.ctx.translate(screenX, screenY);
        this.ctx.scale(direction, 1);

        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 15, 22, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Tail (animated)
        this.ctx.strokeStyle = '#E85D04';
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(-20, 0);
        const tailWave = Math.sin(performance.now() / 200) * 5;
        this.ctx.quadraticCurveTo(-30, -10 + tailWave, -25, -20 + tailWave);
        this.ctx.stroke();

        // Body
        this.ctx.fillStyle = '#E85D04';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 24, 16, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Stripes
        this.ctx.strokeStyle = '#C44D04';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(-8 + i * 8, -12);
            this.ctx.lineTo(-8 + i * 8, 12);
            this.ctx.stroke();
        }

        // Head
        this.ctx.fillStyle = '#E85D04';
        this.ctx.beginPath();
        this.ctx.arc(18, -5, 14, 0, Math.PI * 2);
        this.ctx.fill();

        // Ears
        this._drawCatEar(10, -15, 14, -28, 20, -17);
        this._drawCatEar(22, -15, 22, -28, 28, -17);

        // Inner ear
        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.beginPath();
        this.ctx.moveTo(13, -17);
        this.ctx.lineTo(15, -24);
        this.ctx.lineTo(18, -18);
        this.ctx.closePath();
        this.ctx.fill();

        // Eyes
        this._drawCatEye(14, -6);
        this._drawCatEye(24, -6);

        // Nose
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.beginPath();
        this.ctx.moveTo(19, 0);
        this.ctx.lineTo(16, 4);
        this.ctx.lineTo(22, 4);
        this.ctx.closePath();
        this.ctx.fill();

        // Whiskers
        this._drawWhiskers();

        this.ctx.restore();
    },

    _drawEye(x, y, irisColor) {
        this.ctx.fillStyle = irisColor;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(x + 1, y, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
    },

    _drawCatEar(x1, y1, x2, y2, x3, y3) {
        this.ctx.fillStyle = '#E85D04';
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineTo(x3, y3);
        this.ctx.closePath();
        this.ctx.fill();
    },

    _drawCatEye(x, y) {
        this.ctx.fillStyle = '#90EE90';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 4, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 1.5, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
    },

    _drawWhiskers() {
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(12, 2 + i * 3);
            this.ctx.lineTo(-5, i * 3);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(26, 2 + i * 3);
            this.ctx.lineTo(40, i * 3);
            this.ctx.stroke();
        }
    },

    // ========================================
    // Collectibles
    // ========================================

    drawBreadcrumb(screenX, screenY) {
        const bob = Math.sin(performance.now() / 300 + screenX * 0.1) * 3;
        const y = screenY + bob;

        // Glow
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(screenX, y, 15, 0, Math.PI * 2);
        this.ctx.fill();

        // Crumb with gradient
        const grad = this.ctx.createRadialGradient(screenX - 2, y - 2, 0, screenX, y, 8);
        grad.addColorStop(0, '#FFF8DC');
        grad.addColorStop(0.5, '#DEB887');
        grad.addColorStop(1, '#B8860B');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(screenX, y, 8, 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawChest(screenX, screenY) {
        const bob = Math.sin(performance.now() / 400) * 2;
        const y = screenY + bob;

        // Glow
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(screenX, y, 30, 0, Math.PI * 2);
        this.ctx.fill();

        // Body
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(screenX - 18, y - 10, 36, 24);

        // Lid
        this.ctx.fillStyle = '#A0522D';
        this.ctx.beginPath();
        this.ctx.moveTo(screenX - 20, y - 10);
        this.ctx.lineTo(screenX - 18, y - 20);
        this.ctx.lineTo(screenX + 18, y - 20);
        this.ctx.lineTo(screenX + 20, y - 10);
        this.ctx.closePath();
        this.ctx.fill();

        // Trim
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(screenX - 20, y - 12, 40, 4);
        this.ctx.fillRect(screenX - 4, y - 8, 8, 12);

        // Lock
        this.ctx.fillStyle = '#DAA520';
        this.ctx.beginPath();
        this.ctx.arc(screenX, y - 2, 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Bread icon
        this.ctx.fillStyle = '#F4A460';
        this.ctx.beginPath();
        this.ctx.ellipse(screenX, y - 25, 10, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#DEB887';
        this.ctx.beginPath();
        this.ctx.ellipse(screenX, y - 27, 7, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawDiamond(screenX, screenY) {
        const size = 18;
        const bob = Math.sin(performance.now() / 250) * 4;
        const y = screenY + bob;
        const rotate = performance.now() / 500;

        // Glow
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(screenX, y, 25, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.save();
        this.ctx.translate(screenX, y);

        // Diamond body with gradient
        const grad = this.ctx.createLinearGradient(-size, 0, size, 0);
        grad.addColorStop(0, '#00FFFF');
        grad.addColorStop(0.3, '#FFFFFF');
        grad.addColorStop(0.5, '#00FFFF');
        grad.addColorStop(0.7, '#FF00FF');
        grad.addColorStop(1, '#00FFFF');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size);
        this.ctx.lineTo(size, 0);
        this.ctx.lineTo(0, size * 1.2);
        this.ctx.lineTo(-size, 0);
        this.ctx.closePath();
        this.ctx.fill();

        // Inner shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size * 0.6);
        this.ctx.lineTo(size * 0.4, 0);
        this.ctx.lineTo(0, size * 0.3);
        this.ctx.lineTo(-size * 0.4, 0);
        this.ctx.closePath();
        this.ctx.fill();

        // Sparkles
        this.ctx.fillStyle = '#FFF';
        for (let i = 0; i < 4; i++) {
            const angle = rotate + (i * Math.PI / 2);
            const sx = Math.cos(angle) * size * 0.5;
            const sy = Math.sin(angle) * size * 0.5;
            this.ctx.beginPath();
            this.ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    },

    // ========================================
    // Status Icons
    // ========================================

    drawStatusIcons(speedBoostRemaining, catEaterRemaining, friendlyMode) {
        const x = 10;
        let y = this.canvas.height - 15;
        const spacing = 28;

        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        // Speed boost
        if (speedBoostRemaining > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(x - 2, y - 12, 60, 24);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '20px sans-serif';
            this.ctx.fillText('⚡', x, y);
            this.ctx.font = 'bold 14px monospace';
            this.ctx.fillText(speedBoostRemaining + 's', x + 26, y);
            y -= spacing;
        }

        // Cat eater mode
        if (catEaterRemaining > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(x - 2, y - 12, 60, 24);
            this.ctx.fillStyle = '#FF00FF';
            this.ctx.font = '20px sans-serif';
            this.ctx.fillText('😈', x, y);
            this.ctx.font = 'bold 14px monospace';
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.fillText(catEaterRemaining + 's', x + 26, y);
            y -= spacing;
        }

        // Friendly cat mode (no timer, just on/off)
        if (friendlyMode) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(x - 2, y - 12, 45, 24);
            this.ctx.font = '20px sans-serif';
            this.ctx.fillText('😺', x, y);
            this.ctx.font = 'bold 14px monospace';
            this.ctx.fillStyle = '#90EE90';
            this.ctx.fillText('ON', x + 26, y);
        }
    }
};
