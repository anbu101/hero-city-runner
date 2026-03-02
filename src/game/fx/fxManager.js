export class FxManager {
  constructor(scene) {
    this.scene = scene;
  }

  celebrateAt(x, y) {
    const burst = this.scene.add.particles(x, y, "spark", {
      speed: { min: 80, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 550,
      quantity: 28,
      tint: [0xfff176, 0xffd54f, 0xff8a65, 0x81d4fa],
    });

    this.scene.time.delayedCall(600, () => burst.destroy());
  }

  floatPraise(x, y, text = "Great!") {
    const praise = this.scene.add
      .text(x, y, text, {
        fontSize: "38px",
        fontStyle: "bold",
        color: "#fff8b2",
        stroke: "#7a5000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(40);

    this.scene.tweens.add({
      targets: praise,
      y: y - 70,
      alpha: 0,
      scale: 1.15,
      duration: 700,
      ease: "Cubic.Out",
      onComplete: () => praise.destroy(),
    });
  }

  coinMilestone(count) {
    const cx = this.scene.scale.width / 2;
    const cy = 130;

    this.celebrateAt(cx, cy);
    this.celebrateAt(cx - 80, cy + 30);
    this.celebrateAt(cx + 80, cy + 30);

    const flash = this.scene.add.rectangle(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      this.scene.scale.width,
      this.scene.scale.height,
      0xffd54f,
      0.18
    );
    flash.setDepth(39);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 260,
      onComplete: () => flash.destroy(),
    });

    this.floatPraise(cx, cy, `Awesome! ${count} Coins!`);
  }

  pulseText(target) {
    this.scene.tweens.killTweensOf(target);
    target.setScale(1);
    this.scene.tweens.add({
      targets: target,
      scale: 1.18,
      yoyo: true,
      duration: 120,
      repeat: 1,
    });
  }

  wrongChoiceFeedback(target) {
    this.scene.tweens.add({
      targets: target,
      x: target.x + 10,
      yoyo: true,
      duration: 70,
      repeat: 3,
    });

    this.scene.cameras.main.shake(80, 0.0015);
  }
}
