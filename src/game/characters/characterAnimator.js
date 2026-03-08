import Phaser from "phaser";
import { applyQuestionAction } from "./questionActionSystem";

function addBlink(scene, eyes) {
  if (!eyes || eyes.length === 0) return;

  const blinkLoop = () => {
    eyes.forEach((eye) => {
      scene.tweens.add({
        targets: eye,
        scaleY: 0.1,
        yoyo: true,
        duration: 60,
      });
    });

    scene.time.delayedCall(Phaser.Math.Between(1800, 3200), blinkLoop);
  };

  scene.time.delayedCall(Phaser.Math.Between(1200, 2400), blinkLoop);
}

function addVerbBadge(scene, container, label) {
  if (container?.__hideBadge) return;
  const badgeBg = scene.add
    .rectangle(0, 0, 86, 26, 0xffb74d, 0.95)
    .setStrokeStyle(2, 0x6d3d00, 1);
  const badgeText = scene.add
    .text(0, 0, label, {
      fontSize: "14px",
      color: "#1f2a38",
      fontStyle: "bold",
    })
    .setOrigin(0.5);
  const badge = scene.add.container(0, -96, [badgeBg, badgeText]);
  container.add(badge);

  scene.tweens.add({
    targets: badge,
    y: badge.y - 5,
    yoyo: true,
    repeat: -1,
    duration: 420,
    ease: "Sine.InOut",
  });
}

export function animateRunner(scene, rig) {
  const { container, parts } = rig;
  parts.torso.setAngle(-6);
  parts.head.setAngle(2);

  scene.tweens.add({
    targets: container,
    y: container.y - 2,
    yoyo: true,
    repeat: -1,
    duration: 110,
    ease: "Sine.InOut",
  });

  scene.tweens.add({
    targets: parts.torso,
    angle: { from: -10, to: -2 },
    yoyo: true,
    repeat: -1,
    duration: 150,
    ease: "Sine.InOut",
  });

  scene.tweens.add({
    targets: [parts.legL, parts.armR],
    angle: { from: -20, to: 30 },
    yoyo: true,
    repeat: -1,
    duration: 130,
    ease: "Sine.InOut",
  });

  scene.tweens.add({
    targets: [parts.legR, parts.armL],
    angle: { from: 30, to: -20 },
    yoyo: true,
    repeat: -1,
    duration: 130,
    ease: "Sine.InOut",
  });

  scene.tweens.add({
    targets: parts.head,
    angle: { from: 0, to: 7 },
    yoyo: true,
    repeat: -1,
    duration: 180,
    ease: "Sine.InOut",
  });

  addBlink(scene, parts.eyes);
}

export function updateRunnerJumpPose(rig, isGrounded) {
  if (isGrounded) {
    rig.container.scaleY = 1;
    rig.container.scaleX = 1;
    return;
  }

  rig.container.scaleY = 1.12;
  rig.container.scaleX = 0.92;
}

