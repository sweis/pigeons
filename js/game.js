/**
 * Main game engine
 * Handles game state, input, spawning, and game loop
 */
const Game = {
    // State
    running: false,
    score: 0,
    highScore: 0,
    pigeon: null,
    cats: [],
    breadcrumbs: [],
    chests: [],
    diamonds: [],
    keys: {},

    // Spawn timers
    lastCatSpawn: 0,
    lastBreadcrumbSpawn: 0,
    lastChestSpawn: 0,
    lastDiamondSpawn: 0,

    // ========================================
    // Initialization
    // ========================================

    init() {
        Renderer.init(document.getElementById('gameCanvas'));
        this.loadHighScore();
        this.setupKeyboardControls();
        this.setupTouchControls();
        this.renderStartScreen();
    },

    loadHighScore() {
        this.highScore = parseInt(localStorage.getItem('pigeonHighScore')) || 0;
        document.getElementById('highScore').textContent = this.highScore;
    },

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }

            if (e.key === ' ') {
                this.running ? this.tryJump() : this.start();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    },

    setupTouchControls() {
        const dpadBtns = document.querySelectorAll('.dpad-btn');
        const jumpBtn = document.getElementById('jumpBtn');
        const dirKeyMap = { up: 'w', down: 's', left: 'a', right: 'd' };

        dpadBtns.forEach(btn => {
            const key = dirKeyMap[btn.dataset.dir];

            const start = (e) => {
                e.preventDefault();
                this.keys[key] = true;
                btn.classList.add('active');
            };

            const end = (e) => {
                e.preventDefault();
                this.keys[key] = false;
                btn.classList.remove('active');
            };

            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('touchend', end, { passive: false });
            btn.addEventListener('touchcancel', end, { passive: false });
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
            btn.addEventListener('mouseleave', end);
        });

        const jumpStart = (e) => {
            e.preventDefault();
            this.running ? this.tryJump() : this.start();
            jumpBtn.classList.add('active');
        };

        const jumpEnd = (e) => {
            e.preventDefault();
            jumpBtn.classList.remove('active');
        };

        jumpBtn.addEventListener('touchstart', jumpStart, { passive: false });
        jumpBtn.addEventListener('touchend', jumpEnd, { passive: false });
        jumpBtn.addEventListener('touchcancel', jumpEnd, { passive: false });
        jumpBtn.addEventListener('mousedown', jumpStart);
        jumpBtn.addEventListener('mouseup', jumpEnd);
        jumpBtn.addEventListener('mouseleave', jumpEnd);

        // Prevent scrolling
        document.querySelector('.game-container').addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    },

    renderStartScreen() {
        Renderer.clear();
        Renderer.drawPigeon(300, 250, 1, false);
        Renderer.drawTree(150, 200);
        Renderer.drawTree(450, 300);
        Renderer.drawBreadcrumb(350, 180);
        Renderer.drawCat(200, 350, 1);

        Renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        Renderer.ctx.font = 'bold 28px Segoe UI';
        Renderer.ctx.textAlign = 'center';
        Renderer.ctx.fillText('Press Start to Play!', 300, 80);
    },

    // ========================================
    // Game Start/End
    // ========================================

    start() {
        World.reset();
        this.resetState();
        this.updateUI();

        for (let i = 0; i < CONFIG.INITIAL_BREADCRUMBS; i++) {
            this.spawnBreadcrumb();
        }

        this.running = true;
        requestAnimationFrame((t) => this.loop(t));
    },

    resetState() {
        this.pigeon = {
            x: 0,
            y: 0,
            speed: CONFIG.PIGEON_SPEED,
            direction: 1,
            isJumping: false,
            jumpStartTime: 0,
            lastJumpTime: 0,
            onTree: null,
            speedBoostEnd: 0,
            catEaterEnd: 0
        };

        this.cats = [];
        this.breadcrumbs = [];
        this.chests = [];
        this.diamonds = [];
        this.score = 0;
        this.lastCatSpawn = 0;
        this.lastBreadcrumbSpawn = 0;
        this.lastChestSpawn = 0;
        this.lastDiamondSpawn = 0;
    },

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('startBtn').textContent = 'Restart';
        document.getElementById('jumpIndicator').style.display = 'block';
    },

    end() {
        this.running = false;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pigeonHighScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
        }

        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('jumpIndicator').style.display = 'none';
    },

    // ========================================
    // Player Actions
    // ========================================

    tryJump() {
        const now = performance.now();

        if (this.pigeon.isJumping) return;
        if (now - this.pigeon.lastJumpTime < CONFIG.JUMP_COOLDOWN) return;

        // Jump off tree
        if (this.pigeon.onTree) {
            const tree = this.pigeon.onTree;
            this.pigeon.onTree = null;
            this.pigeon.isJumping = true;
            this.pigeon.jumpStartTime = now;
            this.pigeon.lastJumpTime = now;
            this.pigeon.x = tree.x + 40 * this.pigeon.direction;
            return;
        }

        // Jump onto nearby tree
        const nearTree = World.getNearestTree(this.pigeon.x, this.pigeon.y, 50);
        if (nearTree) {
            this.pigeon.onTree = nearTree;
            this.pigeon.x = nearTree.x;
            this.pigeon.y = nearTree.y;
            this.pigeon.lastJumpTime = now;
            return;
        }

        // Regular jump
        this.pigeon.isJumping = true;
        this.pigeon.jumpStartTime = now;
        this.pigeon.lastJumpTime = now;
    },

    // ========================================
    // Spawning
    // ========================================

    spawnBreadcrumb() {
        const pos = this._getSpawnPosition(100, 250);
        if (!World.getNearestTree(pos.x, pos.y, 30)) {
            this.breadcrumbs.push(pos);
        }
    },

    spawnCat() {
        const angle = randomAngle();
        const x = this.pigeon.x + Math.cos(angle) * CONFIG.SPAWN_RADIUS;
        const y = this.pigeon.y + Math.sin(angle) * CONFIG.SPAWN_RADIUS;

        const dir = normalize(this.pigeon.x - x, this.pigeon.y - y);

        this.cats.push({
            x, y,
            dirX: dir.x,
            dirY: dir.y,
            speed: CONFIG.CAT_BASE_SPEED + this.score / 500,
            direction: dir.x > 0 ? 1 : -1,
            climbingTree: null,
            climbProgress: 0
        });
    },

    spawnChest() {
        const pos = this._getSpawnPosition(150, 200);
        if (!World.getNearestTree(pos.x, pos.y, 40) && !World.isInPond(pos.x, pos.y)) {
            this.chests.push(pos);
        }
    },

    spawnDiamond() {
        const pos = this._getSpawnPosition(180, 220);
        if (!World.getNearestTree(pos.x, pos.y, 40) && !World.isInPond(pos.x, pos.y)) {
            this.diamonds.push(pos);
        }
    },

    _getSpawnPosition(minDist, range) {
        const angle = randomAngle();
        const dist = minDist + Math.random() * range;
        return {
            x: this.pigeon.x + Math.cos(angle) * dist,
            y: this.pigeon.y + Math.sin(angle) * dist
        };
    },

    // ========================================
    // Update Loop
    // ========================================

    update(timestamp) {
        this.updateJumpState(timestamp);
        this.updateJumpIndicator(timestamp);
        this.updatePigeonMovement();
        this.updateSpawning(timestamp);
        this.updatePowerups(timestamp);
        this.updateCats(timestamp);
        this.cleanupEntities();
        this.checkCollisions(timestamp);
    },

    updateJumpState(timestamp) {
        if (this.pigeon.isJumping && timestamp - this.pigeon.jumpStartTime > CONFIG.JUMP_DURATION) {
            this.pigeon.isJumping = false;
        }
    },

    updateJumpIndicator(timestamp) {
        const indicator = document.getElementById('jumpIndicator');
        const jumpBtn = document.getElementById('jumpBtn');
        const canJump = timestamp - this.pigeon.lastJumpTime >= CONFIG.JUMP_COOLDOWN;

        if (this.pigeon.isJumping) {
            indicator.textContent = 'JUMPING!';
            indicator.className = 'jump-indicator';
            jumpBtn.textContent = 'JUMP!';
            jumpBtn.classList.remove('cooldown');
        } else if (this.pigeon.onTree) {
            indicator.textContent = 'SPACE to Jump Off';
            indicator.className = 'jump-indicator';
            jumpBtn.textContent = 'JUMP OFF';
            jumpBtn.classList.remove('cooldown');
        } else {
            indicator.textContent = canJump ? 'SPACE to Jump' : 'Cooldown...';
            indicator.className = 'jump-indicator' + (canJump ? '' : ' cooldown');
            jumpBtn.textContent = canJump ? 'JUMP' : '...';
            jumpBtn.classList.toggle('cooldown', !canJump);
        }
    },

    updatePigeonMovement() {
        if (this.pigeon.onTree) return;

        let dx = 0, dy = 0;

        if (this.keys['arrowup'] || this.keys['w']) dy -= 1;
        if (this.keys['arrowdown'] || this.keys['s']) dy += 1;
        if (this.keys['arrowleft'] || this.keys['a']) dx -= 1;
        if (this.keys['arrowright'] || this.keys['d']) dx += 1;

        if (dx === 0 && dy === 0) return;

        const dir = normalize(dx, dy);
        const newX = this.pigeon.x + dir.x * this.pigeon.speed;
        const newY = this.pigeon.y + dir.y * this.pigeon.speed;

        // Check collision with trees (unless jumping)
        const blocked = !this.pigeon.isJumping && World.getNearestTree(newX, newY, CONFIG.TREE_COLLISION_RADIUS);

        if (!blocked) {
            this.pigeon.x = newX;
            this.pigeon.y = newY;
        }

        if (dx > 0) this.pigeon.direction = 1;
        else if (dx < 0) this.pigeon.direction = -1;
    },

    updateSpawning(timestamp) {
        if (timestamp - this.lastBreadcrumbSpawn > CONFIG.BREADCRUMB_SPAWN_INTERVAL) {
            this.spawnBreadcrumb();
            this.lastBreadcrumbSpawn = timestamp;
        }

        const catInterval = Math.max(3000 - this.score * 20, 1500);
        if (timestamp - this.lastCatSpawn > catInterval) {
            this.spawnCat();
            this.lastCatSpawn = timestamp;
        }

        if (timestamp - this.lastChestSpawn > CONFIG.CHEST_SPAWN_INTERVAL && this.chests.length < CONFIG.MAX_CHESTS) {
            this.spawnChest();
            this.lastChestSpawn = timestamp;
        }

        if (timestamp - this.lastDiamondSpawn > CONFIG.DIAMOND_SPAWN_INTERVAL && this.diamonds.length < CONFIG.MAX_DIAMONDS) {
            this.spawnDiamond();
            this.lastDiamondSpawn = timestamp;
        }
    },

    updatePowerups(timestamp) {
        const speedBoostEl = document.getElementById('speedBoost');
        const isBoosted = timestamp < this.pigeon.speedBoostEnd;

        if (isBoosted) {
            const remaining = Math.ceil((this.pigeon.speedBoostEnd - timestamp) / 1000);
            speedBoostEl.textContent = `SPEED BOOST! ${remaining}s`;
            speedBoostEl.style.display = 'block';
            this.pigeon.speed = CONFIG.PIGEON_SPEED * 1.8;
        } else {
            speedBoostEl.style.display = 'none';
            this.pigeon.speed = CONFIG.PIGEON_SPEED;
        }

        const catEaterEl = document.getElementById('catEater');
        const canEatCats = timestamp < this.pigeon.catEaterEnd;

        if (canEatCats) {
            const remaining = Math.ceil((this.pigeon.catEaterEnd - timestamp) / 1000);
            catEaterEl.textContent = `EAT CATS! ${remaining}s`;
            catEaterEl.style.display = 'block';
        } else {
            catEaterEl.style.display = 'none';
        }
    },

    updateCats(timestamp) {
        const canEatCats = timestamp < this.pigeon.catEaterEnd;

        this.cats.forEach(cat => {
            if (cat.climbingTree) {
                this.updateClimbingCat(cat);
                return;
            }

            this.updateCatDirection(cat, canEatCats);
            this.updateCatPosition(cat, canEatCats);
            this.checkCatTreeClimb(cat);
        });
    },

    updateClimbingCat(cat) {
        if (this.pigeon.onTree !== cat.climbingTree) {
            cat.climbProgress -= 0.01;
            if (cat.climbProgress <= 0) {
                cat.climbingTree.climbingCat = null;
                cat.climbingTree = null;
                cat.climbProgress = 0;
            }
        } else {
            cat.climbProgress += 0.005;
            if (cat.climbProgress >= 1) {
                this.end();
            }
        }
    },

    updateCatDirection(cat, canEatCats) {
        const dx = this.pigeon.x - cat.x;
        const dy = this.pigeon.y - cat.y;
        const dir = normalize(dx, dy);

        if (canEatCats) {
            cat.dirX = -dir.x;
            cat.dirY = -dir.y;
            cat.direction = dx > 0 ? -1 : 1;
        } else {
            cat.dirX = dir.x;
            cat.dirY = dir.y;
            cat.direction = dx > 0 ? 1 : -1;
        }
    },

    updateCatPosition(cat, canEatCats) {
        const speed = canEatCats ? cat.speed * CONFIG.CAT_FLEE_MULTIPLIER : cat.speed;
        const newX = cat.x + cat.dirX * speed;
        const newY = cat.y + cat.dirY * speed;

        if (!World.isInPond(newX, newY)) {
            cat.x = newX;
            cat.y = newY;
        } else {
            // Try going around the pond
            const altX = cat.x + cat.dirY * speed;
            const altY = cat.y - cat.dirX * speed;
            if (!World.isInPond(altX, altY)) {
                cat.x = altX;
                cat.y = altY;
            }
        }
    },

    checkCatTreeClimb(cat) {
        const nearTree = World.getNearestTree(cat.x, cat.y, CONFIG.TREE_COLLISION_RADIUS);

        if (nearTree && this.pigeon.onTree === nearTree && !nearTree.climbingCat) {
            cat.climbingTree = nearTree;
            nearTree.climbingCat = cat;
            cat.climbProgress = 0;
            cat.x = nearTree.x;
            cat.y = nearTree.y;
        }
    },

    cleanupEntities() {
        this.cats = this.cats.filter(cat => {
            if (cat.climbingTree) return true;
            return distance(cat.x, cat.y, this.pigeon.x, this.pigeon.y) < CONFIG.DESPAWN_RADIUS;
        });
    },

    checkCollisions(timestamp) {
        if (this.pigeon.onTree) return;

        this.checkBreadcrumbCollision();
        this.checkChestCollision(timestamp);
        this.checkDiamondCollision(timestamp);
        this.checkCatCollision(timestamp);
    },

    checkBreadcrumbCollision() {
        this.breadcrumbs = this.breadcrumbs.filter(crumb => {
            const dist = distance(this.pigeon.x, this.pigeon.y, crumb.x, crumb.y);

            if (dist < CONFIG.PICKUP_RADIUS) {
                this.addScore(CONFIG.BREADCRUMB_POINTS);
                return false;
            }

            return dist <= CONFIG.DESPAWN_RADIUS;
        });
    },

    checkChestCollision(timestamp) {
        this.chests = this.chests.filter(chest => {
            const dist = distance(this.pigeon.x, this.pigeon.y, chest.x, chest.y);

            if (dist < CONFIG.POWERUP_RADIUS) {
                this.pigeon.speedBoostEnd = timestamp + CONFIG.POWERUP_DURATION;
                this.addScore(CONFIG.CHEST_POINTS);
                return false;
            }

            return dist <= CONFIG.DESPAWN_RADIUS;
        });
    },

    checkDiamondCollision(timestamp) {
        this.diamonds = this.diamonds.filter(diamond => {
            const dist = distance(this.pigeon.x, this.pigeon.y, diamond.x, diamond.y);

            if (dist < CONFIG.POWERUP_RADIUS) {
                this.pigeon.catEaterEnd = timestamp + CONFIG.POWERUP_DURATION;
                this.addScore(CONFIG.DIAMOND_POINTS);
                return false;
            }

            return dist <= CONFIG.DESPAWN_RADIUS;
        });
    },

    checkCatCollision(timestamp) {
        if (this.pigeon.isJumping) return;

        const canEatCats = timestamp < this.pigeon.catEaterEnd;

        this.cats = this.cats.filter(cat => {
            if (cat.climbingTree) return true;

            const dist = distance(this.pigeon.x, this.pigeon.y, cat.x, cat.y);

            if (dist < CONFIG.CAT_COLLISION_RADIUS) {
                if (canEatCats) {
                    this.addScore(CONFIG.CAT_EAT_POINTS);
                    return false;
                } else {
                    this.end();
                }
            }

            return true;
        });
    },

    addScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
    },

    // ========================================
    // Render Loop
    // ========================================

    render() {
        const camX = this.pigeon.x - CONFIG.CANVAS_WIDTH / 2;
        const camY = this.pigeon.y - CONFIG.CANVAS_HEIGHT / 2;

        Renderer.clear();
        Renderer.drawGround(camX, camY);

        // Draw ponds (ground level)
        World.getPondsInView(camX, camY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT).forEach(pond => {
            const screen = Renderer.worldToScreen(pond.x, pond.y, camX, camY);
            Renderer.drawPond(screen.x, screen.y, pond.radiusX, pond.radiusY);
        });

        // Collect and sort entities by Y for proper depth
        const entities = this.collectEntities(camX, camY);
        entities.sort((a, b) => a.y - b.y);

        // Draw entities
        entities.forEach(entity => {
            const screen = Renderer.worldToScreen(entity.data.x, entity.data.y, camX, camY);
            this.drawEntity(entity, screen);
        });
    },

    collectEntities(camX, camY) {
        const entities = [];

        World.getTreesInView(camX, camY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT).forEach(tree => {
            entities.push({ type: 'tree', y: tree.y, data: tree });
        });

        this.breadcrumbs.forEach(crumb => {
            entities.push({ type: 'breadcrumb', y: crumb.y, data: crumb });
        });

        this.chests.forEach(chest => {
            entities.push({ type: 'chest', y: chest.y, data: chest });
        });

        this.diamonds.forEach(diamond => {
            entities.push({ type: 'diamond', y: diamond.y, data: diamond });
        });

        this.cats.forEach(cat => {
            if (!cat.climbingTree) {
                entities.push({ type: 'cat', y: cat.y, data: cat });
            }
        });

        if (!this.pigeon.onTree) {
            entities.push({ type: 'pigeon', y: this.pigeon.y, data: this.pigeon });
        }

        return entities;
    },

    drawEntity(entity, screen) {
        switch (entity.type) {
            case 'tree':
                const hasPigeon = this.pigeon.onTree === entity.data;
                const hasCat = entity.data.climbingCat !== null;
                Renderer.drawTree(screen.x, screen.y, hasPigeon, hasCat);
                break;
            case 'breadcrumb':
                Renderer.drawBreadcrumb(screen.x, screen.y);
                break;
            case 'chest':
                Renderer.drawChest(screen.x, screen.y);
                break;
            case 'diamond':
                Renderer.drawDiamond(screen.x, screen.y);
                break;
            case 'cat':
                Renderer.drawCat(screen.x, screen.y, entity.data.direction);
                break;
            case 'pigeon':
                Renderer.drawPigeon(screen.x, screen.y, entity.data.direction, entity.data.isJumping);
                break;
        }
    },

    // ========================================
    // Main Loop
    // ========================================

    loop(timestamp) {
        if (!this.running) return;

        this.update(timestamp);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }
};

// Initialize game when page loads
window.addEventListener('load', () => Game.init());
