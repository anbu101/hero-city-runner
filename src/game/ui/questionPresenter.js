const PHONIC_HINTS = {
  running: "Run-ning",
  sleeping: "Sleep-ing",
  jumping: "Jump-ing",
  dancing: "Dan-cing",
  cat: "Cat",
  dog: "Dog",
  boy: "Boy",
  hero: "He-ro",
};

function toPhonic(word) {
  if (!word) return "";
  const normalized = word.toLowerCase();
  if (PHONIC_HINTS[normalized]) return PHONIC_HINTS[normalized];

  if (normalized.endsWith("ing") && normalized.length > 5) {
    return `${word.slice(0, -3)}-ing`;
  }

  return word;
}

export class QuestionPresenter {
  constructor(scene, width, height) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.isLocked = false;
    this.optionEntries = [];
    this.isMobileLayout = false;

    this.overlay = scene.add
      .rectangle(width / 2, height / 2, width, height, 0x001120, 0.42)
      .setVisible(false)
      .setDepth(20);

    this.card = scene.add.container(width / 2, height / 2 - 12).setVisible(false).setDepth(25);
    this.optionsLayer = scene.add.container(0, 0);

    this.panel = scene.add
      .rectangle(0, 0, Math.min(width * 0.92, 980), Math.min(height * 0.74, 540), 0x1f3b5b, 0.95)
      .setStrokeStyle(6, 0xffe082, 1);

    this.titleText = scene.add
      .text(0, -170, "", {
        fontSize: "44px",
        fontStyle: "bold",
        color: "#fff3b0",
      })
      .setOrigin(0.5);