export function animateQuestionCharacter(scene, rig, verb, category = "verbs") {
  const { container, parts } = rig;

  addBlink(scene, parts.eyes);

  if (applyQuestionAction(scene, rig, verb, category)) {
    return;
  }

  if (verb === "running") {
    addVerbBadge(scene, container, "RUN");
    scene.tweens.add({
      targets: [parts.legL, parts.armR],
      angle: { from: -24, to: 30 },
      yoyo: true,
      repeat: -1,
      duration: 130,
      ease: "Sine.InOut",
    });

    scene.tweens.add({
      targets: [parts.legR, parts.armL],
      angle: { from: 30, to: -24 },
      yoyo: true,
      repeat: -1,
      duration: 130,
      ease: "Sine.InOut",
    });

    scene.tweens.add({
      targets: container,
      x: container.x + 24,
      yoyo: true,
      repeat: -1,
      duration: 200,
      ease: "Sine.InOut",
    });

    const speed1 = scene.add.rectangle(-96, 40, 34, 4, 0xffffff, 0.8);
    const speed2 = scene.add.rectangle(-112, 54, 26, 3, 0xffffff, 0.65);
    const speed3 = scene.add.rectangle(-90, 26, 20, 3, 0xffffff, 0.58);
    container.add([speed1, speed2, speed3]);

    scene.tweens.add({
      targets: [speed1, speed2, speed3],
      x: { from: -116, to: -66 },
      alpha: { from: 0.1, to: 0.9 },
      yoyo: true,
      repeat: -1,
      duration: 170,
      stagger: 40,
    });
  }

  if (verb === "sleeping") {
    addVerbBadge(scene, container, "SLEEP");
    const isHuman = Boolean(parts.torso);
    const bed = scene.add.ellipse(0, 68, 150, 34, 0xb0bec5, 0.9).setStrokeStyle(2, 0x607d8b, 0.9);
    const pillow = scene.add.ellipse(-52, 52, 42, 20, 0xffffff, 0.95).setStrokeStyle(1, 0xcfd8dc);
    container.addAt([bed, pillow], 0);

    if (isHuman) {
      container.angle = 90;
      container.y += 24;
    } else {
      // Animals stay horizontal with only a gentle tilt.
      container.angle = -8;
      container.y += 12;
    }

    const sleepText = scene.add
      .text(84, -106, "z z", {
        fontSize: "40px",
        color: "#ffffff",
        stroke: "#17304a",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    container.add(sleepText);

    scene.tweens.add({
      targets: sleepText,
      y: sleepText.y - 42,
      alpha: 0,
      scale: 1.2,
      yoyo: false,
      duration: 900,
      repeat: -1,
    });
  }

  if (verb === "jumping") {
    addVerbBadge(scene, container, "JUMP");
    scene.tweens.add({
      targets: container,
      y: { from: container.y + 8, to: container.y - 54 },
      yoyo: true,
      repeat: -1,
      duration: 320,
      ease: "Quad.Out",
    });

    scene.tweens.add({
      targets: [parts.legL, parts.legR],
      angle: { from: 0, to: -44 },
      yoyo: true,
      repeat: -1,
      duration: 320,
      ease: "Sine.InOut",
    });
  }

  if (verb === "walking") {
    addVerbBadge(scene, container, "WALK");
    scene.tweens.add({
      targets: [parts.legL, parts.armR],
      angle: { from: -14, to: 14 },
      yoyo: true,
      repeat: -1,
      duration: 260,
      ease: "Sine.InOut",
    });
    scene.tweens.add({
      targets: [parts.legR, parts.armL],
      angle: { from: 14, to: -14 },
      yoyo: true,
      repeat: -1,
      duration: 260,
      ease: "Sine.InOut",
    });
    scene.tweens.add({
      targets: container,
      x: container.x + 14,
      yoyo: true,
      repeat: -1,
      duration: 520,
      ease: "Sine.InOut",
    });
  }

  if (verb === "climbing") {
    addVerbBadge(scene, container, "CLIMB");
    const ladderLeft = scene.add.rectangle(66, 30, 8, 130, 0x8d6e63);
    const ladderRight = scene.add.rectangle(104, 30, 8, 130, 0x8d6e63);
    const rungs = [];
    for (let i = 0; i < 5; i += 1) {
      rungs.push(scene.add.rectangle(85, 72 - i * 24, 42, 6, 0xbca38f));
    }
    container.add([ladderLeft, ladderRight, ...rungs]);

    scene.tweens.add({
      targets: container,
      y: container.y - 24,
      yoyo: true,
      repeat: -1,
      duration: 420,
      ease: "Sine.InOut",
    });
    scene.tweens.add({
      targets: [parts.legL, parts.armR],
      angle: { from: -30, to: 30 },
      yoyo: true,
      repeat: -1,
      duration: 190,
    });
    scene.tweens.add({
      targets: [parts.legR, parts.armL],
      angle: { from: 30, to: -30 },
      yoyo: true,
      repeat: -1,
      duration: 190,
    });
  }

  if (verb === "flying") {
    addVerbBadge(scene, container, "FLY");
    const cape = scene.add.triangle(-40, 28, 0, 0, 56, 16, 16, 58, 0xef5350, 0.92);
    const wind1 = scene.add.rectangle(-108, -6, 46, 4, 0xffffff, 0.82);
    const wind2 = scene.add.rectangle(-124, 10, 30, 3, 0xffffff, 0.72);
    const wind3 = scene.add.rectangle(-98, -20, 34, 3, 0xffffff, 0.72);
    const cloud1 = scene.add.ellipse(-86, 70, 34, 12, 0xe3f2fd, 0.8);
    const cloud2 = scene.add.ellipse(-64, 74, 26, 9, 0xe3f2fd, 0.65);
    container.addAt(cape, 0);
    container.add([wind1, wind2, wind3, cloud1, cloud2]);
    container.angle = -10;

    scene.tweens.add({
      targets: container,
      y: container.y - 52,
      yoyo: true,
      repeat: -1,
      duration: 340,
      ease: "Sine.InOut",
    });
    scene.tweens.add({
      targets: container,
      x: container.x + 34,
      yoyo: true,
      repeat: -1,
      duration: 380,
      ease: "Sine.InOut",
    });
    scene.tweens.add({
      targets: [wind1, wind2, wind3],
      x: { from: -132, to: -70 },
      alpha: { from: 0.1, to: 0.9 },
      yoyo: true,
      repeat: -1,
      duration: 170,
      stagger: 55,
    });
    scene.tweens.add({
      targets: cape,
      angle: { from: -20, to: 18 },
      yoyo: true,
      repeat: -1,
      duration: 150,
      ease: "Sine.InOut",
    });
    scene.tweens.add({
      targets: [cloud1, cloud2],
      x: { from: -94, to: -44 },
      alpha: { from: 0.15, to: 0.75 },
      yoyo: true,
      repeat: -1,
      duration: 260,
      stagger: 70,
    });
  }

  if (verb === "throwing") {
    addVerbBadge(scene, container, "THROW");
    const ball = scene.add.circle(12, 16, 7, 0xff7043).setStrokeStyle(2, 0x8d2b1f);
    container.add(ball);

    if (parts.armR) {
      scene.tweens.add({
        targets: parts.armR,
        angle: { from: -18, to: -128 },
        yoyo: true,
        repeat: -1,
        duration: 250,
        ease: "Sine.InOut",
      });
    }

    scene.tweens.add({
      targets: parts.armL,
      angle: { from: 6, to: 26 },
      yoyo: true,
      repeat: -1,
      duration: 250,
      ease: "Sine.InOut",
    });

    scene.tweens.add({
      targets: ball,
      x: { from: 10, to: 122 },
      y: { from: 20, to: -28 },
      alpha: { from: 1, to: 0.25 },
      yoyo: true,
      repeat: -1,
      duration: 330,
      ease: "Quad.Out",
      delay: 120,
    });
  }

  if (verb === "hiding") {
    addVerbBadge(scene, container, "HIDE");
    const bushBack = scene.add.ellipse(0, 48, 172, 68, 0x388e3c, 0.95);
    const bushFront = scene.add.ellipse(0, 56, 182, 52, 0x43a047, 0.95);
    const leaf1 = scene.add.circle(-52, 38, 14, 0x66bb6a);
    const leaf2 = scene.add.circle(44, 34, 12, 0x66bb6a);
    const leaf3 = scene.add.circle(-4, 28, 10, 0x66bb6a);
    container.addAt([bushBack, bushFront, leaf1, leaf2, leaf3], 0);

    const peekY = parts.head?.y ?? -8;
    if (parts.head) {
      scene.tweens.add({
        targets: parts.head,
        y: { from: peekY + 42, to: peekY + 12 },
        yoyo: true,
        repeat: -1,
        duration: 520,
        ease: "Sine.InOut",
      });
    }

    if (parts.eyes && parts.eyes.length > 0) {
      scene.tweens.add({
        targets: parts.eyes,
        alpha: { from: 0.2, to: 1 },
        yoyo: true,
        repeat: -1,
        duration: 300,
      });
    }
  }

  if (verb === "kicking") {
    addVerbBadge(scene, container, "KICK");
    const ball = scene.add.circle(18, 84, 8, 0xffca28).setStrokeStyle(2, 0x8d6e00);
    container.add(ball);

    scene.tweens.add({
      targets: parts.legR,
      angle: { from: 8, to: -78 },
      yoyo: true,
      repeat: -1,
      duration: 220,
      ease: "Sine.InOut",
    });

    scene.tweens.add({
      targets: ball,
      x: { from: 18, to: 132 },
      y: { from: 84, to: 70 },
      alpha: { from: 1, to: 0.2 },
      yoyo: true,
      repeat: -1,
      duration: 260,
      ease: "Quad.Out",
      delay: 60,
    });
  }

  if (verb === "catching") {
    addVerbBadge(scene, container, "CATCH");
    const ball = scene.add.circle(106, 8, 8, 0xff7043).setStrokeStyle(2, 0x8d2b1f);
    const ring = scene.add.circle(0, 10, 18, 0xffffff, 0.01).setStrokeStyle(2, 0xfff59d, 0.8);
    container.add([ball, ring]);

    scene.tweens.add({
      targets: [parts.armL, parts.armR],
      angle: { from: -26, to: 26 },
      yoyo: true,
      repeat: -1,
      duration: 220,
    });

    scene.tweens.add({
      targets: ball,
      x: { from: 106, to: 0 },
      y: { from: 8, to: 18 },
      yoyo: true,
      repeat: -1,
      duration: 320,
      ease: "Sine.InOut",
    });

    scene.tweens.add({
      targets: ring,
      scale: { from: 0.6, to: 1.2 },
      alpha: { from: 0.9, to: 0.2 },
      yoyo: true,
      repeat: -1,
      duration: 320,
    });
  }

  if (verb === "crying") {
    addVerbBadge(scene, container, "CRY");
    const tearL = scene.add.ellipse(-10, -34, 5, 9, 0x4fc3f7);
    const tearR = scene.add.ellipse(10, -34, 5, 9, 0x4fc3f7);
    const sob = scene.add
      .text(92, -30, "Boo...", {
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#17324b",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    container.add([tearL, tearR, sob]);

    scene.tweens.add({
      targets: [tearL, tearR],
      y: { from: -34, to: -6 },
      alpha: { from: 0.95, to: 0.15 },
      yoyo: true,
      repeat: -1,
      duration: 280,
      ease: "Sine.InOut",
    });
    scene.tweens.add({
      targets: container,
      x: container.x + 4,
      yoyo: true,
      repeat: -1,
      duration: 110,
    });
  }

  if (verb === "smiling") {
    addVerbBadge(scene, container, "SMILE");
    const smilePop = scene.add
      .text(96, -28, ":)", {
        fontSize: "32px",
        color: "#fff176",
        fontStyle: "bold",
        stroke: "#17324b",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    container.add(smilePop);
    scene.tweens.add({
      targets: container,
      y: container.y - 10,
      yoyo: true,
      repeat: -1,
      duration: 300,
      ease: "Sine.InOut",
    });
    scene.tweens.add({
      targets: smilePop,
      y: smilePop.y - 16,
      alpha: 0.25,
      yoyo: true,
      repeat: -1,
      duration: 360,
    });
  }

  if (verb === "waving") {
    addVerbBadge(scene, container, "WAVE");
    if (parts.armR) {
      parts.armR.setOrigin(0.5, 0.9);
      scene.tweens.add({
        targets: parts.armR,
        angle: { from: -20, to: -130 },
        yoyo: true,
        repeat: -1,
        duration: 170,
      });
    }
    const waveText = scene.add
      .text(98, -34, "Hi!", {
        fontSize: "26px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#17324b",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    container.add(waveText);
    scene.tweens.add({
      targets: waveText,
      x: waveText.x + 10,
      alpha: 0.2,
      yoyo: true,
      repeat: -1,
      duration: 240,
    });
  }

  if (verb === "talking") {
    addVerbBadge(scene, container, "TALK");
    const bubble = scene.add.ellipse(96, -26, 72, 40, 0xffffff, 0.95).setStrokeStyle(2, 0x17324b);
    const dots = scene.add.text(96, -26, "...", {
      fontSize: "26px",
      color: "#17324b",
      fontStyle: "bold",
    }).setOrigin(0.5);
    container.add([bubble, dots]);
    scene.tweens.add({
      targets: [bubble, dots],
      scale: { from: 0.9, to: 1.05 },
      alpha: { from: 0.8, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 220,
    });
  }

  if (verb === "looking") {
    addVerbBadge(scene, container, "LOOK");
    const eye = parts.eyes?.[0];
    const eyeX = eye ? eye.x + 2 : 10;
    const eyeY = eye ? eye.y : -26;
    const lens = scene.add.circle(eyeX, eyeY, 14, 0xffffff, 0.08).setStrokeStyle(4, 0xfff59d, 0.95);
    const handle = scene.add.rectangle(eyeX + 10, eyeY + 13, 6, 22, 0xfff59d).setAngle(-36);
    const glint = scene.add.circle(eyeX - 4, eyeY - 4, 4, 0xffffff, 0.9);
    container.add([lens, handle, glint]);

    if (eye) {
      eye.setVisible(false);
    }

    scene.tweens.add({
      targets: [lens, handle, glint],
      x: { from: eyeX - 6, to: eyeX + 8 },
      yoyo: true,
      repeat: -1,
      duration: 380,
      ease: "Sine.InOut",
    });
  }

  if (verb === "sliding") {
    addVerbBadge(scene, container, "SLIDE");
    const trail = scene.add.rectangle(-58, 90, 86, 8, 0xb3e5fc, 0.75);
    container.add(trail);
    scene.tweens.add({
      targets: container,
      x: container.x + 36,
      y: container.y + 8,
      yoyo: true,
      repeat: -1,
      duration: 300,
      ease: "Sine.InOut",
    });
    scene.tweens.add({
      targets: [parts.legL, parts.legR],
      angle: { from: 0, to: -22 },
      yoyo: true,
      repeat: -1,
      duration: 300,
    });
  }

  if (verb === "drawing") {
    addVerbBadge(scene, container, "DRAW");
    const board = scene.add.rectangle(76, 20, 56, 70, 0xfff8e1).setStrokeStyle(2, 0x8d6e63);
    const line1 = scene.add.line(0, 66, 0, 4, 18, 22, 0x1e88e5).setLineWidth(3, 3);
    const line2 = scene.add.line(0, 80, 18, 22, 34, 8, 0xef5350).setLineWidth(3, 3);
    const pencil = scene.add.rectangle(22, 20, 18, 4, 0xffca28).setAngle(-22);
    container.add([board, line1, line2, pencil]);
    scene.tweens.add({
      targets: pencil,
      x: { from: 20, to: 84 },
      y: { from: 12, to: 38 },
      yoyo: true,
      repeat: -1,
      duration: 340,
      ease: "Sine.InOut",
    });
  }

  if (verb === "washing") {
    addVerbBadge(scene, container, "WASH");
    const bucket = scene.add.ellipse(-96, 34, 46, 24, 0x42a5f5, 0.95).setStrokeStyle(2, 0x0d47a1);
    const water = scene.add.ellipse(-96, 30, 36, 12, 0xb3e5fc, 0.9);
    const soap1 = scene.add.circle(-84, -8, 8, 0xe1f5fe, 0.92);
    const soap2 = scene.add.circle(-98, -20, 11, 0xe1f5fe, 0.86);
    const soap3 = scene.add.circle(-112, -2, 6, 0xe1f5fe, 0.8);
    const splash = scene.add.rectangle(-86, 20, 44, 8, 0x4fc3f7, 0.7);
    container.add([bucket, water, soap1, soap2, soap3, splash]);

    if (parts.head) {
      scene.tweens.add({
        targets: parts.head,
        x: parts.head.x - 8,
        y: parts.head.y + 4,
        yoyo: true,
        repeat: -1,
        duration: 220,
        ease: "Sine.InOut",
      });
    }

    if (parts.legL) {
      scene.tweens.add({
        targets: parts.legL,
        x: { from: parts.legL.x, to: -58 },
        y: { from: parts.legL.y, to: 30 },
        yoyo: true,
        repeat: -1,
        duration: 210,
        ease: "Sine.InOut",
      });
    }
    if (parts.legR) {
      scene.tweens.add({
        targets: parts.legR,
        x: { from: parts.legR.x, to: -40 },
        y: { from: parts.legR.y, to: 34 },
        yoyo: true,
        repeat: -1,
        duration: 210,
        ease: "Sine.InOut",
        delay: 50,
      });
    }

    scene.tweens.add({
      targets: [soap1, soap2, soap3],
      y: "-=20",
      alpha: { from: 0.9, to: 0.2 },
      yoyo: true,
      repeat: -1,
      duration: 260,
      stagger: 60,
    });
    scene.tweens.add({
      targets: [parts.armL, parts.armR, splash],
      angle: { from: -14, to: 14 },
      yoyo: true,
      repeat: -1,
      duration: 170,
    });
  }

  if (verb === "brushing") {
    addVerbBadge(scene, container, "BRUSH");
    const brush = scene.add.rectangle(28, -22, 24, 7, 0xff7043).setStrokeStyle(2, 0x8d2b1f);
    const foam = scene.add.ellipse(6, -26, 22, 10, 0xffffff, 0.9);
    container.add([brush, foam]);
    scene.tweens.add({
      targets: brush,
      x: { from: 16, to: 36 },
      y: { from: -26, to: -18 },
      yoyo: true,
      repeat: -1,
      duration: 150,
    });
    scene.tweens.add({
      targets: foam,
      alpha: { from: 0.9, to: 0.3 },
      scale: { from: 0.9, to: 1.15 },
      yoyo: true,
      repeat: -1,
      duration: 200,
    });
  }

  if (verb === "dancing") {
    addVerbBadge(scene, container, "DANCE");
    scene.tweens.add({
      targets: container,
      angle: { from: -15, to: 15 },
      yoyo: true,
      repeat: -1,
      duration: 260,
      ease: "Sine.InOut",
    });

    if (parts.armL && parts.armR) {
      scene.tweens.add({
        targets: [parts.armL, parts.armR],
        angle: { from: -25, to: 25 },
        yoyo: true,
        repeat: -1,
        duration: 200,
      });
    }
  }

  if (verb === "eating") {
    addVerbBadge(scene, container, "EAT");
    const bowl = scene.add.ellipse(40, 64, 70, 24, 0x7b5e57);
    const bowlRim = scene.add.ellipse(40, 58, 62, 10, 0xbca89e);
    const kibble = scene.add.circle(32, 53, 5, 0xffd180);
    const chewText = scene.add
      .text(102, -16, "Nom!", {
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#17324b",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    container.add([bowl, bowlRim, kibble, chewText]);

    const armRBaseX = parts.armR?.x ?? 22;
    const armRBaseY = parts.armR?.y ?? 9;
    if (parts.armR) {
      scene.tweens.add({
        targets: parts.armR,
        x: { from: armRBaseX, to: -2 },
        y: { from: armRBaseY, to: -18 },
        angle: { from: 0, to: -46 },
        yoyo: true,
        repeat: -1,
        duration: 280,
        ease: "Sine.InOut",
      });
    }

    // Food moves bowl -> mouth with hand motion.
    scene.tweens.add({
      targets: kibble,
      x: { from: kibble.x, to: -2 },
      y: { from: kibble.y, to: -22 },
      alpha: 0.2,
      yoyo: true,
      repeat: -1,
      duration: 280,
      ease: "Sine.InOut",
    });

    scene.tweens.add({
      targets: chewText,
      y: chewText.y - 16,
      alpha: 0.2,
      yoyo: true,
      repeat: -1,
      duration: 340,
    });
  }

  if (verb === "barking") {
    addVerbBadge(scene, container, "BARK");
    const barkText = scene.add
      .text(108, -38, "WOOF!", {
        fontSize: "28px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#17324b",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    const barkWave1 = scene.add.arc(-30, -4, 14, 300, 60, false, 0xffffff).setStrokeStyle(3, 0xffffff, 0.9);
    const barkWave2 = scene.add.arc(-16, -4, 20, 300, 60, false, 0xffffff).setStrokeStyle(3, 0xffffff, 0.75);
    const mouth = scene.add.ellipse(-60, 0, 12, 7, 0x4e342e);
    container.add([barkWave2, barkWave1, mouth, barkText]);

    scene.tweens.add({
      targets: parts.head,
      x: parts.head.x - 8,
      yoyo: true,
      repeat: -1,
      duration: 150,
      ease: "Sine.InOut",
    });

    scene.tweens.add({
      targets: barkText,
      x: barkText.x + 22,
      y: barkText.y - 16,
      alpha: 0.08,
      scale: 1.16,
      yoyo: true,
      repeat: -1,
      duration: 280,
    });

    scene.tweens.add({
      targets: [barkWave1, barkWave2],
      scaleX: { from: 0.8, to: 1.5 },
      scaleY: { from: 0.8, to: 1.5 },
      alpha: { from: 0.9, to: 0.15 },
      yoyo: true,
      repeat: -1,
      duration: 200,
    });

    scene.tweens.add({
      targets: mouth,
      scaleX: { from: 1, to: 2.1 },
      scaleY: { from: 1, to: 1.75 },
      yoyo: true,
      repeat: -1,
      duration: 140,
    });

    const barkPop = scene.time.addEvent({
      delay: 320,
      loop: true,
      callback: () => {
        if (!container.active) {
          barkPop.remove(false);
          return;
        }
        const pop = scene.add
          .text(container.x + 120, container.y - 28, "woof", {
            fontSize: "18px",
            color: "#ffffff",
            fontStyle: "bold",
            stroke: "#17324b",
            strokeThickness: 3,
          })
          .setOrigin(0.5)
          .setDepth(container.depth + 1);
        scene.tweens.add({
          targets: pop,
          x: pop.x + Phaser.Math.Between(12, 26),
          y: pop.y - Phaser.Math.Between(8, 18),
          alpha: 0,
          scale: 1.2,
          duration: 340,
          onComplete: () => pop.destroy(),
        });
      },
    });
  }

  if (verb === "reading") {
    addVerbBadge(scene, container, "READ");
    const bookLeft = scene.add.rectangle(56, 24, 34, 42, 0x1e88e5).setStrokeStyle(2, 0xffffff);
    const bookRight = scene.add.rectangle(92, 24, 34, 42, 0x1976d2).setStrokeStyle(2, 0xffffff);
    const bookFold = scene.add.rectangle(74, 24, 4, 40, 0xffffff, 0.85);
    const pageLinesL = scene.add.rectangle(56, 24, 22, 24, 0xe3f2fd, 0.9);
    const pageLinesR = scene.add.rectangle(92, 24, 22, 24, 0xe3f2fd, 0.9);
    const readText = scene.add
      .text(96, -30, "Read", {
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#17324b",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    container.add([bookLeft, bookRight, pageLinesL, pageLinesR, bookFold, readText]);

    if (parts.armL && parts.armR) {
      parts.armL.x = 30;
      parts.armL.y = 20;
      parts.armL.angle = 52;
      parts.armR.x = 52;
      parts.armR.y = 22;
      parts.armR.angle = -14;
    }

    if (parts.head) {
      parts.head.y += 6;
      parts.head.x -= 5;
    }

    scene.tweens.add({
      targets: [bookLeft, bookRight, pageLinesL, pageLinesR, bookFold],
      y: 20,
      yoyo: true,
      repeat: -1,
      duration: 320,
      ease: "Sine.InOut",
    });

    scene.tweens.add({
      targets: bookRight,
      scaleX: { from: 1, to: 0.88 },
      yoyo: true,
      repeat: -1,
      duration: 260,
      ease: "Sine.InOut",
    });

    scene.tweens.add({
      targets: readText,
      y: readText.y - 14,
      alpha: 0.2,
      yoyo: true,
      repeat: -1,
      duration: 360,
    });

    scene.tweens.add({
      targets: container,
      angle: { from: -3, to: 3 },
      yoyo: true,
      repeat: -1,
      duration: 450,
    });

    const sparkleEvent = scene.time.addEvent({
      delay: 380,
      loop: true,
      callback: () => {
        if (!container.active) {
          sparkleEvent.remove(false);
          return;
        }
        const star = scene.add.text(container.x + 94, container.y - 20, "*", {
          fontSize: "18px",
          color: "#fff59d",
          stroke: "#17324b",
          strokeThickness: 2,
        });
        scene.tweens.add({
          targets: star,
          y: star.y - 16,
          x: star.x + Phaser.Math.Between(6, 12),
          alpha: 0,
          scale: 1.3,
          duration: 320,
          onComplete: () => star.destroy(),
        });
      },
    });
  }

  if (verb === "digging") {
    addVerbBadge(scene, container, "DIG");
    const hole = scene.add.ellipse(44, 70, 64, 20, 0x3e2723, 0.95);
    const dirtPile = scene.add.ellipse(80, 66, 50, 16, 0x8d6e63, 0.98);
    const digText = scene.add
      .text(112, -24, "Dig!", {
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#17324b",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    container.add([hole, dirtPile, digText]);

    container.angle = -8;

    if (parts.legL && parts.legR) {
      scene.tweens.add({
        targets: [parts.legL, parts.legR],
        angle: { from: -34, to: 28 },
        yoyo: true,
        repeat: -1,
        duration: 120,
      });
    }

    scene.tweens.add({
      targets: parts.head,
      x: parts.head.x - 16,
      y: parts.head.y + 10,
      yoyo: true,
      repeat: -1,
      duration: 170,
    });

    scene.tweens.add({
      targets: dirtPile,
      scaleX: { from: 1, to: 1.18 },
      yoyo: true,
      repeat: -1,
      duration: 220,
    });

    scene.tweens.add({
      targets: digText,
      y: digText.y - 14,
      alpha: 0.25,
      yoyo: true,
      repeat: -1,
      duration: 280,
    });

    const dirtBurst = () => {
      for (let i = 0; i < 5; i += 1) {
        const dirt = scene.add.circle(
          container.x + 62 + Phaser.Math.Between(-8, 8),
          container.y + 60 + Phaser.Math.Between(-6, 6),
          Phaser.Math.Between(2, 4),
          0x8d6e63
        );
        scene.tweens.add({
          targets: dirt,
          x: dirt.x + Phaser.Math.Between(18, 38),
          y: dirt.y - Phaser.Math.Between(8, 18),
          alpha: 0,
          duration: 280,
          onComplete: () => dirt.destroy(),
        });
      }
    };

    const digEvent = scene.time.addEvent({
      delay: 280,
      loop: true,
      callback: () => {
        if (!container.active) {
          digEvent.remove(false);
          return;
        }
        dirtBurst();
      },
    });
  }

  if (verb === "laughing") {
    addVerbBadge(scene, container, "LAUGH");
    const laughMouth = scene.add.ellipse(0, -16, 18, 8, 0x3e2723);
    const laughText = scene.add
      .text(90, -40, "Ha!", {
        fontSize: "30px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#17324b",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    container.add([laughMouth, laughText]);

    scene.tweens.add({
      targets: container,
      x: container.x + 6,
      yoyo: true,
      repeat: -1,
      duration: 90,
    });

    scene.tweens.add({
      targets: laughText,
      y: laughText.y - 18,
      alpha: 0.2,
      yoyo: true,
      repeat: -1,
      duration: 320,
    });
    scene.tweens.add({
      targets: laughMouth,
      scaleY: { from: 0.8, to: 2.1 },
      scaleX: { from: 1, to: 1.2 },
      yoyo: true,
      repeat: -1,
      duration: 140,
    });
  }
}
