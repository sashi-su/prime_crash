import {
  Square,
  ScoreFloat,
  createCircle,
  divide,
  factorizationMessage,
  grothendieckCircles,
  pointForCombo,
  resetLaneMemory,
} from "./objects.js";

const MODE_NAMES = {
  1: "Complex mode",
  2: "Speed mode",
  3: "Mixed mode",
};

const COMPLEX_COOLDOWN = {
  1: 50,
  2: 65,
  3: 80,
  4: 95,
  5: 105,
  6: 115,
  7: 125,
  8: 135,
  9: 145,
  10: 150,
};

const SPEED_COOLDOWN = {
  1: 100,
  2: 80,
  3: 70,
  4: 60,
  5: 50,
  6: 40,
  7: 40,
  8: 30,
  9: 25,
  10: 20,
};

const COLORS = {
  surface: "#fbfbf8",
  raised: "#ffffff",
  ink: "#1f2933",
  hover: "#e8eef3",
  active: "#d9e2ea",
  circle: "#d83a3a",
  square: "#2563eb",
};

export class PrimeCrashGame {
  constructor(canvas, numbers, audio, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.numbers = numbers;
    this.audio = audio;
    this.callbacks = callbacks;
    this.rafId = 0;
    this.active = false;
    this.logicalWidth = 1280;
    this.logicalHeight = 720;
    this.lastTimestamp = 0;

    this.pointerDown = this.pointerDown.bind(this);
    this.pointerMove = this.pointerMove.bind(this);
    this.pointerUp = this.pointerUp.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.keyUp = this.keyUp.bind(this);
    this.loop = this.loop.bind(this);
    this.pressedKeys = new Set();

    canvas.addEventListener("pointerdown", this.pointerDown);
    canvas.addEventListener("pointermove", this.pointerMove);
    canvas.addEventListener("pointerup", this.pointerUp);
    window.addEventListener("keydown", this.keyDown);
    window.addEventListener("keyup", this.keyUp);
  }

  start(mode, level) {
    this.stopAnimation();
    resetLaneMemory();
    this.mode = mode;
    this.level = level;
    this.initialLevel = level;
    this.totalScore = 0;
    this.roundScore = 0;
    this.lives = 3;
    this.combo = 0;
    this.comboCount = 0;
    this.cooltime1 = 0;
    this.cooltime2 = 0;
    this.catchNumber = 0;
    this.catchWait = false;
    this.lane = 0;
    this.deleteHover = false;
    this.mouseShotReady = false;
    this.dragNumber = 0;
    this.circles = [];
    this.squares = [];
    this.scores = [];
    this.message = "";
    this.messageTimer = 0;
    this.freezeTimer = 0;
    this.clearAfterFreeze = false;
    this.undoPressed = false;
    this.grothendieck = null;
    this.countdown = 3;
    this.pendingGameOver = false;
    this.pressedKeys.clear();
    this.active = true;
    this.lastTimestamp = 0;
    this.resizeCanvas();
    this.audio.stopMusic();
    this.audio.playSfx("count");
    this.rafId = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.stopAnimation();
    this.canvas.removeEventListener("pointerdown", this.pointerDown);
    this.canvas.removeEventListener("pointermove", this.pointerMove);
    this.canvas.removeEventListener("pointerup", this.pointerUp);
    window.removeEventListener("keydown", this.keyDown);
    window.removeEventListener("keyup", this.keyUp);
  }

  stopAnimation() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  loop(timestamp) {
    if (!this.active) {
      return;
    }
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
    }
    const dt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    this.resizeCanvas();
    this.update(dt);
    this.draw();
    this.rafId = requestAnimationFrame(this.loop);
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mobile = rect.width < 950 && rect.width > rect.height;
    this.logicalWidth = mobile ? rect.width : 1280;
    this.logicalHeight = mobile ? rect.height : 720;