    this.sentenceText = scene.add
      .text(0, 90, "", {
        fontSize: "38px",
        color: "#ffb74d",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);

    this.instructionText = scene.add
      .text(0, 140, "", {
        fontSize: "26px",
        color: "#a5d6ff",
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.replayButton = scene.add
      .rectangle(330, -170, 120, 52, 0x2a6fdb)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.replayLabel = scene.add
      .text(330, -170, "Replay", {
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.characterSlot = scene.add.container(0, -80);

    this.card.add([
      this.panel,
      this.titleText,
      this.sentenceText,
      this.instructionText,
      this.replayButton,
      this.replayLabel,
      this.characterSlot,
      this.optionsLayer,
    ]);

    this.replayButton.on("pointerdown", () => {
      if (this.onReplay) this.onReplay();
    });

    this.relayout(width, height);
  }

  createOption(x, y) {
    const container = this.scene.add.container(x, y).setVisible(false);

    const bg = this.scene.add
      .rectangle(0, 0, 210, 84, 0xffffff, 0.98)
      .setStrokeStyle(4, 0x2c3e50)
      .setInteractive({ useHandCursor: true });

    const label = this.scene.add
      .text(0, 0, "", {
        fontSize: "30px",
        color: "#17324b",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    container.add([bg, label]);
    this.optionsLayer.add(container);

    const option = { container, bg, label, value: "", baseY: y, baseX: x, previewing: false };
    this.optionEntries.push(option);

    bg.on("pointerover", () => {
      if (this.isLocked) return;
      bg.setFillStyle(0xe3f2fd, 1);
      container.y = option.baseY - 4;
      option.label.setText(option.phonicText ?? option.value);
    });

    bg.on("pointerout", () => {
      if (this.isLocked) return;
      bg.setFillStyle(0xffffff, 0.98);
      container.y = option.baseY;
      if (!option.previewing) {
        option.label.setText(option.value);
      }
    });

    bg.on("pointerdown", () => {
      if (this.isLocked || !this.onSelect) return;

      if (this.isMobileLayout) {
        option.previewing = true;
        option.label.setText(option.phonicText ?? option.value);
        if (this.onPreview) this.onPreview(option);
        if (option.previewResetTimer) option.previewResetTimer.remove(false);
        option.previewResetTimer = this.scene.time.delayedCall(450, () => {
          option.previewing = false;
          option.label.setText(option.value);
        });
        this.onSelect(option);
        return;
      }

      this.onSelect(option);
    });
  }

  buildOptions() {
    for (let i = 0; i < 3; i += 1) {
      this.createOption(0, 0);
    }

    this.relayout(this.width, this.height);
  }

  show(question, callbacks) {
    this.relayout(this.width, this.height);

    this.isLocked = false;
    this.onSelect = callbacks.onSelect;
    this.onReplay = callbacks.onReplay;
    this.onPreview = callbacks.onPreview;

    this.sentenceText.setText(question.sentence);
    this.instructionText.setText("");

    this.optionEntries.forEach((entry, idx) => {
      entry.value = question.options[idx] ?? "";
      entry.phonicText = toPhonic(entry.value);
      entry.label.setText(entry.value);
      entry.previewing = false;
      entry.bg.setFillStyle(0xffffff, 0.98);
      entry.bg.setStrokeStyle(4, 0x2c3e50);
      entry.container.setPosition(entry.baseX, entry.baseY);
      entry.container.setVisible(true);
      entry.container.setAlpha(0);
      entry.container.setScale(0.9);

      this.scene.tweens.add({
        targets: entry.container,
        alpha: 1,
        scale: 1,
        duration: 220,
        delay: idx * 60,
        ease: "Back.Out",
      });
    });

    this.overlay.setAlpha(0).setVisible(true);
    this.card.setAlpha(0).setScale(0.92).setVisible(true);

    this.scene.tweens.add({ targets: this.overlay, alpha: 1, duration: 160 });
    this.scene.tweens.add({
      targets: this.card,
      alpha: 1,
      scale: 1,
      duration: 220,
      ease: "Back.Out",
    });
  }

  hide() {
    this.isLocked = true;

    this.scene.tweens.add({
      targets: [this.card, ...this.optionEntries.map((o) => o.container)],
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.card.setVisible(false);
        this.optionEntries.forEach((o) => o.container.setVisible(false));
      },
    });

    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: 150,
      onComplete: () => this.overlay.setVisible(false),
    });

    if (this.currentCharacter) {
      this.currentCharacter.destroy();
      this.currentCharacter = null;
    }
  }

  setCharacter(characterContainer) {
    if (this.currentCharacter) {
      this.currentCharacter.destroy();
    }

    this.currentCharacter = characterContainer;
    this.characterSlot.add(characterContainer);
  }

  setLocked(value) {
    this.isLocked = value;
  }

  markCorrect(option) {
    option.bg.setFillStyle(0xd9fdd3, 1);
    option.bg.setStrokeStyle(5, 0x1b8f33);

    this.scene.tweens.add({
      targets: option.container,
      scale: 1.08,
      yoyo: true,
      duration: 120,
      repeat: 1,
    });
  }

  markWrong(option) {
    option.bg.setFillStyle(0xffdde1, 1);
    option.bg.setStrokeStyle(5, 0xb00020);
  }

  relayout(width, height) {
    this.width = width;
    this.height = height;

    const dpr = window.devicePixelRatio || 1;
    const viewportWidth = width / dpr;
    const viewportHeight = height / dpr;
    const hasTouch = this.scene.sys.game.device.input.touch;
    const coarsePointer =
      typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    const compactLayout = (hasTouch || coarsePointer) && (viewportWidth <= 1366 || viewportHeight <= 820);
    const tinyLandscapePhone = compactLayout && viewportHeight <= 420;

    this.isMobileLayout = compactLayout;

    this.overlay.setPosition(width / 2, height / 2);
    this.overlay.width = width;
    this.overlay.height = height;

    this.card.setPosition(width / 2, compactLayout ? height / 2 + 4 : height / 2 - 10);
    this.panel.width = compactLayout ? Math.min(width * 0.96, 900) : Math.min(width * 0.9, 980);
    this.panel.height = compactLayout ? Math.min(height * 0.88, 390) : Math.min(height * 0.74, 540);

    this.titleText.setPosition(0, -this.panel.height * 0.4);
    this.titleText.setFontSize(compactLayout ? 22 : 44);

    this.replayButton.setPosition(this.panel.width * 0.33, -this.panel.height * 0.4);
    this.replayButton.width = compactLayout ? 90 : 120;
    this.replayButton.height = compactLayout ? 42 : 52;
    this.replayLabel.setPosition(this.panel.width * 0.33, -this.panel.height * 0.4);
    this.replayLabel.setFontSize(compactLayout ? 16 : 22);

    if (compactLayout) {
      this.characterSlot.setPosition(-this.panel.width * 0.29, tinyLandscapePhone ? -this.panel.height * 0.1 : -this.panel.height * 0.06);
      this.sentenceText.setPosition(this.panel.width * 0.17, tinyLandscapePhone ? -this.panel.height * 0.2 : -this.panel.height * 0.17);
      this.sentenceText.setFontSize(tinyLandscapePhone ? 28 : 30);
      this.sentenceText.setWordWrapWidth(this.panel.width * 0.47);

      this.instructionText.setPosition(this.panel.width * 0.17, tinyLandscapePhone ? -this.panel.height * 0.15 : -this.panel.height * 0.1);
      this.instructionText.setFontSize(tinyLandscapePhone ? 12 : 14);
      this.instructionText.setWordWrapWidth(this.panel.width * 0.47);

      const buttonWidth = tinyLandscapePhone ? 230 : 242;
      const buttonHeight = tinyLandscapePhone ? 44 : 64;
      const step = tinyLandscapePhone ? 50 : 70;
      const marginBottom = tinyLandscapePhone ? 14 : 18;
      const firstY = this.panel.height / 2 - marginBottom - step * 2;
      const optionX = 156;

      this.optionEntries.forEach((entry, idx) => {
        entry.bg.setSize(buttonWidth, buttonHeight);
        entry.bg.setDisplaySize(buttonWidth, buttonHeight);
        entry.bg.setStrokeStyle(4, 0x2c3e50);
        entry.label.setFontSize(tinyLandscapePhone ? 20 : 24);
        entry.label.setWordWrapWidth(null);
        entry.label.setPosition(0, 0);
        entry.baseX = optionX;
        entry.baseY = firstY + idx * step;
        entry.container.setPosition(entry.baseX, entry.baseY);
      });

      return;
    }

    this.characterSlot.setPosition(0, -this.panel.height * 0.18);
    this.sentenceText.setPosition(0, this.panel.height * 0.16);
    this.sentenceText.setFontSize(42);
    this.sentenceText.setWordWrapWidth(this.panel.width * 0.88);

    this.instructionText.setPosition(0, this.panel.height * 0.22);
    this.instructionText.setFontSize(26);
    this.instructionText.setWordWrapWidth(this.panel.width * 0.88);

    const y = this.panel.height * 0.33;
    const spacing = Math.min(260, width * 0.28);
    const xStart = -spacing;

    this.optionEntries.forEach((entry, idx) => {
      entry.bg.width = 210;
      entry.bg.height = 84;
      entry.label.setFontSize(30);
      entry.label.setWordWrapWidth(null);
      entry.label.setPosition(0, 0);
      entry.baseX = xStart + idx * spacing;
      entry.baseY = y;
      entry.container.setPosition(entry.baseX, entry.baseY);
    });
  }

  getOptionWorldPosition(option) {
    const matrix = option.container.getWorldTransformMatrix();
    return { x: matrix.tx, y: matrix.ty };
  }

  pickOptionAtGamePoint(x, y) {
    for (let i = 0; i < this.optionEntries.length; i += 1) {
      const entry = this.optionEntries[i];
      if (!entry.container.visible) continue;
      const matrix = entry.container.getWorldTransformMatrix();
      const cx = matrix.tx;
      const cy = matrix.ty;
      const halfW = (entry.bg.displayWidth || entry.bg.width || 0) * 0.5;
      const halfH = (entry.bg.displayHeight || entry.bg.height || 0) * 0.5;
      const padW = this.isMobileLayout ? 26 : 8;
      const padH = this.isMobileLayout ? 18 : 6;
      const insideX = Math.abs(x - cx) <= halfW + padW;
      const insideY = Math.abs(y - cy) <= halfH + padH;
      if (insideX && insideY) {
        return entry;
      }
    }
    return null;
  }

  pickOptionAtClientPoint(clientX, clientY) {
    const canvas = this.scene.sys.game.canvas;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const scaleX = this.scene.scale.width / rect.width;
    const scaleY = this.scene.scale.height / rect.height;
    const gameX = (clientX - rect.left) * scaleX;
    const gameY = (clientY - rect.top) * scaleY;
    return this.pickOptionAtGamePoint(gameX, gameY);
  }

  pickNearestOptionAtGamePoint(x, y) {
    const visible = this.optionEntries.filter((entry) => entry.container.visible);
    if (!visible.length) return null;

    let nearest = null;
    let nearestDist = Number.POSITIVE_INFINITY;
    visible.forEach((entry) => {
      const matrix = entry.container.getWorldTransformMatrix();
      const dx = x - matrix.tx;
      const dy = y - matrix.ty;
      const d2 = dx * dx + dy * dy;
      if (d2 < nearestDist) {
        nearest = entry;
        nearestDist = d2;
      }
    });

    const maxDistance = this.isMobileLayout ? 260 * 260 : 180 * 180;
    return nearestDist <= maxDistance ? nearest : null;
  }

  pickNearestOptionAtClientPoint(clientX, clientY) {
    const canvas = this.scene.sys.game.canvas;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const scaleX = this.scene.scale.width / rect.width;
    const scaleY = this.scene.scale.height / rect.height;
    const gameX = (clientX - rect.left) * scaleX;
    const gameY = (clientY - rect.top) * scaleY;
    return this.pickNearestOptionAtGamePoint(gameX, gameY);
  }
}
