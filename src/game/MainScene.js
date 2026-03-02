import Phaser from "phaser";
import { createQuestionDeck, buildQuestionPrompt } from "./data/wordBank";
import { AudioManager } from "./audio/audioManager";
import { FxManager } from "./fx/fxManager";
import { QuestionPresenter } from "./ui/questionPresenter";
import { createRunnerCharacter, createQuestionCharacter, RUNNER_STYLES } from "./characters/characterFactory";
import {
  animateRunner,
  animateQuestionCharacter,
  updateRunnerJumpPose,
} from "./characters/characterAnimator";

const PROGRESS_KEY = "hero_runner_progress_v1";
const STYLE_UNLOCKS = {
  orange_star: 0,
  red_royal: 3,
  blue_bolt: 6,
  gold_flash: 10,
};

export default class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  preload() {
    this.load.image("vijayPhoto", "assets/vijay-reference.png");

    const g = this.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(0x2e7d32);
    g.fillRect(0, 0, 900, 90);
    g.generateTexture("ground", 900, 90);
    g.clear();

    g.fillStyle(0x263238);
    g.fillRoundedRect(0, 0, 52, 72, 12);
    g.generateTexture("obstacleBlock", 52, 72);
    g.clear();

    g.fillStyle(0x37474f);
    g.fillTriangle(32, 0, 0, 74, 64, 74);
    g.fillStyle(0x546e7a);
    g.fillTriangle(32, 8, 10, 72, 54, 72);
    g.generateTexture("obstacleSpike", 64, 74);
    g.clear();

    g.fillStyle(0x4e342e);
    g.fillRoundedRect(0, 0, 68, 78, 16);
    g.fillStyle(0xffcc80);
    g.fillCircle(22, 24, 6);
    g.fillCircle(46, 24, 6);
    g.fillStyle(0x1f1f1f);
    g.fillCircle(22, 24, 3);
    g.fillCircle(46, 24, 3);
    g.fillStyle(0xfff8e1);
    g.fillTriangle(20, 44, 26, 58, 32, 44);
    g.fillTriangle(34, 44, 40, 58, 46, 44);
    g.generateTexture("obstacleMonster", 68, 78);
    g.clear();

    // Gold coin with rim, inner face, embossed mark, and highlight.
    g.fillStyle(0x8f6a00, 1);
    g.fillCircle(18, 18, 18);
    g.fillStyle(0xd09a00, 1);
    g.fillCircle(18, 18, 16);
    g.fillStyle(0xf7c843, 1);
    g.fillCircle(18, 18, 14);
    g.lineStyle(2, 0xffe082, 0.85);
    g.strokeCircle(18, 18, 11);
    g.lineStyle(2, 0x9a6c00, 0.9);
    g.strokeCircle(18, 18, 16);
    g.fillStyle(0xfff2b3, 0.72);
    g.fillEllipse(12, 11, 10, 7);
    g.fillStyle(0xc58d00, 0.9);
    g.fillRect(17, 11, 3, 14);
    g.fillRect(13, 17, 10, 3);
    g.generateTexture("coin", 36, 36);
    g.clear();

    const buildingDefs = [
      { key: "buildingA", width: 210, height: 280, body: 0x4a6488, windows: 0xbad6ff },
      { key: "buildingB", width: 190, height: 340, body: 0x5b6f8f, windows: 0x93b7e9 },
      { key: "buildingC", width: 240, height: 300, body: 0x465a7d, windows: 0xa5caef },
      { key: "buildingD", width: 170, height: 250, body: 0x3f5777, windows: 0x88afe0 },
    ];

    buildingDefs.forEach((def) => {
      g.fillStyle(def.body);
      g.fillRect(0, 0, def.width, def.height);
      g.fillStyle(0x334864, 0.35);
      g.fillRect(0, def.height - 18, def.width, 18);
      g.fillStyle(def.windows, 0.5);

      const cols = Math.max(2, Math.floor(def.width / 56));
      const rows = Math.max(3, Math.floor(def.height / 70));
      const padX = 16;
      const padY = 18;
      const w = Math.floor((def.width - padX * 2) / cols) - 8;
      const h = Math.min(28, Math.floor((def.height - padY * 2) / rows) - 10);

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const wx = padX + col * (w + 8);
          const wy = padY + row * (h + 12);
          g.fillRect(wx, wy, w, h);
        }
      }