    const targetWidth = Math.round(this.logicalWidth * dpr);
    const targetHeight = Math.round(this.logicalHeight * dpr);
    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  getLayout() {
    const w = this.logicalWidth;
    const h = this.logicalHeight;
    const mobile = w < 950 && w > h;

    if (mobile) {
      const rightWidth = Math.min(Math.max(w * 0.27, 174), 230);
      const rightMargin = Math.max(8, Math.min(14, w * 0.012));
      const mainWidth = w - rightWidth - rightMargin;
      const statusHeight = Math.max(34, Math.min(44, h * 0.11));
      const controlsHeight = Math.max(40, Math.min(48, h * 0.12));
      const gameArea = {
        x: 0,
        y: statusHeight,
        width: mainWidth,
        height: h - statusHeight - controlsHeight,
      };
      const laneHeight = gameArea.height / 4;
      const laneScale = laneHeight / 144;
      const gap = Math.max(11, Math.min(16, w * 0.016));
      const buttonWidth = (rightWidth - gap * 3) / 2;
      const rowHeight = (h - gap * 5) / 4;
      const panelX = mainWidth;
      const selectorButtons = [
        { number: 2, label: "2", x: panelX + gap, y: gap, width: buttonWidth, height: rowHeight },
        { number: 3, label: "3", x: panelX + gap * 2 + buttonWidth, y: gap, width: buttonWidth, height: rowHeight },
        { number: 5, label: "5", x: panelX + gap, y: gap * 2 + rowHeight, width: buttonWidth, height: rowHeight },
        { number: 7, label: "7", x: panelX + gap * 2 + buttonWidth, y: gap * 2 + rowHeight, width: buttonWidth, height: rowHeight },
        { number: 11, label: "11", x: panelX + gap, y: gap * 3 + rowHeight * 2, width: buttonWidth, height: rowHeight },
        { number: 13, label: "13", x: panelX + gap * 2 + buttonWidth, y: gap * 3 + rowHeight * 2, width: buttonWidth, height: rowHeight },
        { number: 1, label: "is prime", x: panelX + gap, y: gap * 4 + rowHeight * 3, width: rightWidth - gap * 2, height: rowHeight },
      ];

      return {
        mobile,
        width: w,
        height: h,
        gameArea,
        laneHeight,
        speedScale: gameArea.width / 972,
        circleRadius: Math.max(20, Math.min(60 * laneScale, laneHeight * 0.37)),
        squareHalf: Math.max(18, Math.min(52 * laneScale, laneHeight * 0.34)),
        selectorButtons,
        deleteButton: { x: 14, y: h - controlsHeight + 10, width: 110, height: Math.max(28, controlsHeight - 20) },
        undoButton: { x: mainWidth - 34, y: 6, width: 26, height: 26 },
        controlsArea: { x: 0, y: h - controlsHeight, width: mainWidth, height: controlsHeight },
        statusArea: { x: 0, y: 0, width: mainWidth, height: statusHeight },
      };
    }

    return {
      mobile,
      width: 1280,
      height: 720,
      gameArea: { x: 0, y: 72, width: 972, height: 576 },
      laneHeight: 144,
      speedScale: 1,
      circleRadius: 60,
      squareHalf: 52,
      selectorButtons: [
        { number: 2, label: "2", x: 1082, y: 20, width: 104, height: 104 },
        { number: 3, label: "3", x: 1013, y: 164, width: 104, height: 104 },
        { number: 5, label: "5", x: 1151, y: 164, width: 104, height: 104 },
        { number: 1, label: "is prime", x: 1013, y: 308, width: 242, height: 104 },
        { number: 7, label: "7", x: 1013, y: 452, width: 104, height: 104 },
        { number: 11, label: "11", x: 1151, y: 452, width: 104, height: 104 },
        { number: 13, label: "13", x: 1082, y: 596, width: 104, height: 104 },
      ],
      deleteButton: { x: 825, y: 8, width: 147, height: 56 },
      undoButton: { x: 1240, y: 5, width: 35, height: 35 },
      controlsArea: null,
      statusArea: null,
    };
  }

