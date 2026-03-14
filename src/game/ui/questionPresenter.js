import Phaser from "phaser";

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
    this.questionMode = "mcq";
    this.spellingSlots = [];
    this.spellingTiles = [];
    this.spellingUsedHint = false;
    this.spellingFixedIndices = [];

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
      .setOrigin(0.5)
      .setVisible(false);

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
      .rectangle(330, -170, 102, 44, 0x2a6fdb)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.replayLabel = scene.add
      .text(330, -170, "Replay", {
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.characterSlot = scene.add.container(0, -80);
    this.characterGroundY = 76;
    this.characterShadow = scene.add.ellipse(0, this.characterGroundY - 8, 126, 20, 0x000000, 0.18);
    this.characterGroundTop = scene.add
      .rectangle(0, this.characterGroundY, 264, 8, 0x66bb6a, 0.92)
      .setStrokeStyle(1, 0x2e7d32, 0.95);
    this.characterGround = scene.add
      .rectangle(0, this.characterGroundY + 12, 272, 24, 0x2e7d32, 0.95)
      .setStrokeStyle(2, 0x1b5e20, 0.9);
    this.characterSlot.add([this.characterShadow, this.characterGroundTop, this.characterGround]);
    this.spellingLayer = scene.add.container(0, 0).setVisible(false);
    this.spellingClueText = scene.add
      .text(0, 0, "", {
        fontSize: "34px",
        color: "#fff3b0",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.hintButton = scene.add
      .rectangle(0, 0, 96, 36, 0xef6c00, 0.95)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.hintLabel = scene.add
      .text(0, 0, "Hint", {
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.backButton = scene.add
      .rectangle(0, 0, 96, 36, 0x546e7a, 0.95)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.backLabel = scene.add
      .text(0, 0, "Back", {
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.spellingLayer.add([this.spellingClueText, this.hintButton, this.hintLabel, this.backButton, this.backLabel]);

    this.card.add([
      this.panel,
      this.titleText,
      this.sentenceText,
      this.instructionText,
      this.replayButton,
      this.replayLabel,
      this.characterSlot,
      this.spellingLayer,
      this.optionsLayer,
    ]);

    this.replayButton.on("pointerdown", () => {
      if (this.onReplay) this.onReplay();
    });
    this.hintButton.on("pointerdown", () => this.revealHintLetter());
    this.backButton.on("pointerdown", () => this.backspaceSpellingLetter());
    this.onKeyDown = (event) => this.handleKeyDown(event);
    this.scene.input.keyboard?.on("keydown", this.onKeyDown);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.input.keyboard?.off("keydown", this.onKeyDown);
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

  show(question, callbacks, mode = "mcq", modeConfig = {}) {
    this.relayout(this.width, this.height);

    this.questionMode = mode;
    this.isLocked = false;
    this.onSelect = callbacks.onSelect;
    this.onReplay = callbacks.onReplay;
    this.onPreview = callbacks.onPreview;
    this.onSpellSubmit = callbacks.onSpellSubmit;
    this.onSpellWrong = callbacks.onSpellWrong;
    this.modeConfig = modeConfig ?? {};

    this.sentenceText.setText(question.sentence);
    this.instructionText.setText("");
    this.titleText.setText("");
    if (this.questionMode === "spelling") {
      this.optionEntries.forEach((entry) => entry.container.setVisible(false));
      this.prepareSpellingQuestion(question);
    } else {
      this.clearSpellingUI();
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
    }

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
    this.clearSpellingUI();

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
    this.currentCharacter.setPosition(0, 0);
    this.characterSlot.add(characterContainer);
    this.alignCharacterToGround();
  }

  alignCharacterToGround() {
    if (!this.currentCharacter) return;
    const slotMatrix = this.characterSlot.getWorldTransformMatrix();
    const extraLift = this.currentCharacter.__groundAlignLift ?? 0;
    const desiredBottom = slotMatrix.ty + this.characterGroundY - 14 - extraLift;
    const bounds = this.getVisibleWorldBounds(this.currentCharacter) ?? this.currentCharacter.getBounds();
    if (!bounds || !Number.isFinite(bounds.bottom)) return;
    const delta = desiredBottom - bounds.bottom;
    this.currentCharacter.y += delta;
  }

  getVisibleWorldBounds(displayObject) {
    if (!displayObject || displayObject.visible === false || displayObject.__ignoreGroundAlign) return null;

    if (Array.isArray(displayObject.list)) {
      let merged = null;
      displayObject.list.forEach((child) => {
        const childBounds = this.getVisibleWorldBounds(child);
        if (!childBounds) return;
        if (!merged) {
          merged = new Phaser.Geom.Rectangle(childBounds.x, childBounds.y, childBounds.width, childBounds.height);
          return;
        }
        const minX = Math.min(merged.x, childBounds.x);
        const minY = Math.min(merged.y, childBounds.y);
        const maxX = Math.max(merged.right, childBounds.right);
        const maxY = Math.max(merged.bottom, childBounds.bottom);
        merged.setTo(minX, minY, maxX - minX, maxY - minY);
      });
      return merged;
    }

    if (typeof displayObject.getBounds === "function") {
      return displayObject.getBounds();
    }

    return null;
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

  clearSpellingUI() {
    this.spellingLayer.setVisible(false);
    this.spellingClueText.setVisible(false);
    this.spellingSlots.forEach((slot) => slot.container.destroy());
    this.spellingSlots = [];
    this.spellingTiles.forEach((tile) => tile.container.destroy());
    this.spellingTiles = [];
    this.spellingAnswer = "";
    this.spellingChars = [];
    this.spellingFixedIndices = [];
  }

  getSpellingPattern(answer) {
    const chars = answer.split("");
    const len = chars.length;
    const preferredPrefill = Math.max(1, Math.min(len - 1, this.modeConfig?.prefillCount ?? 2));
    const fixed = new Set();
    fixed.add(0);
    if (len > 2 && fixed.size < preferredPrefill) fixed.add(len - 2);
    if (len > 4 && fixed.size < preferredPrefill) fixed.add(Math.floor(len / 2));
    let cursor = 1;
    while (fixed.size < preferredPrefill && cursor < len - 1) {
      fixed.add(cursor);
      cursor += 2;
    }
    this.spellingFixedIndices = [...fixed].sort((a, b) => a - b);
    return chars.map((ch, idx) => (fixed.has(idx) ? ch : ""));
  }

  prepareSpellingQuestion(question) {
    this.clearSpellingUI();
    this.spellingLayer.setVisible(true);
    this.spellingClueText.setVisible(true);
    this.spellingUsedHint = false;
    this.spellingAnswer = String(question.correctAnswer ?? "").toUpperCase();
    this.spellingChars = this.getSpellingPattern(this.spellingAnswer);
    this.refreshSpellingSlots();
    this.buildSpellingTiles();
    this.relayout(this.width, this.height);
  }

  refreshSpellingSlots() {
    this.spellingSlots.forEach((slot) => slot.container.destroy());
    this.spellingSlots = [];
    for (let i = 0; i < this.spellingAnswer.length; i += 1) {
      const box = this.scene.add.rectangle(0, 0, 54, 64, 0xffffff, 0.96).setStrokeStyle(3, 0x2c3e50);
      const txt = this.scene.add
        .text(0, 0, this.spellingChars[i] || "_", {
          fontSize: "36px",
          color: "#17324b",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      const container = this.scene.add.container(0, 0, [box, txt]);
      this.spellingLayer.add(container);
      this.spellingSlots.push({ container, box, txt, index: i });
    }
    this.spellingClueText.setText(this.getSpellingPatternText());
  }

  getSpellingPatternText() {
    return this.spellingChars.map((ch) => (ch ? ch : "_")).join(" ");
  }

  buildSpellingTiles() {
    const requiredLetters = [];
    for (let i = 0; i < this.spellingAnswer.length; i += 1) {
      if (!this.spellingChars[i]) requiredLetters.push(this.spellingAnswer[i]);
    }
    const distractorPool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter((c) => !this.spellingAnswer.includes(c));
    const tileCount = Math.max(requiredLetters.length + 2, 6, this.modeConfig?.tileCount ?? 8);
    const letters = [...requiredLetters];
    while (letters.length < tileCount) {
      letters.push(distractorPool[Math.floor(Math.random() * distractorPool.length)]);
    }
    while (letters.length > tileCount) {
      const removeIdx = letters.findIndex((letter) => !requiredLetters.includes(letter));
      if (removeIdx === -1) break;
      letters.splice(removeIdx, 1);
    }
    const countLetters = (arr) => {
      const map = new Map();
      arr.forEach((ch) => map.set(ch, (map.get(ch) ?? 0) + 1));
      return map;
    };
    const needMap = countLetters(requiredLetters);
    const haveMap = countLetters(letters);
    needMap.forEach((needCount, ch) => {
      const haveCount = haveMap.get(ch) ?? 0;
      if (haveCount >= needCount) return;
      const missingCount = needCount - haveCount;
      for (let i = 0; i < missingCount; i += 1) {
        const removeIdx = letters.findIndex((letter) => !needMap.has(letter));
        if (removeIdx >= 0) {
          letters[removeIdx] = ch;
        } else {
          letters.push(ch);
        }
      }
    });
    Phaser.Utils.Array.Shuffle(letters);

    this.spellingTiles.forEach((tile) => tile.container.destroy());
    this.spellingTiles = [];
    letters.forEach((letter) => {
      const box = this.scene.add
        .rectangle(0, 0, 66, 56, 0xffffff, 0.98)
        .setStrokeStyle(3, 0x2c3e50)
        .setInteractive({ useHandCursor: true });
      const txt = this.scene.add
        .text(0, 0, letter, {
          fontSize: "34px",
          color: "#17324b",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      const container = this.scene.add.container(0, 0, [box, txt]);
      box.on("pointerdown", () => this.pickSpellingLetter(letter, box));
      this.spellingLayer.add(container);
      this.spellingTiles.push({ container, box, txt, letter });
    });
  }

  pickSpellingLetter(letter, tileBg) {
    if (this.isLocked || this.questionMode !== "spelling") return;
    const nextIdx = this.spellingChars.findIndex((ch, idx) => !ch && !this.spellingFixedIndices.includes(idx));
    if (nextIdx < 0) return;
    this.spellingChars[nextIdx] = letter;
    this.spellingSlots[nextIdx].txt.setText(letter);
    this.spellingClueText.setText(this.getSpellingPatternText());
    if (tileBg) {
      this.scene.tweens.add({ targets: tileBg, scaleX: 0.92, scaleY: 0.92, yoyo: true, duration: 80 });
    }
    this.checkSpellingCompletion();
  }

  backspaceSpellingLetter() {
    if (this.isLocked || this.questionMode !== "spelling") return;
    for (let i = this.spellingChars.length - 1; i >= 0; i -= 1) {
      if (this.spellingFixedIndices.includes(i)) continue;
      if (!this.spellingChars[i]) continue;
      this.spellingChars[i] = "";
      this.spellingSlots[i].txt.setText("_");
      this.spellingClueText.setText(this.getSpellingPatternText());
      break;
    }
  }

  revealHintLetter() {
    if (this.isLocked || this.questionMode !== "spelling") return;
    const idx = this.spellingChars.findIndex((ch, i) => !ch && !this.spellingFixedIndices.includes(i));
    if (idx < 0) return;
    this.spellingUsedHint = true;
    const letter = this.spellingAnswer[idx];
    this.spellingChars[idx] = letter;
    this.spellingSlots[idx].txt.setText(letter);
    this.spellingSlots[idx].box.setFillStyle(0xfff3cd, 1);
    this.spellingClueText.setText(this.getSpellingPatternText());
    this.checkSpellingCompletion();
  }

  checkSpellingCompletion() {
    if (this.spellingChars.some((ch) => !ch)) return;
    const built = this.spellingChars.join("");
    if (built === this.spellingAnswer) {
      this.isLocked = true;
      if (this.onSpellSubmit) this.onSpellSubmit({ answer: built, usedHint: this.spellingUsedHint });
      return;
    }

    if (this.onSpellWrong) this.onSpellWrong();
    this.scene.time.delayedCall(320, () => {
      for (let i = 0; i < this.spellingChars.length; i += 1) {
        if (this.spellingFixedIndices.includes(i)) continue;
        this.spellingChars[i] = "";
        this.spellingSlots[i].txt.setText("_");
      }
      this.spellingClueText.setText(this.getSpellingPatternText());
    });
  }

  handleKeyDown(event) {
    if (this.isLocked || this.questionMode !== "spelling" || !this.card.visible) return;
    const key = String(event?.key ?? "").toUpperCase();
    if (!key) return;

    if (key === "BACKSPACE" || key === "DELETE") {
      this.backspaceSpellingLetter();
      return;
    }

    if (key.length === 1 && key >= "A" && key <= "Z") {
      this.pickSpellingLetter(key, null);
    }
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
    const ultraTinyLandscapePhone = compactLayout && viewportHeight <= 390;
    const isSpelling = this.questionMode === "spelling";

    this.isMobileLayout = compactLayout;

    this.overlay.setPosition(width / 2, height / 2);
    this.overlay.width = width;
    this.overlay.height = height;

    this.card.setPosition(width / 2, compactLayout ? height / 2 + 6 : height / 2 - 10);
    this.panel.width = compactLayout ? Math.min(width * 0.97, 920) : Math.min(width * 0.9, 980);
    this.panel.height = compactLayout ? Math.min(height * 0.9, 420) : Math.min(height * 0.74, 540);

    this.titleText.setPosition(0, -this.panel.height * 0.4);
    this.titleText.setFontSize(compactLayout ? 22 : 44);

    this.replayButton.setPosition(this.panel.width * 0.33, -this.panel.height * 0.4);
    this.replayButton.width = compactLayout ? 88 : 102;
    this.replayButton.height = compactLayout ? 34 : 44;
    this.replayLabel.setPosition(this.panel.width * 0.33, -this.panel.height * 0.4);
    this.replayLabel.setFontSize(compactLayout ? 14 : 18);

    if (compactLayout) {
      this.layoutCompactMobile(tinyLandscapePhone, ultraTinyLandscapePhone, isSpelling);
      this.alignCharacterToGround();
      return;
    }

    this.characterSlot.setPosition(isSpelling ? -this.panel.width * 0.3 : 0, isSpelling ? -this.panel.height * 0.24 : -this.panel.height * 0.18);
    this.characterGroundY = 82;
    this.characterShadow.setPosition(0, this.characterGroundY - 8).setSize(126, 20);
    this.characterGroundTop.setPosition(0, this.characterGroundY).setSize(264, 8);
    this.characterGround.setPosition(0, this.characterGroundY + 12).setSize(272, 24);
    this.sentenceText.setPosition(
      isSpelling ? -this.panel.width * 0.22 : 0,
      isSpelling ? this.panel.height * 0.08 : this.panel.height * 0.16
    );
    this.sentenceText.setFontSize(42);
    this.sentenceText.setWordWrapWidth(isSpelling ? this.panel.width * 0.38 : this.panel.width * 0.88);

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

    const spellingLayout = isSpelling
      ? {
          baseX: this.panel.width * 0.24,
          clueY: -this.panel.height * 0.22,
          slotY: -this.panel.height * 0.08,
          tilesStartY: 0,
          utilY: this.panel.height * 0.34,
        }
      : {};
    this.layoutSpellingUI(false, false, spellingLayout);

    this.alignCharacterToGround();
  }

  layoutCompactMobile(tinyLandscapePhone, ultraTinyLandscapePhone, isSpelling) {
    const topY = ultraTinyLandscapePhone ? -this.panel.height * 0.28 : -this.panel.height * 0.26;
    const sentenceY = ultraTinyLandscapePhone ? -this.panel.height * 0.02 : this.panel.height * 0.01;
    const controlsY = this.panel.height * 0.36;

    this.characterSlot.setPosition(0, topY);
    this.characterGroundY = ultraTinyLandscapePhone ? 52 : tinyLandscapePhone ? 56 : 60;
    this.characterShadow.setPosition(0, this.characterGroundY - 6).setSize(94, 14);
    this.characterGroundTop.setPosition(0, this.characterGroundY).setSize(180, 6);
    this.characterGround.setPosition(0, this.characterGroundY + 9).setSize(188, 18);

    this.sentenceText.setPosition(0, sentenceY);
    this.sentenceText.setFontSize(ultraTinyLandscapePhone ? 24 : 28);
    this.sentenceText.setWordWrapWidth(this.panel.width * 0.82);

    this.instructionText.setPosition(0, sentenceY + 34);
    this.instructionText.setFontSize(12);
    this.instructionText.setWordWrapWidth(this.panel.width * 0.82);

    this.replayButton.setPosition(this.panel.width * 0.29, ultraTinyLandscapePhone ? -this.panel.height * 0.34 : -this.panel.height * 0.36);
    this.replayLabel.setPosition(this.replayButton.x, this.replayButton.y);
    this.replayButton.setSize(78, 30);
    this.replayLabel.setFontSize(13);

    if (isSpelling) {
      this.layoutSpellingUI(tinyLandscapePhone, ultraTinyLandscapePhone, {
        baseX: 0,
        clueY: ultraTinyLandscapePhone ? this.panel.height * 0.08 : this.panel.height * 0.09,
        slotY: ultraTinyLandscapePhone ? this.panel.height * 0.14 : this.panel.height * 0.15,
        tilesStartY: ultraTinyLandscapePhone ? this.panel.height * 0.2 : this.panel.height * 0.22,
        utilY: controlsY,
      });
      return;
    }

    const buttonWidth = this.panel.width * 0.74;
    const buttonHeight = ultraTinyLandscapePhone ? 42 : 46;
    const step = ultraTinyLandscapePhone ? 48 : 54;
    const firstY = this.panel.height * 0.15;

    this.optionEntries.forEach((entry, idx) => {
      entry.bg.setSize(buttonWidth, buttonHeight);
      entry.bg.setDisplaySize(buttonWidth, buttonHeight);
      entry.bg.setStrokeStyle(4, 0x2c3e50);
      entry.label.setFontSize(ultraTinyLandscapePhone ? 24 : 26);
      entry.label.setWordWrapWidth(buttonWidth - 24);
      entry.label.setPosition(0, 0);
      entry.baseX = 0;
      entry.baseY = firstY + idx * step;
      entry.container.setPosition(entry.baseX, entry.baseY);
    });

    this.layoutSpellingUI(tinyLandscapePhone, ultraTinyLandscapePhone, {});
  }

  layoutSpellingUI(tinyLandscapePhone = false, ultraTinyLandscapePhone = false, customLayout = {}) {
    const compact = this.isMobileLayout;
    const baseX = Number.isFinite(customLayout.baseX) ? customLayout.baseX : compact ? this.panel.width * 0.17 : 0;
    const clueY = Number.isFinite(customLayout.clueY)
      ? customLayout.clueY
      : compact
      ? ultraTinyLandscapePhone
        ? -this.panel.height * 0.02
        : -this.panel.height * 0.04
      : this.panel.height * 0.15;
    this.spellingClueText.setPosition(baseX, clueY);
    this.spellingClueText.setFontSize(compact ? (tinyLandscapePhone ? 24 : 30) : 34);
    this.spellingClueText.setVisible(this.questionMode === "spelling");

    const slotY = Number.isFinite(customLayout.slotY) ? customLayout.slotY : clueY + (compact ? 54 : 60);
    const gap = compact ? 42 : 58;
    const startX = baseX - ((this.spellingSlots.length - 1) * gap) / 2;
    this.spellingSlots.forEach((slot, idx) => {
      slot.container.setPosition(startX + idx * gap, slotY);
      const boxW = compact ? 38 : 54;
      const boxH = compact ? 46 : 64;
      slot.box.setSize(boxW, boxH);
      slot.txt.setFontSize(compact ? 28 : 36);
      slot.container.setVisible(false);
    });

    const cols = compact ? (this.spellingTiles.length > 8 ? 5 : 4) : this.spellingTiles.length > 8 ? 5 : 4;
    const tileGapX = compact ? (cols === 5 ? 56 : 66) : cols === 5 ? 68 : 86;
    const tileGapY = compact ? 46 : 64;
    const tilesStartX = baseX - ((cols - 1) * tileGapX) / 2;
    let tilesStartY = Number.isFinite(customLayout.tilesStartY)
      ? customLayout.tilesStartY
      : slotY + (compact ? 72 : 82);
    this.spellingTiles.forEach((tile, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      tile.container.setPosition(tilesStartX + col * tileGapX, tilesStartY + row * tileGapY);
      tile.box.setSize(compact ? 56 : 66, compact ? 48 : 56);
      tile.txt.setFontSize(compact ? 28 : 34);
    });

    const utilY = Number.isFinite(customLayout.utilY) ? customLayout.utilY : clueY + (compact ? 2 : 4);
    const isSpelling = this.questionMode === "spelling";
    if (isSpelling) {
      const controlsStartX = this.panel.width * 0.06;
      const controlGap = compact ? 86 : 96;
      const replayX = controlsStartX;
      const hintX = controlsStartX + controlGap;
      const backX = controlsStartX + controlGap * 2;

      this.replayButton.setPosition(replayX, utilY);
      this.replayLabel.setPosition(replayX, utilY);
      this.hintButton.setPosition(hintX, utilY);
      this.hintLabel.setPosition(hintX, utilY);
      this.backButton.setPosition(backX, utilY);
      this.backLabel.setPosition(backX, utilY);

      this.replayButton.setSize(compact ? 74 : 92, compact ? 28 : 34);
      this.hintButton.setSize(compact ? 74 : 92, compact ? 28 : 34);
      this.backButton.setSize(compact ? 74 : 92, compact ? 28 : 34);
      this.replayLabel.setFontSize(compact ? 13 : 15);
      this.hintLabel.setFontSize(compact ? 13 : 15);
      this.backLabel.setFontSize(compact ? 13 : 15);

      // Keep letter tiles above the controls row.
      const bottomControlsY = utilY;
      const rows = Math.max(1, Math.ceil(this.spellingTiles.length / cols));
      const gridHeight = (rows - 1) * tileGapY;
      const desiredBottomY = bottomControlsY - (compact ? 46 : 52);
      const currentBottomY = tilesStartY + gridHeight;
      if (currentBottomY > desiredBottomY) {
        tilesStartY -= currentBottomY - desiredBottomY;
        this.spellingTiles.forEach((tile, idx) => {
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          tile.container.setPosition(tilesStartX + col * tileGapX, tilesStartY + row * tileGapY);
        });
      }
      return;
    }

    this.hintButton.setPosition(baseX - 84, utilY);
    this.hintLabel.setPosition(baseX - 84, utilY);
    this.backButton.setPosition(baseX + 84, utilY);
    this.backLabel.setPosition(baseX + 84, utilY);
    this.hintButton.setSize(compact ? 90 : 110, compact ? 34 : 42);
    this.backButton.setSize(compact ? 90 : 110, compact ? 34 : 42);
    this.hintLabel.setFontSize(compact ? 16 : 20);
    this.backLabel.setFontSize(compact ? 16 : 20);
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