      g.generateTexture(def.key, def.width, def.height);
      g.clear();
    });
    g.clear();

    g.fillStyle(0xffffff);
    g.fillEllipse(40, 20, 70, 34);
    g.fillEllipse(66, 20, 56, 28);
    g.generateTexture("cloud", 110, 46);
    g.clear();

    g.fillStyle(0xfff59d);
    g.fillRect(0, 0, 6, 6);
    g.generateTexture("spark", 6, 6);
    g.clear();

    g.fillStyle(0xffffff, 0.001);
    g.fillRect(0, 0, 34, 78);
    g.generateTexture("heroBody", 34, 78);

    g.destroy();
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    const progress = this.loadProgress();
    this.level = progress.level ?? 1;
    this.roundWinsTotal = progress.roundWinsTotal ?? 0;
    this.unlockedStyles = progress.unlockedStyles ?? ["orange_star"];
    this.activeStyle = progress.activeStyle ?? "orange_star";
    this.worldBadges = Array.isArray(progress.worldBadges) ? progress.worldBadges : [];
    this.applyStyleUnlocks();
    this.backfillWorldBadges();

    this.correctToWin = 3;
    this.correctInRound = 0;
    this.showStars = 0;
    this.showStarsTarget = 3;
    this.isShowtime = false;
    this.showtimeTweens = [];
    this.nextCoinMilestone = 5;
    this.missionTarget = 3;
    this.missionProgress = 0;
    this.wrongAnswerStreak = 0;

    this.baseSpeed = this.getSpeedForLevel(this.level);
    this.gameSpeed = this.baseSpeed;
    this.rampDelay = 0;
    this.jumpCount = 0;

    this.state = "running";
    this.questionTriggered = false;
    this.shouldAskQuestion = true;
    this.obstaclesSinceQuestion = 0;
    this.obstaclesUntilQuestion = Phaser.Math.Between(3, 5);
    this.hitRecovering = false;

    this.coinsCollected = 0;
    this.correctStreak = 0;

    this.questionPool = createQuestionDeck();

    this.audio = new AudioManager();
    this.fx = new FxManager(this);
    this.enableAudioBridge = () => {
      const ok = this.audio.forceEnableFromGesture();
      this.audio.startBackgroundMusic();
      return ok;
    };
    window.__heroEnableAudio = this.enableAudioBridge;
    this.levelTheme = this.getThemeForLevel(this.level);
    this.runnerYOffset = -18;
    this.buildingSpacing = 260;
    this.roadMarkSpacing = 180;

    this.createBackground(width, height);

    this.ground = this.physics.add
      .staticImage(width / 2, this.getGroundY(height), "ground")
      .setDepth(10);
    this.ground.setDisplaySize(width + 20, this.getGroundHeight());
    this.ground.refreshBody();
    this.createGroundMarkers(width);

    const groundTop = this.ground.getTopCenter().y;
    this.hero = this.physics.add.image(150, groundTop - 39, "heroBody").setDepth(2);
    this.hero.setCollideWorldBounds(true);
    this.physics.add.collider(this.hero, this.ground);

    this.rebuildRunnerRig();

    this.spawnObstacle();
    this.spawnCoin();
    this.questionUI = new QuestionPresenter(this, width, height);
    this.questionUI.buildOptions();

    this.coinText = this.add
      .text(20, 20, "Coins: 0", {
        fontSize: "30px",
        color: "#17324b",
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: 6,
      })
      .setDepth(50);

    this.streakText = this.add
      .text(20, 62, "", {
        fontSize: "26px",
        color: "#ff6f00",
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: 6,
      })
      .setDepth(50);
    this.badgeText = this.add
      .text(20, 98, "", {
        fontSize: "22px",
        color: "#f57f17",
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: 5,
      })
      .setDepth(50);
    this.showtimeText = this.add
      .text(20, 132, "", {
        fontSize: "20px",
        color: "#ff8f00",
        fontStyle: "bold",
        stroke: "#ffffff",
        strokeThickness: 4,
      })
      .setDepth(50);
    this.updateHudTexts();
    this.createBuildProjectUI(width, height);

    this.createRoundWinUI(width, height);

    this.input.on("pointerdown", (pointer) => {
      if (this.state === "question" && this.questionUI && !this.questionUI.isLocked) {
        const option =
          this.questionUI.pickOptionAtGamePoint(pointer.x, pointer.y) ??
          this.questionUI.pickNearestOptionAtGamePoint(pointer.x, pointer.y);
        if (option) {
          this.handleOptionTap(option);
          return;
        }
      }

      this.tryPlayerJump();
    });

    this.installAudioLifecycleHooks();
    window.dispatchEvent(new Event("hero-game-ready"));

    this.scale.on("resize", this.handleResize, this);
  }

  installAudioLifecycleHooks() {
    this.ensureAudioHandler = () => {
      this.audio.unlock();
      this.audio.startBackgroundMusic();
    };

    this.windowGameplayTapHandler = (event) => {
      this.ensureAudioHandler();

      if (this.state === "question" && this.questionUI && !this.questionUI.isLocked) {
        const now = this.time?.now ?? performance.now();
        if (this.lastQuestionTapAt && now - this.lastQuestionTapAt < 120) {
          return;
        }

        let clientX = null;
        let clientY = null;
        if (event?.touches?.length) {
          clientX = event.touches[0].clientX;
          clientY = event.touches[0].clientY;
        } else if (event?.changedTouches?.length) {
          clientX = event.changedTouches[0].clientX;
          clientY = event.changedTouches[0].clientY;
        } else if (typeof event?.clientX === "number" && typeof event?.clientY === "number") {
          clientX = event.clientX;
          clientY = event.clientY;
        }

        if (clientX !== null && clientY !== null) {
          const option =
            this.questionUI.pickOptionAtClientPoint(clientX, clientY) ??
            this.questionUI.pickNearestOptionAtClientPoint(clientX, clientY);
          if (option) {
            this.lastQuestionTapAt = now;
            this.handleOptionTap(option);
            return;
          }
        }
      }

      this.tryPlayerJump();
    };

    this.input.on("pointerup", this.ensureAudioHandler);
    this.input.keyboard?.on("keydown", this.ensureAudioHandler);
    this.windowTouchUnlock = (event) => this.windowGameplayTapHandler(event);
    window.addEventListener("touchstart", this.windowTouchUnlock, { passive: true });
    window.addEventListener("pointerdown", this.windowTouchUnlock, { passive: true });

    this.onVisibilityChange = () => {
      if (document.hidden) {
        this.audio.stopSpeech();
        return;
      }
      this.audio.unlock();
      this.audio.startBackgroundMusic();
      if (this.state === "question" && this.currentQuestion) {
        this.audio.speakQuestionPromptReliable(this.currentQuestion, 1);
      }
    };
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
      this.input.off("pointerup", this.ensureAudioHandler);
      this.input.keyboard?.off("keydown", this.ensureAudioHandler);
      window.removeEventListener("touchstart", this.windowTouchUnlock);
      window.removeEventListener("pointerdown", this.windowTouchUnlock);
      if (window.__heroEnableAudio === this.enableAudioBridge) {
        delete window.__heroEnableAudio;
      }
      this.audio.stopBackgroundMusic();
    });
  }

  tryPlayerJump() {
    this.audio.unlock();
    this.audio.startBackgroundMusic();

    if (this.state !== "running") return;
    if (this.jumpCount >= 2) return;

    const now = this.time?.now ?? performance.now();
    if (this.lastJumpInputAt && now - this.lastJumpInputAt < 90) return;
    this.lastJumpInputAt = now;

    this.hero.setVelocityY(-900);
    this.audio.playJump();
    this.jumpCount += 1;
  }

  createBackground(width, height) {
    this.levelTheme = this.getThemeForLevel(this.level);
    this.cameras.main.setBackgroundColor(this.levelTheme.sky);

    if (this.skyGlow) this.skyGlow.destroy();
    if (this.clouds) this.clouds.forEach((cloud) => cloud.destroy());
    if (this.levelDecor) this.levelDecor.forEach((item) => item.destroy());

    this.skyGlow = this.add
      .ellipse(width * 0.75, height * 0.2, 380, 210, this.levelTheme.glowColor, this.levelTheme.glowAlpha)
      .setDepth(1);

    this.clouds = [];
    for (let i = 0; i < 4; i += 1) {
      const cloud = this.add
        .image(200 + i * 280, 90 + (i % 2) * 70, "cloud")
        .setTint(this.levelTheme.cloudTint)
        .setAlpha(this.levelTheme.cloudAlpha)
        .setDepth(2);
      cloud.parallaxSpeed = 26;
      this.clouds.push(cloud);
    }

    this.createLevelDecor(width, height);
    this.createBuildings(width, height);
  }

  createLevelDecor(width, height) {
    if (this.levelDecor) {
      this.levelDecor.forEach((item) => item.destroy());
    }
    this.levelDecor = [];

    if (this.levelTheme.decor === "sunset") {
      const sun = this.add.circle(width * 0.18, height * 0.2, 42, 0xffd180, 0.82).setDepth(1);
      sun.parallaxSpeed = 8;
      this.levelDecor.push(sun);
      return;
    }

    if (this.levelTheme.decor === "trees") {
      for (let i = 0; i < 5; i += 1) {
        const tree = this.add.container(i * 260 + 120, height - 125).setDepth(4).setAlpha(0.58);
        const trunk = this.add.rectangle(0, 24, 18, 58, 0x6d4c41);
        const top1 = this.add.circle(0, -8, 34, 0x4caf50);
        const top2 = this.add.circle(-20, 8, 24, 0x43a047);
        const top3 = this.add.circle(20, 8, 24, 0x43a047);
        tree.add([trunk, top1, top2, top3]);
        tree.parallaxSpeed = 38;
        this.levelDecor.push(tree);
      }
      return;
    }

    if (this.levelTheme.decor === "night") {
      for (let i = 0; i < 16; i += 1) {
        const star = this.add.circle(
          Phaser.Math.Between(20, width - 20),
          Phaser.Math.Between(20, Math.floor(height * 0.45)),
          Phaser.Math.Between(1, 2),
          0xfff8cc,
          Phaser.Math.FloatBetween(0.5, 0.95)
        );
        star.parallaxSpeed = 5;
        this.tweens.add({
          targets: star,
          alpha: { from: 0.25, to: 1 },
          yoyo: true,
          repeat: -1,
          duration: Phaser.Math.Between(800, 1600),
        });
        this.levelDecor.push(star);
      }
      const moon = this.add.circle(width * 0.18, height * 0.2, 30, 0xfff59d, 0.8).setDepth(1);
      moon.parallaxSpeed = 6;
      this.levelDecor.push(moon);
      return;
    }

    if (this.levelTheme.decor === "hills") {
      for (let i = 0; i < 4; i += 1) {
        const hill = this.add
          .ellipse(i * 320 + 120, height - 95, 280, 120, 0x5e8f63, 0.42)
          .setDepth(2);
        hill.parallaxSpeed = 20;
        this.levelDecor.push(hill);
      }
    }
  }

  createBuildings(width, height) {
    if (this.buildings) {
      this.buildings.forEach((building) => building.destroy());
    }

    this.buildings = [];
    const count = Math.ceil((width + this.buildingSpacing * 2) / this.buildingSpacing);
    const keys = ["buildingA", "buildingB", "buildingC", "buildingD"];

    for (let i = 0; i < count; i += 1) {
      const key = keys[Phaser.Math.Between(0, keys.length - 1)];
      const building = this.add
        .image(i * this.buildingSpacing - 80, height - 42, key)
        .setOrigin(0, 1)
        .setAlpha(Phaser.Math.FloatBetween(this.levelTheme.buildingAlphaMin, this.levelTheme.buildingAlphaMax))
        .setTint(this.levelTheme.buildingTint)
        .setDepth(3);
      building.parallaxSpeed = this.levelTheme.buildingSpeed;
      this.buildings.push(building);
    }
  }

  createGroundMarkers(width) {
    if (this.roadMarks) {
      this.roadMarks.forEach((mark) => mark.destroy());
    }

    const markerY = this.ground.y - 4;
    const count = Math.ceil((width + this.roadMarkSpacing * 2) / this.roadMarkSpacing);
    this.roadMarks = [];

    for (let i = 0; i < count; i += 1) {
      const mark = this.add
        .rectangle(i * this.roadMarkSpacing - 60, markerY, 82, 8, 0x58a05f, 0.7)
        .setDepth(11);
      this.roadMarks.push(mark);
    }
  }

  rebuildRunnerRig() {
    if (this.runnerRig?.container) {
      this.runnerRig.container.destroy(true);
    }

    this.runnerRig = createRunnerCharacter(this, this.hero.x, this.hero.y + this.runnerYOffset, this.activeStyle);
    this.runnerRig.container.setScale(this.getRunnerScale());
    animateRunner(this, this.runnerRig);
    this.refreshShowtimeVisuals();
  }

  updateHudTexts() {
    this.streakText.setText(`Level: ${this.level}`);
    const lastBadge = this.worldBadges.length > 0 ? this.worldBadges[this.worldBadges.length - 1] : 0;
    const badgeLabel = lastBadge > 0 ? this.getBadgeLabel(lastBadge) : "None yet";
    if (this.badgeText) {
      this.badgeText.setText(`Badge: ${badgeLabel}`);
    }
    if (this.showtimeText) {
      const prefix = this.isShowtime ? "Showtime" : "Stage";
      this.showtimeText.setText(`${prefix} Stars: ${this.showStars}/${this.showStarsTarget}`);
    }
  }

  refreshShowtimeVisuals() {
    if (Array.isArray(this.showtimeTweens) && this.showtimeTweens.length) {
      this.showtimeTweens.forEach((tween) => tween?.stop?.());
    }
    this.showtimeTweens = [];
    if (!this.isShowtime) return;

    if (this.runnerRig?.container) {
      this.showtimeTweens.push(
        this.tweens.add({
          targets: this.runnerRig.container,
          angle: { from: -8, to: 8 },
          yoyo: true,
          repeat: -1,
          duration: 280,
          ease: "Sine.InOut",
        })
      );
    }

    if (this.buildSite?.container) {
      this.showtimeTweens.push(
        this.tweens.add({
          targets: this.buildSite.container,
          y: "-=4",
          yoyo: true,
          repeat: -1,
          duration: 360,
          ease: "Sine.InOut",
        })
      );
    }
  }

  startShowtimeMode() {
    if (this.isShowtime) return;
    this.isShowtime = true;
    this.showStars = 0;
    this.refreshShowtimeVisuals();
    this.fx.floatPraise(this.scale.width * 0.72, 118, "Showtime!");
    this.updateHudTexts();
  }

  stopShowtimeMode(resetStars = true) {
    this.isShowtime = false;
    if (resetStars) {
      this.showStars = 0;
    }
    this.refreshShowtimeVisuals();
    if (this.runnerRig?.container) {
      this.runnerRig.container.angle = 0;
    }
    this.updateHudTexts();
  }

  backfillWorldBadges() {
    for (let milestone = 5; milestone <= this.level; milestone += 5) {
      if (!this.worldBadges.includes(milestone)) {
        this.worldBadges.push(milestone);
      }
    }
    this.worldBadges.sort((a, b) => a - b);
  }

  getBadgeLabel(milestoneLevel) {
    const tier = Math.max(1, Math.floor(milestoneLevel / 5));
    const badgeNames = ["Bronze Star", "Silver Star", "Gold Star", "Diamond Star"];
    if (tier <= badgeNames.length) {
      return badgeNames[tier - 1];
    }
    return `Legend Star ${tier}`;
  }

  unlockWorldBadge(milestoneLevel) {
    if (milestoneLevel % 5 !== 0 || this.worldBadges.includes(milestoneLevel)) return;
    this.worldBadges.push(milestoneLevel);
    this.worldBadges.sort((a, b) => a - b);
    const badgeLabel = this.getBadgeLabel(milestoneLevel);
    this.audio.playWin();
    this.fx.celebrateAt(this.scale.width * 0.5, 84);
    this.fx.floatPraise(this.scale.width * 0.5, 120, `${badgeLabel}!`);
  }

  createBuildProjectUI(width, height) {
    const wasShowtime = this.isShowtime;
    if (this.buildSite?.container) {
      this.buildSite.container.destroy(true);
    }

    const compact = this.getCompactMobileLayout();
    const x = compact ? Math.min(width - 170, width * 0.72) : Math.min(width - 250, width * 0.76);
    const y = compact ? Math.max(96, Math.floor(height * 0.16)) : Math.max(132, Math.floor(height * 0.24));

    const container = this.add.container(x, y).setDepth(8);
    container.setScale(compact ? 0.72 : 1);
    const stagePalettes = [
      {
        board: 0x132f4a,
        boardStroke: 0xffcc80,
        glow: 0xffa726,
        stage: 0xff8f00,
        stageStroke: 0x6d3d00,
        stageLip: 0xffca28,
        tower: 0x90a4ae,
        towerStroke: 0x455a64,
        beam: 0xfff59d,
        arch: 0xffb74d,
        archStroke: 0x7a4d00,
      },
      {
        board: 0x3b2548,
        boardStroke: 0xffab91,
        glow: 0xff7043,
        stage: 0xf4511e,
        stageStroke: 0x6d1b00,
        stageLip: 0xff8a65,
        tower: 0x8d9cb0,
        towerStroke: 0x37474f,
        beam: 0xffccbc,
        arch: 0xff8a65,
        archStroke: 0x6d2b10,
      },
      {
        board: 0x173b35,
        boardStroke: 0xffd180,
        glow: 0xffc107,
        stage: 0xfb8c00,
        stageStroke: 0x5d4037,
        stageLip: 0xffd54f,
        tower: 0x80cbc4,
        towerStroke: 0x2e4a46,
        beam: 0xfff9c4,
        arch: 0xffa726,
        archStroke: 0x6d4c41,
      },
      {
        board: 0x101f44,
        boardStroke: 0x90caf9,
        glow: 0x29b6f6,
        stage: 0x1976d2,
        stageStroke: 0x0d3b77,
        stageLip: 0x64b5f6,
        tower: 0x78909c,
        towerStroke: 0x263238,
        beam: 0xb3e5fc,
        arch: 0x42a5f5,
        archStroke: 0x1e4c87,
      },
      {
        board: 0x2a2448,
        boardStroke: 0xffe082,
        glow: 0xffca28,
        stage: 0xef6c00,
        stageStroke: 0x5d2c00,
        stageLip: 0xffb74d,
        tower: 0xb0bec5,
        towerStroke: 0x455a64,
        beam: 0xffecb3,
        arch: 0xff9800,
        archStroke: 0x6d3f00,
      },
    ];
    const stageTheme = stagePalettes[(this.level - 1) % stagePalettes.length];

    const board = this.add
      .rectangle(0, 72, 306, 196, stageTheme.board, 0.34)
      .setStrokeStyle(3, stageTheme.boardStroke, 0.72);
    const glow = this.add.ellipse(0, 136, 138, 48, stageTheme.glow, 0.2);
    const sparkA = this.add.circle(-115, 12, 3, 0xffe082, 0.4);
    const sparkB = this.add.circle(110, -6, 2, 0xfff59d, 0.38);
    const sparkC = this.add.circle(6, 20, 2, 0xfff59d, 0.34);
    const dropLine = this.add.rectangle(88, -56, 4, 62, 0xb0bec5, 0.85);
    const dropPod = this.add.circle(88, -22, 10, 0xffca28, 0.96).setStrokeStyle(2, 0xfff8e1, 1);
    container.add([board, glow, sparkA, sparkB, sparkC, dropLine, dropPod]);

    // Blueprint silhouette: festival stage pieces.
    const blueprint1 = this.add.rectangle(0, 122, 176, 26, 0xdde7f5, 0.2).setStrokeStyle(2, 0xe5f1ff, 0.32);
    const blueprint2a = this.add.rectangle(-56, 86, 24, 70, 0xdde7f5, 0.2).setStrokeStyle(2, 0xe5f1ff, 0.28);
    const blueprint2b = this.add.rectangle(56, 86, 24, 70, 0xdde7f5, 0.2).setStrokeStyle(2, 0xe5f1ff, 0.28);
    const blueprint2c = this.add.triangle(-56, 58, -78, 108, -56, 22, -34, 108, 0xdde7f5, 0.16);
    const blueprint2d = this.add.triangle(56, 58, 34, 108, 56, 22, 78, 108, 0xdde7f5, 0.16);
    const blueprint3a = this.add.rectangle(0, 56, 164, 14, 0xdde7f5, 0.18).setStrokeStyle(2, 0xe5f1ff, 0.3);
    const blueprint3b = this.add.star(0, 30, 5, 10, 18, 0xdde7f5, 0.22).setStrokeStyle(2, 0xe5f1ff, 0.3);
    container.add([blueprint1, blueprint2a, blueprint2b, blueprint2c, blueprint2d, blueprint3a, blueprint3b]);

    // Piece 1: orange stage deck.
    const stageDeck = this.add.rectangle(0, 122, 176, 26, stageTheme.stage).setStrokeStyle(2, stageTheme.stageStroke, 1);
    const stageLip = this.add.rectangle(0, 132, 176, 6, stageTheme.stageLip, 0.95);
    const lightDots = [-66, -42, -18, 6, 30, 54].map((xPos) => this.add.circle(xPos, 121, 3, 0xfff176, 0.95));
    const piece1 = this.add.container(0, 0, [stageDeck, stageLip, ...lightDots]);

    // Piece 2: dual spotlights and beams.
    const towerLeft = this.add.rectangle(-56, 86, 24, 70, stageTheme.tower).setStrokeStyle(2, stageTheme.towerStroke, 1);
    const towerRight = this.add.rectangle(56, 86, 24, 70, stageTheme.tower).setStrokeStyle(2, stageTheme.towerStroke, 1);
    const beamLeft = this.add.triangle(-56, 58, -84, 108, -56, 22, -28, 108, stageTheme.beam, 0.2);
    const beamRight = this.add.triangle(56, 58, 28, 108, 56, 22, 84, 108, stageTheme.beam, 0.2);
    const piece2 = this.add.container(0, 0, [towerLeft, towerRight, beamLeft, beamRight]);
    piece2.loopTargets = [beamLeft, beamRight];

    // Piece 3: star arch and celebratory flags.
    const archBar = this.add.rectangle(0, 56, 164, 14, stageTheme.arch).setStrokeStyle(2, stageTheme.archStroke, 1);
    const archLegL = this.add.rectangle(-70, 72, 10, 30, stageTheme.arch).setStrokeStyle(2, stageTheme.archStroke, 1);
    const archLegR = this.add.rectangle(70, 72, 10, 30, stageTheme.arch).setStrokeStyle(2, stageTheme.archStroke, 1);
    const archStar = this.add.star(0, 30, 5, 10, 18, 0xffeb3b).setStrokeStyle(2, 0xf57f17, 1);
    const flagL = this.add.triangle(-84, 88, -96, 82, -96, 102, -72, 92, 0xef5350, 1);
    const flagR = this.add.triangle(84, 88, 96, 82, 96, 102, 72, 92, 0x42a5f5, 1);
    const piece3 = this.add.container(0, 0, [archBar, archLegL, archLegR, archStar, flagL, flagR]);
    piece3.loopTargets = [archStar, flagL, flagR];
    const pieces = [piece1, piece2, piece3];

    pieces.forEach((piece) => {
      piece.setVisible(false);
      piece.alpha = 0;
      piece.scale = 0.56;
      piece.homeX = piece.x;
      piece.homeY = piece.y;
      container.add(piece);
    });

    this.tweens.add({
      targets: [dropLine, dropPod],
      x: "-=10",
      yoyo: true,
      repeat: -1,
      duration: 620,
      ease: "Sine.InOut",
    });
    this.tweens.add({
      targets: [glow, sparkA, sparkB, sparkC],
      alpha: { from: 0.12, to: 0.3 },
      yoyo: true,
      repeat: -1,
      duration: 500,
    });

    this.buildSite = { container, pieces, glow, dropLine, dropPod };
    this.renderBuildProgress(false);
    if (wasShowtime) {
      this.refreshShowtimeVisuals();
    }
  }

  renderBuildProgress(animate = true) {
    if (!this.buildSite) return;

    this.buildSite.pieces.forEach((piece, idx) => {
      const shouldShow = idx < this.missionProgress;
      if (shouldShow) {
        if (!piece.visible) {
          piece.setVisible(true);
          piece.alpha = 0.08;
          piece.scale = 0.56;
        }
        if (animate) {
          piece.x = this.buildSite.dropPod.x;
          piece.y = this.buildSite.dropPod.y + 14;
          piece.angle = Phaser.Math.Between(-12, 12);
          this.tweens.add({
            targets: piece,
            x: piece.homeX,
            y: piece.homeY,
            alpha: 1,
            scale: 1,
            angle: 0,
            duration: 280,
            ease: "Back.Out",
            onComplete: () => this.startBuildPieceLoop(piece, idx),
          });
          if (this.buildSite?.dropLine && this.buildSite?.dropPod) {
            this.tweens.add({
              targets: [this.buildSite.dropLine, this.buildSite.dropPod],
              y: "+=14",
              yoyo: true,
              duration: 210,
              ease: "Sine.InOut",
            });
          }
        } else {
          piece.alpha = 1;
          piece.scale = 1;
          piece.x = piece.homeX;
          piece.y = piece.homeY;
          piece.angle = 0;
          this.startBuildPieceLoop(piece, idx);
        }
      } else if (piece.visible) {
        this.stopBuildPieceLoop(piece);
        if (animate) {
          this.tweens.add({
            targets: piece,
            alpha: 0,
            scale: 0.56,
            duration: 160,
            ease: "Sine.In",
            onComplete: () => piece.setVisible(false),
          });
        } else {
          piece.setVisible(false);
          piece.alpha = 0;
          piece.scale = 0.56;
          piece.x = piece.homeX;
          piece.y = piece.homeY;
          piece.angle = 0;
        }
      }
    });
  }

  startBuildPieceLoop(piece, idx) {
    if (!piece || piece.loopTweenRefs?.length) return;
    piece.loopTweenRefs = [];

    if (idx === 0 && Array.isArray(piece.list)) {
      const bulbs = piece.list.filter((child) => child.type === "Arc");
      if (bulbs.length) {
        piece.loopTweenRefs.push(
          this.tweens.add({
            targets: bulbs,
            alpha: { from: 0.5, to: 1 },
            yoyo: true,
            repeat: -1,
            duration: 280,
            stagger: 70,
          })
        );
      }
    }

    if (idx === 1 && Array.isArray(piece.loopTargets) && piece.loopTargets.length) {
      piece.loopTweenRefs.push(
        this.tweens.add({
          targets: piece.loopTargets,
          alpha: { from: 0.1, to: 0.35 },
          yoyo: true,
          repeat: -1,
          duration: 420,
        })
      );
    }

    if (idx === 2 && Array.isArray(piece.loopTargets) && piece.loopTargets.length) {
      const [star, flagL, flagR] = piece.loopTargets;
      piece.loopTweenRefs.push(
        this.tweens.add({
          targets: star,
          angle: 360,
          repeat: -1,
          duration: 3000,
          ease: "Linear",
        })
      );
      piece.loopTweenRefs.push(
        this.tweens.add({
          targets: [flagL, flagR],
          angle: { from: -8, to: 8 },
          yoyo: true,
          repeat: -1,
          duration: 380,
          ease: "Sine.InOut",
        })
      );
    }
  }

  stopBuildPieceLoop(piece) {
    if (!piece?.loopTweenRefs) return;
    piece.loopTweenRefs.forEach((tween) => tween?.stop?.());
    piece.loopTweenRefs = [];
  }

  createRoundWinUI(width, height) {
    this.winOverlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000814, 0.5)
      .setDepth(80)
      .setVisible(false);

    this.winCard = this.add.container(width / 2, height / 2).setDepth(81).setVisible(false);
    this.winPanel = this.add
      .rectangle(0, 0, Math.min(width * 0.82, 720), Math.min(height * 0.72, 520), 0x17324b, 0.97)
      .setStrokeStyle(6, 0xffe082);
    this.winTitle = this.add
      .text(0, -145, "You Win This Round!", {
        fontSize: "46px",
        fontStyle: "bold",
        color: "#fff3b0",
      })
      .setOrigin(0.5);
    this.winStats = this.add
      .text(0, -68, "", {
        fontSize: "30px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);
    this.styleTitle = this.add
      .text(0, 2, "Hero Style", {
        fontSize: "24px",
        color: "#bde4ff",
      })
      .setOrigin(0.5);
    this.styleName = this.add
      .text(0, 38, "", {
        fontSize: "28px",
        color: "#ffd180",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const makeButton = (x, y, w, h, label, color) => {
      const bg = this.add
        .rectangle(x, y, w, h, color, 1)
        .setStrokeStyle(3, 0xffffff)
        .setInteractive({ useHandCursor: true });
      const txt = this.add
        .text(x, y, label, {
          fontSize: "24px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      return { bg, txt };
    };

    this.stylePrev = makeButton(-180, 40, 52, 42, "<", 0x276fbf);
    this.styleNext = makeButton(180, 40, 52, 42, ">", 0x276fbf);
    this.playAgainBtn = makeButton(-130, 130, 220, 64, "Play Again", 0x2e7d32);
    this.levelUpBtn = makeButton(130, 130, 220, 64, "Level Up", 0xef6c00);

    this.winCard.add([
      this.winPanel,
      this.winTitle,
      this.winStats,
      this.styleTitle,
      this.styleName,
      this.stylePrev.bg,
      this.stylePrev.txt,
      this.styleNext.bg,
      this.styleNext.txt,
      this.playAgainBtn.bg,
      this.playAgainBtn.txt,
      this.levelUpBtn.bg,
      this.levelUpBtn.txt,
    ]);

    this.stylePrev.bg.on("pointerdown", () => this.cycleStyle(-1));
    this.styleNext.bg.on("pointerdown", () => this.cycleStyle(1));
    this.playAgainBtn.bg.on("pointerdown", () => this.startNextRound(false));
    this.levelUpBtn.bg.on("pointerdown", () => this.startNextRound(true));
    this.updateLevelUpButtonState();
  }

  showRoundWin() {
    this.state = "roundWin";
    this.stopShowtimeMode(false);
    this.hideQuestion();
    if (this.obstacle) this.obstacle.setVelocityX(0);
    if (this.coin) this.coin.setVelocityX(0);

    this.roundWinsTotal += 1;
    const unlockedNow = this.applyStyleUnlocks();
    this.audio.playWin();
    this.fx.floatPraise(this.scale.width / 2, this.scale.height / 2 - 160, "You Win!");

    if (unlockedNow.length > 0) {
      this.fx.floatPraise(this.scale.width / 2, this.scale.height / 2 - 220, `Unlocked: ${RUNNER_STYLES[unlockedNow[0]].name}`);
    }

    this.winStats.setText(
      `Mission Complete!\nCoins: ${this.coinsCollected}\nLevel: ${this.level}\nBadges: ${this.worldBadges.length}`
    );
    this.styleName.setText(RUNNER_STYLES[this.activeStyle]?.name ?? "Hero");
    this.updateLevelUpButtonState();
    this.winOverlay.setVisible(true);
    this.winCard.setVisible(true).setScale(0.9).setAlpha(0);

    this.tweens.add({
      targets: this.winCard,
      scale: 1,
      alpha: 1,
      duration: 220,
      ease: "Back.Out",
    });

    this.saveProgress();
  }

  startNextRound(levelUp) {
    const previousLevel = this.level;
    if (levelUp) {
      this.level = Math.min(this.level + 1, 99);
      if (this.level % 5 === 0) {
        this.unlockWorldBadge(this.level);
      }
    }

    this.correctInRound = 0;
    this.showStars = 0;
    this.stopShowtimeMode(false);
    if (!levelUp) {
      this.missionProgress = 0;
      this.renderBuildProgress(false);
    }
    this.updateHudTexts();
    this.baseSpeed = this.getSpeedForLevel(this.level);
    this.gameSpeed = this.baseSpeed;
    this.rampDelay = 0;
    this.obstaclesSinceQuestion = 0;
    this.obstaclesUntilQuestion = Phaser.Math.Between(3, 6);
    this.questionTriggered = false;
    this.shouldAskQuestion = false;

    this.winOverlay.setVisible(false);
    this.winCard.setVisible(false);

    if (this.level !== previousLevel) {
      this.createBackground(this.scale.width, this.scale.height);
      this.createBuildProjectUI(this.scale.width, this.scale.height);
      this.audio.playCorrect();
      this.fx.floatPraise(this.scale.width * 0.72, 120, `Level ${this.level}`);
    }

    if (levelUp && this.missionProgress >= this.missionTarget) {
      this.startShowtimeMode();
    }

    this.spawnObstacle();
    this.spawnCoin();
    this.state = "running";
    this.updateHudTexts();
    this.saveProgress();
  }

  updateLevelUpButtonState() {
    if (!this.levelUpBtn?.txt || !this.levelUpBtn?.bg) return;
    this.levelUpBtn.txt.setText("Level Up");
    this.levelUpBtn.bg.setFillStyle(0xef6c00, 1);
  }

  cycleStyle(direction) {
    if (this.unlockedStyles.length <= 1) return;

    const currentIdx = Math.max(0, this.unlockedStyles.indexOf(this.activeStyle));
    const nextIdx = (currentIdx + direction + this.unlockedStyles.length) % this.unlockedStyles.length;
    this.activeStyle = this.unlockedStyles[nextIdx];
    this.styleName.setText(RUNNER_STYLES[this.activeStyle]?.name ?? "Hero");
    this.rebuildRunnerRig();
    this.saveProgress();
  }

  applyStyleUnlocks() {
    const unlockedNow = [];
    Object.entries(STYLE_UNLOCKS).forEach(([style, requiredWins]) => {
      if (this.roundWinsTotal >= requiredWins && !this.unlockedStyles.includes(style)) {
        this.unlockedStyles.push(style);
        unlockedNow.push(style);
      }
    });

    if (!this.unlockedStyles.includes(this.activeStyle)) {
      this.activeStyle = this.unlockedStyles[0] ?? "orange_star";
    }

    return unlockedNow;
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) {
        return {
          level: 1,
          roundWinsTotal: 0,
          unlockedStyles: ["orange_star"],
          activeStyle: "orange_star",
          worldBadges: [],
        };
      }
      const parsed = JSON.parse(raw);
      return {
        level: parsed.level ?? 1,
        roundWinsTotal: parsed.roundWinsTotal ?? 0,
        unlockedStyles: Array.isArray(parsed.unlockedStyles) ? parsed.unlockedStyles : ["orange_star"],
        activeStyle: parsed.activeStyle ?? "orange_star",
        worldBadges: Array.isArray(parsed.worldBadges) ? parsed.worldBadges : [],
      };
    } catch {
      return {
        level: 1,
        roundWinsTotal: 0,
        unlockedStyles: ["orange_star"],
        activeStyle: "orange_star",
        worldBadges: [],
      };
    }
  }

  saveProgress() {
    try {
      localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify({
          level: this.level,
          roundWinsTotal: this.roundWinsTotal,
          unlockedStyles: this.unlockedStyles,
          activeStyle: this.activeStyle,
          worldBadges: this.worldBadges,
        })
      );
    } catch {
      // ignore storage errors
    }
  }

  getSpeedForLevel(level) {
    return Math.min(260 + (level - 1) * 20, 340);
  }

  getThemeForLevel(level) {
    const themes = [
      {
        sky: 0x8bc6ee,
        glowColor: 0xfff8d2,
        glowAlpha: 0.22,
        cloudTint: 0xffffff,
        cloudAlpha: 0.68,
        buildingTint: 0xffffff,
        buildingAlphaMin: 0.28,
        buildingAlphaMax: 0.42,
        buildingSpeed: 70,
        decor: "hills",
        obstacleTint: 0x162737,
      },
      {
        sky: 0xffb07c,
        glowColor: 0xffd39e,
        glowAlpha: 0.25,
        cloudTint: 0xffe0b2,
        cloudAlpha: 0.62,
        buildingTint: 0xe4b8a0,
        buildingAlphaMin: 0.3,
        buildingAlphaMax: 0.46,
        buildingSpeed: 75,
        decor: "sunset",
        obstacleTint: 0x3b2114,
      },
      {
        sky: 0x98d9b6,
        glowColor: 0xd6f5d6,
        glowAlpha: 0.18,
        cloudTint: 0xe8fff6,
        cloudAlpha: 0.62,
        buildingTint: 0xb1d7c1,
        buildingAlphaMin: 0.2,
        buildingAlphaMax: 0.34,
        buildingSpeed: 62,
        decor: "trees",
        obstacleTint: 0x2c2018,
      },
      {
        sky: 0x0f2748,
        glowColor: 0x6aa0ff,
        glowAlpha: 0.14,
        cloudTint: 0xb0c7e8,
        cloudAlpha: 0.42,
        buildingTint: 0x9db5d8,
        buildingAlphaMin: 0.26,
        buildingAlphaMax: 0.4,
        buildingSpeed: 74,
        decor: "night",
        obstacleTint: 0xff8a50,
      },
      {
        sky: 0xb2d8ff,
        glowColor: 0xfff3c8,
        glowAlpha: 0.2,
        cloudTint: 0xffffff,
        cloudAlpha: 0.65,
        buildingTint: 0xf0f6ff,
        buildingAlphaMin: 0.24,
        buildingAlphaMax: 0.36,
        buildingSpeed: 70,
        decor: "hills",
        obstacleTint: 0x1d2b3a,
      },
    ];

    return themes[(level - 1) % themes.length];
  }

  getObstacleTint(textureKey) {
    const base = Phaser.Display.Color.IntegerToColor(this.levelTheme?.obstacleTint ?? 0x1d2b3a);
    const clamp = (n) => Math.max(0, Math.min(255, n));

    if (textureKey === "obstacleMonster") {
      return Phaser.Display.Color.GetColor(clamp(base.red + 22), clamp(base.green + 4), clamp(base.blue + 2));
    }

    if (textureKey === "obstacleSpike") {
      return Phaser.Display.Color.GetColor(clamp(base.red + 12), clamp(base.green + 16), clamp(base.blue + 18));
    }

    return this.levelTheme?.obstacleTint ?? 0x1d2b3a;
  }

  spawnObstacle() {
    const width = this.scale.width;
    const styles = [
      { key: "obstacleBlock", bodyScale: 0.92 },
      { key: "obstacleSpike", bodyScale: 0.9 },
      { key: "obstacleMonster", bodyScale: 0.88 },
    ];
    const style = Phaser.Utils.Array.GetRandom(styles);
    const obstacleScale = this.getCompactMobileLayout() ? 0.74 : 1;

    if (this.obstacle?.active) {
      this.obstacle.destroy();
    }

    if (this.heroObstacleCollider) {
      this.heroObstacleCollider.destroy();
    }

    const groundTop = this.ground.getTopCenter().y;
    this.obstacle = this.physics.add
      .image(width + Phaser.Math.Between(180, 300), groundTop - 36, style.key)
      .setDepth(11);
    this.obstacle.setTint(this.getObstacleTint(style.key));

    this.obstacle.body.allowGravity = false;
    this.obstacle.setImmovable(true);
    this.obstacle.setScale(style.bodyScale * obstacleScale);
    this.obstacle.y = groundTop - this.obstacle.displayHeight / 2;
    this.obstacle.body.setSize(this.obstacle.width * 0.9, this.obstacle.height * 0.9, true);
    this.obstacle.setVelocityX(-this.gameSpeed);
    this.heroObstacleCollider = this.physics.add.collider(
      this.hero,
      this.obstacle,
      this.handleHeroHit,
      undefined,
      this
    );

    this.questionTriggered = false;
    this.shouldAskQuestion = this.obstaclesSinceQuestion >= this.obstaclesUntilQuestion;
  }

  spawnCoin() {
    const width = this.scale.width;

    if (this.coin?.active) {
      this.coin.destroy();
    }
    if (this.heroCoinOverlap) {
      this.heroCoinOverlap.destroy();
    }

    const groundTop = this.ground.getTopCenter().y;
    const spawnY = groundTop - Phaser.Math.Between(130, 190);
    this.coin = this.physics.add
      .image(width + Phaser.Math.Between(350, 650), spawnY, "coin")
      .setDepth(11);

    this.coin.body.allowGravity = false;
    this.coin.body.setCircle(14, 4, 4);
    this.coin.setVelocityX(-this.gameSpeed);
    this.coin.setVisible(true);
    this.coin.setActive(true);

    this.heroCoinOverlap = this.physics.add.overlap(this.hero, this.coin, () => this.collectCoin());

    this.tweens.add({
      targets: this.coin,
      y: this.coin.y - 10,
      yoyo: true,
      repeat: -1,
      duration: 360,
      ease: "Sine.InOut",
    });
  }

  resetCoin() {
    const width = this.scale.width;
    const groundTop = this.ground.getTopCenter().y;

    this.coin.x = width + Phaser.Math.Between(320, 640);
    this.coin.y = groundTop - Phaser.Math.Between(130, 190);
    this.coin.setVisible(true);
    this.coin.setActive(true);
    this.coin.setVelocityX(-this.gameSpeed);
  }

  collectCoin() {
    this.audio.unlock();
    this.coinsCollected += 1;
    this.coinText.setText(`Coins: ${this.coinsCollected}`);

    this.audio.playCoin();
    this.fx.celebrateAt(this.coin.x, this.coin.y);
    this.fx.pulseText(this.coinText);

    if (this.coinsCollected >= this.nextCoinMilestone) {
      this.fx.coinMilestone(this.nextCoinMilestone);
      this.audio.playCorrect();
      this.nextCoinMilestone += 5;
    }

    this.resetCoin();
  }

  nextQuestionEntry() {
    if (this.questionPool.length === 0) {
      this.questionPool = createQuestionDeck();
    }
    if (!this.lastQuestionSubject) {
      const first = this.questionPool.pop();
      this.lastQuestionSubject = first?.subject ?? null;
      return first;
    }

    const idx = this.questionPool.findIndex((entry) => entry.subject !== this.lastQuestionSubject);
    const picked = idx >= 0 ? this.questionPool.splice(idx, 1)[0] : this.questionPool.pop();
    this.lastQuestionSubject = picked?.subject ?? this.lastQuestionSubject;
    return picked;
  }

  showQuestion() {
    const entry = this.nextQuestionEntry();
    this.currentQuestion = buildQuestionPrompt(entry);
    this.obstaclesSinceQuestion = 0;
    this.obstaclesUntilQuestion = Phaser.Math.Between(3, 6);

    this.state = "question";

    if (this.obstacle) this.obstacle.setVelocityX(0);
    if (this.coin) this.coin.setVelocityX(0);

    const rig = createQuestionCharacter(this, this.currentQuestion.subject);
    const isMobile = this.getCompactMobileLayout();
    rig.container.setScale(isMobile ? 0.62 : 1.25);
    animateQuestionCharacter(this, rig, this.currentQuestion.correctAnswer);
    this.questionUI.setCharacter(rig.container);

    this.questionUI.show(this.currentQuestion, {
      onSelect: (option) => this.handleOptionTap(option),
      onPreview: (option) => {
        this.audio.unlock();
        this.audio.stopSpeech();
        this.audio.speakWord(option.value);
      },
      onReplay: () => {
        this.audio.unlock();
        this.audio.stopSpeech();
        this.audio.speakQuestionPrompt(this.currentQuestion);
      },
    });

    this.audio.unlock();
    this.audio.stopSpeech();
    this.audio.speakQuestionPromptReliable(this.currentQuestion, 2);
  }

  handleHeroHit() {
    if (this.state !== "running" || this.hitRecovering) return;
    this.hitRecovering = true;
    this.state = "hit";
    this.audio.unlock();
    this.audio.playHit();
    this.cameras.main.shake(200, 0.005);

    const previousProgress = this.missionProgress;
    this.missionProgress = Math.max(0, this.missionProgress - 1);
    if (this.missionProgress !== previousProgress) {
      this.renderBuildProgress(true);
      this.fx.floatPraise(this.scale.width / 2, 120, "One piece lost!");
      if (this.missionProgress < this.missionTarget) {
        this.stopShowtimeMode();
      }
    } else if (this.isShowtime && this.showStars > 0) {
      this.showStars = Math.max(0, this.showStars - 1);
      this.fx.floatPraise(this.scale.width / 2, 120, "Star lost!");
      this.updateHudTexts();
    }

    if (this.obstacle?.active) {
      this.obstacle.destroy();
    }
    if (this.heroObstacleCollider) {
      this.heroObstacleCollider.destroy();
      this.heroObstacleCollider = null;
    }

    this.tweens.add({
      targets: this.runnerRig?.container,
      alpha: 0.35,
      yoyo: true,
      repeat: 3,
      duration: 70,
      onComplete: () => {
        if (this.runnerRig?.container) this.runnerRig.container.alpha = 1;
      },
    });

    this.time.delayedCall(240, () => {
      this.spawnObstacle();
      this.state = "running";
      this.gameSpeed = Math.max(140, this.baseSpeed * 0.72);
      this.rampDelay = 850;
      this.hitRecovering = false;
    });
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;

    const previousGroundY = this.ground.y;
    const newGroundY = this.getGroundY(height);
    const deltaY = newGroundY - previousGroundY;

    this.ground.setPosition(width / 2, newGroundY);
    this.ground.setDisplaySize(width + 20, this.getGroundHeight());
    this.ground.refreshBody();

    if (this.hero.body.blocked.down) {
      this.hero.y = this.ground.getTopCenter().y - this.hero.displayHeight / 2;
    } else {
      this.hero.y += deltaY;
    }
    this.runnerRig.container.setScale(this.getRunnerScale());

    this.skyGlow.setPosition(width * 0.75, height * 0.2);
    this.createBuildings(width, height);
    this.createLevelDecor(width, height);
    this.createGroundMarkers(width);

    this.clouds.forEach((cloud) => {
      if (cloud.x > width + 140) {
        cloud.x = width - Phaser.Math.Between(80, 220);
      }
    });

    if (this.obstacle) {
      const baseScale = this.obstacle.texture.key === "obstacleMonster" ? 0.88 : this.obstacle.texture.key === "obstacleSpike" ? 0.9 : 0.92;
      this.obstacle.setScale(baseScale * (this.getCompactMobileLayout() ? 0.74 : 1));
      this.obstacle.y = this.ground.getTopCenter().y - this.obstacle.displayHeight / 2;
    }

    if (this.coin) {
      this.coin.y = Phaser.Math.Clamp(this.coin.y + deltaY, 70, this.ground.getTopCenter().y - 150);
    }

    this.coinText.setPosition(20, 20);
    this.streakText.setPosition(20, 62);
    this.badgeText.setPosition(20, 98);
    this.showtimeText.setPosition(20, 132);
    if (this.buildSite) {
      this.createBuildProjectUI(width, height);
    }

    if (this.questionUI) {
      this.questionUI.relayout(width, height);
    }

    if (this.winOverlay && this.winCard) {
      this.winOverlay.setPosition(width / 2, height / 2);
      this.winOverlay.width = width;
      this.winOverlay.height = height;
      this.winCard.setPosition(width / 2, height / 2);
      this.winPanel.width = Math.min(width * 0.82, 720);
      this.winPanel.height = Math.min(height * 0.72, 520);
      this.winTitle.setPosition(0, -this.winPanel.height * 0.3);
      this.winTitle.setFontSize(this.getCompactMobileLayout() ? 32 : 46);
      this.winStats.setPosition(0, -this.winPanel.height * 0.15);
      this.styleTitle.setPosition(0, this.winPanel.height * 0.02);
      this.styleName.setPosition(0, this.winPanel.height * 0.12);

      const styleArrowY = this.winPanel.height * 0.12;
      const actionY = this.winPanel.height * 0.32;
      this.stylePrev.bg.setPosition(-180, styleArrowY);
      this.stylePrev.txt.setPosition(-180, styleArrowY);
      this.styleNext.bg.setPosition(180, styleArrowY);
      this.styleNext.txt.setPosition(180, styleArrowY);
      this.playAgainBtn.bg.setPosition(-130, actionY);
      this.playAgainBtn.txt.setPosition(-130, actionY);
      this.levelUpBtn.bg.setPosition(130, actionY);
      this.levelUpBtn.txt.setPosition(130, actionY);
    }
  }

  hideQuestion() {
    this.questionUI.hide();
  }

  handleOptionTap(option) {
    if (this.state !== "question") return;

    this.audio.unlock();
    this.audio.stopSpeech();
    this.audio.speakWord(option.value);

    if (option.value === this.currentQuestion.correctAnswer) {
      this.questionUI.setLocked(true);
      this.questionUI.markCorrect(option);
      this.audio.playCorrect();
      this.correctStreak += 1;
      this.wrongAnswerStreak = 0;
      this.correctInRound += 1;
      const wasStageComplete = this.missionProgress >= this.missionTarget;
      this.missionProgress = Math.min(this.missionTarget, this.missionProgress + 1);
      this.renderBuildProgress(true);
      const isStageComplete = this.missionProgress >= this.missionTarget;
      if (!wasStageComplete && isStageComplete) {
        this.startShowtimeMode();
      } else if (this.isShowtime) {
        this.showStars = Math.min(this.showStarsTarget, this.showStars + 1);
        this.fx.floatPraise(this.scale.width * 0.72, 118, `Star ${this.showStars}!`);
      }
      this.updateHudTexts();
      this.fx.pulseText(this.streakText);
      const optionPos = this.questionUI.getOptionWorldPosition(option);
      this.fx.celebrateAt(optionPos.x, optionPos.y);
      this.fx.floatPraise(this.scale.width / 2, this.scale.height / 2 - 190, this.correctStreak >= 3 ? "Awesome!" : "Great!");
      this.fx.celebrateAt(this.scale.width / 2, 36);

      if (this.isShowtime && this.showStars >= this.showStarsTarget) {
        this.time.delayedCall(500, () => this.showRoundWin());
        return;
      }

      this.time.delayedCall(520, () => {
        this.hideQuestion();
        this.state = "running";
        this.gameSpeed = 120;
        this.rampDelay = 800;
        this.questionTriggered = true;
        if (this.obstacle) this.obstacle.setVelocityX(-this.gameSpeed);
        if (this.coin) this.coin.setVelocityX(-this.gameSpeed);
      });

      return;
    }

    this.questionUI.markWrong(option);
    this.audio.unlock();
    this.audio.playWrong();
    this.correctStreak = 0;
    this.wrongAnswerStreak += 1;
    const previousProgress = this.missionProgress;
    this.missionProgress = Math.max(0, this.missionProgress - 1);
    if (this.missionProgress !== previousProgress) {
      this.renderBuildProgress(true);
      this.fx.floatPraise(this.scale.width / 2, 120, "Oops!");
      if (this.missionProgress < this.missionTarget) {
        this.stopShowtimeMode();
      }
      this.tweens.add({
        targets: this.buildSite?.container,
        x: (this.buildSite?.container?.x ?? 0) + 10,
        yoyo: true,
        duration: 70,
        repeat: 2,
      });
    } else if (this.isShowtime && this.showStars > 0) {
      this.showStars = Math.max(0, this.showStars - 1);
      this.fx.floatPraise(this.scale.width * 0.72, 118, "Star lost!");
    }
    this.updateHudTexts();
    this.fx.wrongChoiceFeedback(option.container);

    this.questionUI.setLocked(true);
    const lockDelay = this.wrongAnswerStreak >= 2 ? 950 : 380;
    if (this.wrongAnswerStreak >= 2) {
      this.audio.stopSpeech();
      this.audio.speakQuestionPromptReliable(this.currentQuestion, 1);
    }
    this.time.delayedCall(lockDelay, () => {
      this.questionUI.setLocked(false);
      option.bg.setFillStyle(0xffffff, 0.98);
      option.bg.setStrokeStyle(4, 0x2c3e50);
    });
  }

  update(_, delta) {
    const isGrounded = this.hero.body.blocked.down;
    if (isGrounded) {
      this.jumpCount = 0;
    }

    this.runnerRig.container.setPosition(this.hero.x, this.hero.y + this.runnerYOffset);
    updateRunnerJumpPose(this.runnerRig, isGrounded);

    this.clouds.forEach((cloud) => {
      cloud.x -= (cloud.parallaxSpeed ?? 26) * (delta / 1000);
      if (cloud.x < -120) cloud.x = this.scale.width + 120;
    });

    if (this.levelDecor) {
      this.levelDecor.forEach((item) => {
        const speed = item.parallaxSpeed ?? 12;
        item.x -= speed * (delta / 1000);
        if (item.x < -220) {
          item.x = this.scale.width + Phaser.Math.Between(120, 260);
        }
      });
    }

    this.buildings.forEach((building) => {
      building.x -= (building.parallaxSpeed ?? 70) * (delta / 1000);
      if (building.x <= -this.buildingSpacing) {
        building.x += this.buildingSpacing * this.buildings.length;
      }
    });

    if (this.state === "running") {
      if (this.rampDelay > 0) {
        this.rampDelay -= delta;
      } else if (this.gameSpeed < this.baseSpeed) {
        this.gameSpeed += 2.2;
      }

      if (this.obstacle) this.obstacle.setVelocityX(-this.gameSpeed);
      if (this.coin) this.coin.setVelocityX(-this.gameSpeed);
      if (!this.coin || !this.coin.active) this.spawnCoin();

      this.roadMarks.forEach((mark) => {
        mark.x -= (this.gameSpeed + 80) * (delta / 1000);
        if (mark.x <= -this.roadMarkSpacing) {
          mark.x += this.roadMarkSpacing * this.roadMarks.length;
        }
      });

      if (
        this.shouldAskQuestion &&
        !this.questionTriggered &&
        this.obstacle.x < 540 &&
        this.obstacle.x > 420
      ) {
        this.questionTriggered = true;
        this.showQuestion();
      }
    }

    if (this.obstacle && this.obstacle.x < -80) {
      this.obstaclesSinceQuestion += 1;
      this.spawnObstacle();
    }

    if (this.coin && this.coin.x < -50) {
      this.resetCoin();
    }
  }

  getCompactMobileLayout() {
    const dpr = window.devicePixelRatio || 1;
    const viewportWidth = this.scale.width / dpr;
    const viewportHeight = this.scale.height / dpr;
    return this.sys.game.device.input.touch && viewportHeight <= 460 && viewportWidth <= 950;
  }

  getRunnerScale() {
    return this.getCompactMobileLayout() ? 0.82 : 1;
  }

  getGroundY(height) {
    return height - (this.getCompactMobileLayout() ? 16 : 40);
  }

  getGroundHeight() {
    return this.getCompactMobileLayout() ? 120 : 90;
  }
}