  update(dt) {
    const layout = this.getLayout();

    if (this.grothendieck) {
      this.updateGrothendieck(dt, layout);
      return;
    }

    if (this.countdown > 0) {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.audio.playMusic("bgm2");
      }
      return;
    }

    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      if (this.freezeTimer <= 0) {
        if (this.clearAfterFreeze) {
          this.clearAfterMiss();
        }
        if (this.pendingGameOver) {
          this.finishGame();
        }
      }
      return;
    }

    for (const square of this.squares) {
      square.move(dt, layout);
    }
    this.squares = this.squares.filter((square) => square.place > -30 * layout.speedScale);

    this.applyCircleSpeedLocks(layout);
    for (const circle of this.circles) {
      circle.move(dt, layout);
    }

    this.resolveCollisions(layout);
    this.circles = this.circles.filter((circle) => !circle.clear);

    for (const score of this.scores) {
      score.move(dt);
    }
    this.scores = this.scores.filter((score) => score.display);

    this.spawnCircles(dt);

    const frameUnits = dt * 30;
    this.cooltime1 += this.mode === 3 ? frameUnits * (2 / 3) : frameUnits;
    this.cooltime2 += this.mode === 3 ? frameUnits * (2 / 3) : frameUnits;
    this.comboCount += frameUnits;
    if (this.comboCount > 60) {
      this.combo = 0;
    }
    if (this.roundScore >= 3000 && this.level < 10) {
      this.level += 1;
      this.roundScore = 0;
    }
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
    }
  }

  updateGrothendieck(dt, layout) {
    const state = this.grothendieck;
    state.timer += dt;

    if (state.phase === "blast" && state.timer >= 5.5) {
      state.phase = "factor";
      state.timer = 0;
      state.index = 0;
    }

    if (state.phase === "factor") {
      const interval = state.index < 3 ? 1 : 0;
      while (state.index < state.originals.length && state.timer >= interval) {
        if (interval > 0) {
          state.timer -= interval;
        }
        const original = state.originals[state.index];
        this.removeItem(this.circles, original);
        this.circles.push(...grothendieckCircles(original));
        state.index += 1;
        if (state.index < 3) {
          break;
        }
      }
      if (state.index >= state.originals.length) {
        state.phase = "waitAfterFactor";
        state.timer = 0;
      }
    }

    if (state.phase === "waitAfterFactor" && state.timer >= Math.max(0, 4 - Math.min(4, state.originals.length))) {
      state.phase = "scoreFactors";
      state.timer = 0;
      const factorCircles = this.circles.filter((candidate) => candidate !== state.trigger);
      for (const factorCircle of factorCircles) {
        this.removeItem(this.circles, factorCircle);
        this.addScore(factorCircle, layout);
      }
    }

    if (state.phase === "scoreFactors" && state.timer >= 2.5) {
      this.circles = [];
      this.squares = [];
      this.catchNumber = 0;
      this.catchWait = false;
      this.lives += 1;
      this.addScore(state.trigger, layout);
      this.message = "You're Right!\nLife +1";
      this.messageTimer = 1.5;
      this.audio.playSfx("correct");
      state.phase = "right";
      state.timer = 0;
    }

    if (state.phase === "right" && state.timer >= 1.5) {
      this.grothendieck = null;
      this.audio.playMusic("bgm2");
    }

    this.draw();
  }

  applyCircleSpeedLocks(layout) {
    for (const circle of this.circles) {
      circle.speed = circle.baseSpeed;
    }

    for (const lane of [1, 2, 3, 4]) {
      const laneCircles = this.circles
        .filter((circle) => circle.lane === lane && !circle.clear && !circle.burst)
        .sort((a, b) => a.place - b.place);

      for (let index = laneCircles.length - 2; index >= 0; index -= 1) {
        const leftCircle = laneCircles[index];
        const rightCircle = laneCircles[index + 1];
        const leftRightEdge = leftCircle.place + layout.circleRadius;
        const rightLeftEdge = rightCircle.place - layout.circleRadius;
        if (leftRightEdge >= rightLeftEdge && leftCircle.speed > rightCircle.speed) {
          leftCircle.speed = rightCircle.speed;
        }
      }
    }
  }

  resolveCollisions(layout) {
    for (const circle of [...this.circles]) {
      for (const square of [...this.squares]) {
        const distance = square.place - circle.place;
        const hitDistance = layout.circleRadius + layout.squareHalf - 4 * layout.speedScale;
        if (circle.lane === square.lane && distance >= 0 && distance < hitDistance) {
          const outcome = divide(circle, square);
          if (outcome) {
            this.message = outcome;
            this.messageTimer = 2.4;
          }

          if (!circle.burst && !circle.grothendieck) {
            this.removeItem(this.squares, square);
            this.addScore(circle, layout);
            this.audio.playSfx("shot");
          }

          if (circle.burst || circle.clear || circle.grothendieck) {
            break;
          }
        }
      }

      if (circle.grothendieck) {
        this.handleGrothendieck(circle, layout);
        break;
      }

      if (circle.burst) {
        this.handleMiss(circle);
        break;
      }
    }
  }

  handleGrothendieck(circle, layout) {
    this.audio.stopMusic();
    this.audio.playSfx("bigExplosion");
    this.grothendieck = {
      trigger: circle,
      originals: this.circles.filter((candidate) => candidate !== circle),
      phase: "blast",
      timer: 0,
      index: 0,
    };
    this.comboCount = -30;
    this.message = "";
    this.messageTimer = 0;
  }

  handleMiss(circle) {
    const explanation = circle ? factorizationMessage(circle.number) : "";
    this.message = explanation ? `Miss!\n${explanation}` : "Miss!";
    this.messageTimer = 2;
    this.lives -= 1;
    this.audio.playSfx("explosion");
    this.freezeTimer = 2;
    this.clearAfterFreeze = true;
    this.pendingGameOver = this.lives <= 0;
  }

  clearAfterMiss() {
    this.circles = [];
    this.squares = [];
    this.scores = [];
    this.combo = 0;
    this.catchNumber = 0;
    this.catchWait = false;
    this.mouseShotReady = false;
    this.lane = 0;
    this.message = "";
    this.messageTimer = 0;
    this.clearAfterFreeze = false;
  }

  addScore(circle, layout) {
    this.combo += 1;
    this.comboCount = 0;
    const point = pointForCombo(this.combo);
    this.totalScore += point;
    this.roundScore += point;
    const x = layout.gameArea.x + circle.place;
    const y = this.laneCenter(layout, circle.lane) - layout.circleRadius * 0.75;
    this.scores.push(new ScoreFloat(point, x, y));
  }

  spawnCircles(dt) {
    if (this.circles.length < 2) {
      this.circles.push(this.randomCircle());
      this.cooltime1 = 0;
      this.cooltime2 = 0;
    }

    const frameMultiplier = dt * 30;
    if (this.mode === 1 || this.mode === 3) {
      const threshold = COMPLEX_COOLDOWN[this.level];
      const chance = Math.max(0, (this.cooltime1 - threshold) / 600) * frameMultiplier;
      if (Math.random() < chance) {
        this.circles.push(createCircle(1, this.level, this.numbers));
        this.cooltime1 = 0;
      }
    }

    if (this.mode === 2 || this.mode === 3) {
      const threshold = SPEED_COOLDOWN[this.level];
      const chance = Math.max(0, (this.cooltime2 - threshold) / 200) * frameMultiplier;
      if (Math.random() < chance) {
        this.circles.push(createCircle(2, this.level, this.numbers));
        this.cooltime2 = 0;
      }
    }
  }

  randomCircle() {
    if (this.mode === 3) {
      return createCircle(Math.random() < 0.5 ? 1 : 2, this.level, this.numbers);
    }
    return createCircle(this.mode, this.level, this.numbers);
  }

  fireSquare() {
    if (!this.lane || !this.catchNumber) {
      return;
    }
    const layout = this.getLayout();
    this.squares.push(new Square(this.catchNumber, this.lane, layout.gameArea.width));
    this.audio.playSfx(this.combo < 10 ? "beam" : "beamgun");
  }

  clearSquares() {
    this.squares = [];
    this.audio.playSfx("delete");
  }

  finishGame() {
    if (!this.active) {
      return;
    }
    this.active = false;
    this.stopAnimation();
    this.audio.stopMusic();
    this.callbacks.onEnd({
      score: this.totalScore,
      level: this.level,
      mode: this.mode,
      initialLevel: this.initialLevel,
    });
  }

  pointerDown(event) {
    if (!this.active) {
      return;
    }
    const point = this.canvasPoint(event);
    const layout = this.getLayout();
    this.mouseShotReady = false;
    this.dragNumber = 0;

    for (const button of layout.selectorButtons) {
      if (contains(button, point)) {
        this.catchNumber = button.number;
        this.catchWait = false;
        this.dragNumber = button.number;
        return;
      }
    }

    if (contains(layout.deleteButton, point)) {
      this.clearSquares();
      return;
    }

    if (contains(layout.undoButton, point)) {
      this.undoPressed = true;
      return;
    }

    if (this.pointInGameArea(point, layout)) {
      this.mouseShotReady = true;
      this.lane = this.laneAt(point, layout);
    }
  }

  pointerMove(event) {
    if (!this.active) {
      return;
    }
    const point = this.canvasPoint(event);
    const layout = this.getLayout();
    if (this.dragNumber && this.pointInGameArea(point, layout)) {
      this.catchNumber = this.dragNumber;
      this.lane = this.laneAt(point, layout);
    } else if (!this.mouseShotReady) {
      this.lane = this.pointInGameArea(point, layout) ? this.laneAt(point, layout) : 0;
    }
    this.deleteHover = contains(layout.deleteButton, point);
  }

  pointerUp(event) {
    if (!this.active) {
      return;
    }
    const point = this.canvasPoint(event);
    const layout = this.getLayout();
    if (this.undoPressed) {
      this.undoPressed = false;
      if (contains(layout.undoButton, point)) {
        this.audio.playSfx("cancel");
        this.finishGame();
        return;
      }
    }
    if (this.dragNumber) {
      if (this.pointInGameArea(point, layout)) {
        this.catchNumber = this.dragNumber;
        this.lane = this.laneAt(point, layout);
        this.fireSquare();
      }
      this.dragNumber = 0;
      this.mouseShotReady = false;
      return;
    }
    if (this.mouseShotReady && this.pointInGameArea(point, layout)) {
      this.lane = this.laneAt(point, layout);
      this.fireSquare();
    }
    this.mouseShotReady = false;
  }

  keyDown(event) {
    if (!this.active) {
      return;
    }
    if (this.pressedKeys.has(event.code)) {
      event.preventDefault();
      return;
    }
    this.pressedKeys.add(event.code);

    const handledKeys = [
      "ArrowUp",
      "ArrowDown",
      "Enter",
      "NumpadEnter",
      "Backspace",
      "Delete",
      "NumpadDecimal",
    ];
    if (handledKeys.includes(event.code)) {
      event.preventDefault();
    }

    if (event.code === "Digit2" || event.code === "Numpad2") {
      this.catchNumber = 2;
      this.catchWait = false;
    } else if (event.code === "Digit3" || event.code === "Numpad3") {
      this.catchNumber = this.catchWait ? 13 : 3;
      this.catchWait = false;
    } else if (event.code === "Digit5" || event.code === "Numpad5") {
      this.catchNumber = 5;
      this.catchWait = false;
    } else if (event.code === "Digit7" || event.code === "Numpad7") {
      this.catchNumber = 7;
      this.catchWait = false;
    } else if (event.code === "Digit1" || event.code === "Numpad1") {
      if (this.catchWait) {
        this.catchNumber = 11;
        this.catchWait = false;
      } else {
        this.catchNumber = 0;
        this.catchWait = true;
      }
    } else if (event.code === "Digit0" || event.code === "Numpad0") {
      this.catchNumber = 1;
      this.catchWait = false;
    } else if (event.code === "ArrowUp") {
      this.lane = { 0: 1, 1: 4, 2: 1, 3: 2, 4: 3 }[this.lane];
    } else if (event.code === "ArrowDown") {
      this.lane = { 0: 4, 1: 2, 2: 3, 3: 4, 4: 1 }[this.lane];
    } else if (event.code === "Enter" || event.code === "NumpadEnter") {
      this.fireSquare();
    } else if (event.code === "Backspace" || event.code === "Delete" || event.code === "NumpadDecimal") {
      this.clearSquares();
    } else if (event.code === "Escape") {
      this.audio.playSfx("cancel");
      this.finishGame();
    }
  }

  keyUp(event) {
    this.pressedKeys.delete(event.code);
  }

  canvasPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * this.logicalWidth,
      y: ((event.clientY - rect.top) / rect.height) * this.logicalHeight,
    };
  }

  pointInGameArea(point, layout) {
    return contains(layout.gameArea, point);
  }

  laneAt(point, layout) {
    const lane = Math.floor((point.y - layout.gameArea.y) / layout.laneHeight) + 1;
    return Math.max(1, Math.min(4, lane));
  }

  laneCenter(layout, lane) {
    return layout.gameArea.y + layout.laneHeight * (lane - 0.5);
  }

  removeItem(items, item) {
    const index = items.indexOf(item);
    if (index !== -1) {
      items.splice(index, 1);
    }
  }

  draw() {
    const ctx = this.ctx;
    const layout = this.getLayout();
    ctx.clearRect(0, 0, layout.width, layout.height);
    ctx.fillStyle = COLORS.surface;
    ctx.fillRect(0, 0, layout.width, layout.height);
    ctx.lineWidth = layout.mobile ? 3 : 4;
    ctx.strokeStyle = COLORS.ink;
    ctx.fillStyle = COLORS.ink;
    ctx.textBaseline = "middle";
    ctx.lineJoin = "miter";

    this.drawGameArea(ctx, layout);
    this.drawSelectors(ctx, layout);
    this.drawStatus(ctx, layout);

    for (const circle of this.circles) {
      this.drawCircle(ctx, circle, layout);
    }
    for (const square of this.squares) {
      this.drawSquare(ctx, square, layout);
    }
    for (const score of this.scores) {
      this.drawScore(ctx, score, layout);
    }

    if (this.countdown > 0) {
      this.drawCenteredMessage(ctx, "Ready", layout, this.laneCenter(layout, 2));
    } else if (this.messageTimer > 0 && this.message) {
      this.drawCenteredMessage(ctx, this.message, layout);
    }
  }

  drawGameArea(ctx, layout) {
    const area = layout.gameArea;
    const outerLineWidth = layout.mobile ? 3 : 4;
    const innerLineWidth = layout.mobile ? 1.5 : 2;
    const capRadius = layout.laneHeight / 2;
    const capCenterX = area.x + area.width - capRadius;

    if (this.lane) {
      ctx.fillStyle = COLORS.active;
      const y = area.y + layout.laneHeight * (this.lane - 1);
      const x = area.x + area.width - Math.max(24, 40 * layout.speedScale);
      const radius = Math.min(capRadius, layout.laneHeight / 2);
      roundedRect(ctx, x, y, area.x + area.width - x, layout.laneHeight, radius, true, false);
    }

    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = outerLineWidth;
    line(ctx, area.x, area.y, capCenterX, area.y);
    const bottomCapCenterX = capCenterX;
    line(ctx, area.x, area.y + area.height, bottomCapCenterX, area.y + area.height);

    ctx.lineWidth = innerLineWidth;
    for (let i = 1; i <= 3; i += 1) {
      const y = area.y + layout.laneHeight * i;
      line(ctx, area.x, y, capCenterX, y);
    }

    ctx.lineWidth = outerLineWidth;
    for (let lane = 1; lane <= 4; lane += 1) {
      const centerY = this.laneCenter(layout, lane);
      ctx.beginPath();
      ctx.arc(capCenterX, centerY, capRadius, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }
  }

  drawSelectors(ctx, layout) {
    for (const button of layout.selectorButtons) {
      ctx.fillStyle = this.catchNumber === button.number ? COLORS.active : COLORS.raised;
      ctx.strokeStyle = COLORS.ink;
      roundedRect(ctx, button.x, button.y, button.width, button.height, layout.mobile ? 8 : 14, true, true);
      ctx.fillStyle = COLORS.ink;
      const size = button.number === 1
        ? Math.min(button.height * 0.52, button.width * 0.2)
        : Math.min(button.height * 0.72, button.width * 0.58);
      drawText(ctx, button.label, button.x + button.width / 2, button.y + button.height / 2, size);
    }

    ctx.fillStyle = this.deleteHover ? COLORS.active : COLORS.raised;
    const del = layout.deleteButton;
    roundedRect(ctx, del.x, del.y, del.width, del.height, layout.mobile ? 7 : 12, true, true);
    ctx.fillStyle = COLORS.ink;
    drawText(ctx, "delete", del.x + del.width / 2, del.y + del.height / 2, layout.mobile ? 20 : 42);

    const undo = layout.undoButton;
    ctx.fillStyle = COLORS.raised;
    roundedRect(ctx, undo.x, undo.y, undo.width, undo.height, layout.mobile ? 6 : 8, true, true);
    ctx.fillStyle = COLORS.ink;
    drawText(ctx, "X", undo.x + undo.width / 2, undo.y + undo.height / 2, layout.mobile ? 24 : 34);

  }

  drawStatus(ctx, layout) {
    ctx.fillStyle = COLORS.ink;
    if (layout.mobile) {
      const text = `score: ${this.totalScore}   level: ${this.level}   lives: ${this.lives}   combo: ${this.combo}`;
      drawLeftText(ctx, text, layout.statusArea.x + 12, layout.statusArea.height / 2, Math.max(17, layout.statusArea.height * 0.42));
      return;
    }

    drawLeftText(ctx, MODE_NAMES[this.mode], 30, 34, 42);
    drawLeftText(
      ctx,
      `score: ${this.totalScore}   level: ${this.level}   lives: ${this.lives}   combo: ${this.combo}`,
      30,
      690,
      42,
    );
  }

  drawCircle(ctx, circle, layout) {
    const x = layout.gameArea.x + circle.place;
    const y = this.laneCenter(layout, circle.lane);
    ctx.strokeStyle = COLORS.circle;
    ctx.lineWidth = layout.mobile ? 3 : 4;
    ctx.beginPath();
    ctx.arc(x, y, layout.circleRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    drawText(ctx, String(circle.number), x, y + layout.circleRadius * 0.03, layout.circleRadius * 0.78);
  }

  drawSquare(ctx, square, layout) {
    const x = layout.gameArea.x + square.place;
    const y = this.laneCenter(layout, square.lane);
    ctx.strokeStyle = COLORS.square;
    ctx.lineWidth = layout.mobile ? 3 : 4;
    ctx.fillStyle = COLORS.ink;

    if (square.number === 1) {
      const width = layout.squareHalf * 3.2;
      const height = layout.squareHalf * 2.1;
      roundedRect(ctx, x - width / 2, y - height / 2, width, height, layout.mobile ? 6 : 10, false, true);
      drawText(ctx, "is", x, y - height * 0.23, layout.squareHalf * 0.82);
      drawText(ctx, "prime", x, y + height * 0.24, layout.squareHalf * 0.68);
      return;
    }

    const size = layout.squareHalf * 2;
    roundedRect(ctx, x - layout.squareHalf, y - layout.squareHalf, size, size, layout.mobile ? 5 : 8, false, true);
    drawText(ctx, String(square.number), x, y, layout.squareHalf * 0.9);
  }

  drawScore(ctx, score, layout) {
    ctx.fillStyle = COLORS.ink;
    ctx.globalAlpha = Math.max(0, Math.min(1, score.life));
    drawLeftText(ctx, `+${score.number}`, score.x, score.y, layout.mobile ? 18 : 32);
    ctx.globalAlpha = 1;
  }

  drawCenteredMessage(ctx, message, layout, centerY = null) {
    const lines = message.split("\n");
    const fontSize = lines.length > 1
      ? (layout.mobile ? Math.max(18, layout.gameArea.height * 0.09) : 58)
      : (layout.mobile ? Math.max(24, layout.gameArea.height * 0.13) : 80);
    ctx.fillStyle = COLORS.ink;
    lines.forEach((lineText, index) => {
      const y = (centerY ?? (layout.gameArea.y + layout.gameArea.height / 2)) + (index - (lines.length - 1) / 2) * fontSize * 1.15;
      drawText(ctx, lineText, layout.gameArea.x + layout.gameArea.width / 2, y, fontSize);
    });
  }
}

function contains(rect, point) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function roundedRect(ctx, x, y, width, height, radius, fill, stroke) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
}

function drawText(ctx, text, x, y, size) {
  ctx.font = `${Math.max(10, size)}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
}

function drawLeftText(ctx, text, x, y, size) {
  ctx.font = `${Math.max(10, size)}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(text, x, y);
}
