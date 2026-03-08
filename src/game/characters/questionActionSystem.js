import Phaser from "phaser";

const VERB_PROFILES = {
  running: { template: "runClassic", badge: "RUN", pace: 120, speedLines: true, lean: -10 },
  walking: { template: "walkClassic", badge: "WALK", pace: 250, lean: -3 },
  climbing: { template: "climb", badge: "CLIMB" },
  throwing: { template: "throw", badge: "THROW" },
  catching: { template: "catch", badge: "CATCH" },
  kicking: { template: "kick", badge: "KICK" },
  crying: { template: "cry", badge: "CRY" },
  waving: { template: "wave", badge: "WAVE" },
  talking: { template: "talk", badge: "TALK" },
  looking: { template: "look", badge: "LOOK" },
  drawing: { template: "draw", badge: "DRAW" },
  washing: { template: "wash", badge: "WASH" },
  brushing: { template: "brush", badge: "BRUSH" },
};

const ADJECTIVE_PROFILES = {
  happy: { template: "happy", badge: "HAPPY" },
  sad: { template: "sad", badge: "SAD" },
  big: { template: "big", badge: "BIG" },
  small: { template: "small", badge: "SMALL" },
  tall: { template: "tall", badge: "TALL" },
  short: { template: "short", badge: "SHORT" },
  fast: { template: "fast", badge: "FAST" },
  slow: { template: "slow", badge: "SLOW" },
  hot: { template: "hot", badge: "HOT" },
  cold: { template: "cold", badge: "COLD" },
  wet: { template: "wet", badge: "WET" },
  dirty: { template: "dirty", badge: "DIRTY" },
  clean: { template: "clean", badge: "CLEAN" },
};

function addBadge(scene, container, label) {
  if (container?.__hideBadge) return;
  const badgeBg = scene.add
    .rectangle(0, 0, 96, 28, 0xffb74d, 0.95)
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

function basePose(part) {
  if (!part) {
    return { x: 0, y: 0, angle: 0, scaleX: 1, scaleY: 1 };
  }
  if (!part.__basePose) {
    part.__basePose = {
      x: part.x,
      y: part.y,
      angle: part.angle ?? 0,
      scaleX: part.scaleX ?? 1,
      scaleY: part.scaleY ?? 1,
    };
  }
  return part.__basePose;
}

function applyLoco(scene, rig, profile) {
  const { container, parts } = rig;
  const pace = profile.pace ?? 160;
  const distance = profile.distance ?? 18;
  const lean = profile.lean ?? 0;
  const bob = profile.bob ?? 2;

  if (parts.torso) {
    parts.torso.angle = lean;
  }
  if (parts.head) {
    parts.head.angle = Math.max(-8, Math.min(8, -lean * 0.5));
  }

  const legLBase = basePose(parts.legL);
  const legRBase = basePose(parts.legR);
  const armLBase = basePose(parts.armL);
  const armRBase = basePose(parts.armR);

  // Front/back feel using depth-style Y motion rather than side-swing angles.
  if (parts.legL) {
    scene.tweens.add({
      targets: parts.legL,
      y: { from: legLBase.y + 8, to: legLBase.y - 10 },
      scaleY: { from: 0.88, to: 1.08 },
      yoyo: true,
      repeat: -1,
      duration: pace,
      ease: "Sine.InOut",
    });
  }
  if (parts.legR) {
    scene.tweens.add({
      targets: parts.legR,
      y: { from: legRBase.y - 10, to: legRBase.y + 8 },
      scaleY: { from: 1.08, to: 0.88 },
      yoyo: true,
      repeat: -1,
      duration: pace,
      ease: "Sine.InOut",
    });
  }
  if (parts.armL) {
    scene.tweens.add({
      targets: parts.armL,
      y: { from: armLBase.y - 8, to: armLBase.y + 8 },
      scaleY: { from: 1.08, to: 0.9 },
      yoyo: true,
      repeat: -1,
      duration: pace,
      ease: "Sine.InOut",
    });
  }
  if (parts.armR) {
    scene.tweens.add({
      targets: parts.armR,
      y: { from: armRBase.y + 8, to: armRBase.y - 8 },
      scaleY: { from: 0.9, to: 1.08 },
      yoyo: true,
      repeat: -1,
      duration: pace,
      ease: "Sine.InOut",
    });
  }
  if (distance > 0) {
    scene.tweens.add({
      targets: container,
      x: container.x + distance,
      yoyo: true,
      repeat: -1,
      duration: Math.max(180, pace + 80),
      ease: "Sine.InOut",
    });
  }
  if (bob > 0) {
    scene.tweens.add({
      targets: container,
      y: container.y - bob,
      yoyo: true,
      repeat: -1,
      duration: Math.max(120, pace),
      ease: "Sine.InOut",
    });
  }

  if (profile.speedLines) {
    const lineA = scene.add.rectangle(-96, 38, 34, 4, 0xffffff, 0.8);
    const lineB = scene.add.rectangle(-112, 50, 24, 3, 0xffffff, 0.65);
    const lineC = scene.add.rectangle(-88, 24, 20, 3, 0xffffff, 0.58);
    container.add([lineA, lineB, lineC]);
    scene.tweens.add({
      targets: [lineA, lineB, lineC],
      x: { from: -120, to: -64 },
      alpha: { from: 0.08, to: 0.9 },
      yoyo: true,
      repeat: -1,
      duration: 170,
      stagger: 40,
    });
  }
}

function applyRunClassic(scene, rig, profile) {
  const { container, parts } = rig;
  const pace = profile.pace ?? 120;

  if (parts.torso) {
    parts.torso.angle = profile.lean ?? -8;
  }
  if (parts.head) {
    parts.head.angle = 3;
  }

  if (parts.legL && parts.armR) {
    scene.tweens.add({
      targets: [parts.legL, parts.armR],
      angle: { from: -24, to: 30 },
      yoyo: true,
      repeat: -1,
      duration: pace,
      ease: "Sine.InOut",
    });
  }

  if (parts.legR && parts.armL) {
    scene.tweens.add({
      targets: [parts.legR, parts.armL],
      angle: { from: 30, to: -24 },
      yoyo: true,
      repeat: -1,
      duration: pace,
      ease: "Sine.InOut",
    });
  }

  if (profile.speedLines) {
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
}

function applyWalkClassic(scene, rig, profile) {
  const { parts } = rig;
  const pace = profile.pace ?? 250;
  if (parts.torso) parts.torso.angle = profile.lean ?? -2;
  if (parts.head) parts.head.angle = 1;

  if (parts.legL && parts.armR) {
    scene.tweens.add({
      targets: [parts.legL, parts.armR],
      angle: { from: -12, to: 16 },
      yoyo: true,
      repeat: -1,
      duration: pace,
      ease: "Sine.InOut",
    });
  }
  if (parts.legR && parts.armL) {
    scene.tweens.add({
      targets: [parts.legR, parts.armL],
      angle: { from: 16, to: -12 },
      yoyo: true,
      repeat: -1,
      duration: pace,
      ease: "Sine.InOut",
    });
  }
}

function applyFly(scene, rig) {
  const { container, parts } = rig;
  const cape = scene.add.triangle(-42, 28, 0, 0, 56, 16, 16, 58, 0xef5350, 0.92);
  const trailA = scene.add.star(-118, 20, 4, 3, 7, 0xffeb3b, 0.9);
  const trailB = scene.add.star(-132, 34, 4, 3, 7, 0xfff59d, 0.78);
  const wind1 = scene.add.rectangle(-108, -6, 46, 4, 0xffffff, 0.82);
  const wind2 = scene.add.rectangle(-124, 10, 30, 3, 0xffffff, 0.72);
  const wind3 = scene.add.rectangle(-98, -20, 34, 3, 0xffffff, 0.72);
  const cloud1 = scene.add.ellipse(-86, 70, 34, 12, 0xe3f2fd, 0.8);
  const cloud2 = scene.add.ellipse(-64, 74, 26, 9, 0xe3f2fd, 0.65);
  container.addAt(cape, 0);
  container.add([trailA, trailB, wind1, wind2, wind3, cloud1, cloud2]);
  container.angle = -84;

  if (parts.armL) parts.armL.angle = -90;
  if (parts.armR) parts.armR.angle = -90;
  if (parts.legL) parts.legL.angle = -12;
  if (parts.legR) parts.legR.angle = -4;

  scene.tweens.add({
    targets: container,
    y: container.y - 54,
    yoyo: true,
    repeat: -1,
    duration: 340,
    ease: "Sine.InOut",
  });
  scene.tweens.add({
    targets: container,
    x: container.x + 52,
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
    targets: [trailA, trailB],
    angle: 360,
    alpha: { from: 0.2, to: 0.95 },
    yoyo: true,
    repeat: -1,
    duration: 320,
    stagger: 60,
  });
  scene.tweens.add({
    targets: cape,
    angle: { from: -20, to: 18 },
    yoyo: true,
    repeat: -1,
    duration: 150,
    ease: "Sine.InOut",
  });
}

function applyLook(scene, rig) {
  const { container, parts } = rig;
  const eye = parts.eyes?.[0];
  const eyeX = eye ? eye.x + 2 : 10;
  const eyeY = eye ? eye.y : -26;
  const lens = scene.add.circle(eyeX, eyeY, 14, 0xffffff, 0.08).setStrokeStyle(4, 0xfff59d, 0.95);
  const handle = scene.add.rectangle(eyeX + 10, eyeY + 13, 6, 22, 0xfff59d).setAngle(-36);
  const glint = scene.add.circle(eyeX - 4, eyeY - 4, 4, 0xffffff, 0.9);
  container.add([lens, handle, glint]);
  if (eye) eye.setVisible(false);

  scene.tweens.add({
    targets: [lens, handle, glint],
    x: { from: eyeX - 6, to: eyeX + 8 },
    yoyo: true,
    repeat: -1,
    duration: 380,
    ease: "Sine.InOut",
  });
  const focusLine = scene.add.rectangle(eyeX + 28, eyeY, 22, 3, 0xfff59d, 0.7);
  container.add(focusLine);
  scene.tweens.add({
    targets: focusLine,
    width: { from: 14, to: 32 },
    alpha: { from: 0.2, to: 0.82 },
    yoyo: true,
    repeat: -1,
    duration: 260,
  });
}

function applyWash(scene, rig) {
  const { container, parts } = rig;
  const bucket = scene.add.ellipse(-100, 36, 46, 24, 0x42a5f5, 0.95).setStrokeStyle(2, 0x0d47a1);
  const water = scene.add.ellipse(-100, 32, 36, 12, 0xb3e5fc, 0.9);
  const soap1 = scene.add.circle(-8, -30, 8, 0xe1f5fe, 0.92);
  const soap2 = scene.add.circle(8, -36, 11, 0xe1f5fe, 0.86);
  const soap3 = scene.add.circle(-18, -20, 6, 0xe1f5fe, 0.8);
  const splash = scene.add.rectangle(-4, -12, 44, 8, 0x4fc3f7, 0.7);
  container.add([bucket, water, soap1, soap2, soap3, splash]);

  if (parts.head) {
    scene.tweens.add({
      targets: parts.head,
      x: parts.head.x - 5,
      y: parts.head.y + 6,
      yoyo: true,
      repeat: -1,
      duration: 220,
      ease: "Sine.InOut",
    });
  }
  const armLBase = basePose(parts.armL);
  const armRBase = basePose(parts.armR);
  if (parts.armL) {
    scene.tweens.add({
      targets: parts.armL,
      x: { from: armLBase.x, to: -14 },
      y: { from: armLBase.y, to: -16 },
      angle: { from: 0, to: -28 },
      yoyo: true,
      repeat: -1,
      duration: 180,
      ease: "Sine.InOut",
    });
  }
  if (parts.armR) {
    scene.tweens.add({
      targets: parts.armR,
      x: { from: armRBase.x, to: 14 },
      y: { from: armRBase.y, to: -10 },
      angle: { from: 0, to: 26 },
      yoyo: true,
      repeat: -1,
      duration: 180,
      ease: "Sine.InOut",
      delay: 50,
    });
  }
  scene.tweens.add({
    targets: [soap1, soap2, soap3],
    y: "-=12",
    alpha: { from: 0.9, to: 0.2 },
    yoyo: true,
    repeat: -1,
    duration: 220,
    stagger: 60,
  });
  scene.tweens.add({
    targets: splash,
    alpha: { from: 0.25, to: 0.8 },
    width: { from: 20, to: 48 },
    yoyo: true,
    repeat: -1,
    duration: 180,
  });
}

function applyThrow(scene, rig) {
  const { container, parts } = rig;
  const handBase = basePose(parts.armR);
  const ballStartX = (parts.armR ? handBase.x : 8) + 20;
  const ballStartY = (parts.armR ? handBase.y : 16) - 16;
  const ball = scene.add.circle(ballStartX, ballStartY, 7, 0xff7043).setStrokeStyle(2, 0x8d2b1f);
  const target = scene.add.rectangle(118, -22, 16, 16, 0xffffff, 0.12).setStrokeStyle(2, 0xffcc80, 0.7);
  container.add([target, ball]);
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
    targets: ball,
    x: { from: ballStartX, to: 122 },
    y: { from: ballStartY, to: -34 },
    alpha: { from: 1, to: 0.25 },
    yoyo: true,
    repeat: -1,
    duration: 330,
    ease: "Quad.Out",
    delay: 120,
  });
  scene.tweens.add({
    targets: target,
    alpha: { from: 0.15, to: 0.65 },
    scale: { from: 0.9, to: 1.12 },
    yoyo: true,
    repeat: -1,
    duration: 260,
  });
}

function applyCatch(scene, rig) {
  const { container, parts } = rig;
  const ball = scene.add.circle(116, 8, 8, 0xff7043).setStrokeStyle(2, 0x8d2b1f);
  const ring = scene.add.circle(0, 10, 18, 0xffffff, 0.01).setStrokeStyle(2, 0xfff59d, 0.8);
  const gloves = scene.add.rectangle(0, 10, 44, 20, 0xfff3e0, 0.25).setStrokeStyle(2, 0xfff59d, 0.6);
  container.add([gloves, ball, ring]);
  const armLBase = basePose(parts.armL);
  const armRBase = basePose(parts.armR);
  if (parts.armL) {
    scene.tweens.add({
      targets: parts.armL,
      x: { from: armLBase.x - 10, to: armLBase.x + 2 },
      y: { from: armLBase.y - 8, to: armLBase.y + 2 },
      angle: { from: -40, to: -4 },
      yoyo: true,
      repeat: -1,
      duration: 230,
    });
  }
  if (parts.armR) {
    scene.tweens.add({
      targets: parts.armR,
      x: { from: armRBase.x + 10, to: armRBase.x - 2 },
      y: { from: armRBase.y - 8, to: armRBase.y + 2 },
      angle: { from: 40, to: 4 },
      yoyo: true,
      repeat: -1,
      duration: 230,
    });
  }
  scene.tweens.add({
    targets: ball,
    x: { from: 116, to: 0 },
    y: { from: 8, to: 18 },
    yoyo: true,
    repeat: -1,
    duration: 320,
    ease: "Sine.InOut",
  });
  scene.tweens.add({
    targets: ring,
    scale: { from: 0.7, to: 1.25 },
    alpha: { from: 0.85, to: 0.2 },
    yoyo: true,
    repeat: -1,
    duration: 260,
  });
}

function applyKick(scene, rig) {
  const { container, parts } = rig;
  const ball = scene.add.circle(18, 84, 8, 0xffca28).setStrokeStyle(2, 0x8d6e00);
  const arc = scene.add.arc(72, 74, 28, 210, 330, false, 0xffe082).setStrokeStyle(2, 0xffe082, 0.8);
  container.add([ball, arc]);
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
  scene.tweens.add({
    targets: arc,
    alpha: { from: 0.85, to: 0.15 },
    scale: { from: 0.85, to: 1.2 },
    yoyo: true,
    repeat: -1,
    duration: 240,
  });
}

function applyClimb(scene, rig) {
  const { container, parts } = rig;
  const ladderLeft = scene.add.rectangle(30, 30, 8, 130, 0x8d6e63);
  const ladderRight = scene.add.rectangle(68, 30, 8, 130, 0x8d6e63);
  const rungs = [];
  for (let i = 0; i < 5; i += 1) {
    rungs.push(scene.add.rectangle(49, 72 - i * 24, 42, 6, 0xbca38f));
  }
  container.add([ladderLeft, ladderRight, ...rungs]);
  if (parts.armL) parts.armL.angle = -40;
  if (parts.armR) parts.armR.angle = 40;
  const legLBase = basePose(parts.legL);
  const legRBase = basePose(parts.legR);
  const armLBase = basePose(parts.armL);
  const armRBase = basePose(parts.armR);
  if (parts.legL) {
    scene.tweens.add({
      targets: parts.legL,
      y: { from: legLBase.y + 6, to: legLBase.y - 10 },
      yoyo: true,
      repeat: -1,
      duration: 190,
      ease: "Sine.InOut",
    });
  }
  if (parts.legR) {
    scene.tweens.add({
      targets: parts.legR,
      y: { from: legRBase.y - 10, to: legRBase.y + 6 },
      yoyo: true,
      repeat: -1,
      duration: 190,
      ease: "Sine.InOut",
    });
  }
  if (parts.armL) {
    scene.tweens.add({
      targets: parts.armL,
      y: { from: armLBase.y - 14, to: armLBase.y + 4 },
      yoyo: true,
      repeat: -1,
      duration: 190,
      ease: "Sine.InOut",
    });
  }
  if (parts.armR) {
    scene.tweens.add({
      targets: parts.armR,
      y: { from: armRBase.y + 4, to: armRBase.y - 14 },
      yoyo: true,
      repeat: -1,
      duration: 190,
      ease: "Sine.InOut",
    });
  }
}

function applyHide(scene, rig) {
  const { container, parts } = rig;
  const bushBack = scene.add.ellipse(0, 48, 172, 68, 0x388e3c, 0.95);
  const bushFront = scene.add.ellipse(0, 56, 182, 52, 0x43a047, 0.95);
  const shh = scene.add.text(70, -10, "shh", {
    fontSize: "20px",
    color: "#ffffff",
    fontStyle: "bold",
    stroke: "#17324b",
    strokeThickness: 3,
  }).setOrigin(0.5);
  container.addAt([bushBack, bushFront], 0);
  container.add(shh);
  if (parts.head) {
    const peekY = parts.head.y;
    scene.tweens.add({
      targets: parts.head,
      y: { from: peekY + 42, to: peekY + 12 },
      yoyo: true,
      repeat: -1,
      duration: 520,
      ease: "Sine.InOut",
    });
  }
  scene.tweens.add({
    targets: shh,
    y: shh.y - 14,
    alpha: 0.2,
    yoyo: true,
    repeat: -1,
    duration: 360,
  });
}

function applySimple(scene, rig, template) {
  const { container, parts } = rig;
  if (template === "wave" && parts.armR) {
    parts.armR.setOrigin(0.5, 0.9);
    scene.tweens.add({
      targets: parts.armR,
      angle: { from: -20, to: -130 },
      yoyo: true,
      repeat: -1,
      duration: 170,
    });
    return;
  }

  if (template === "talk") {
    const bubble = scene.add.ellipse(96, -26, 72, 40, 0xffffff, 0.95).setStrokeStyle(2, 0x17324b);
    const dots = scene.add.text(96, -26, "...", { fontSize: "26px", color: "#17324b", fontStyle: "bold" }).setOrigin(0.5);
    container.add([bubble, dots]);
    scene.tweens.add({
      targets: [bubble, dots],
      scale: { from: 0.9, to: 1.05 },
      alpha: { from: 0.8, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 220,
    });
    const mouth = scene.add.ellipse(0, -22, 16, 8, 0x3e2723);
    container.add(mouth);
    scene.tweens.add({
      targets: mouth,
      scaleY: { from: 0.6, to: 1.8 },
      yoyo: true,
      repeat: -1,
      duration: 150,
    });
    return;
  }

  if (template === "slide") {
    container.__groundAlignLift = 28;
    const torsoBase = basePose(parts.torso);
    const legLBase = basePose(parts.legL);
    const legRBase = basePose(parts.legR);
    if (parts.torso) parts.torso.y = torsoBase.y - 10;
    if (parts.legL) parts.legL.y = legLBase.y - 10;
    if (parts.legR) parts.legR.y = legRBase.y - 10;
    if (parts.torso) parts.torso.angle = 26;
    if (parts.legL) parts.legL.angle = -72;
    if (parts.legR) parts.legR.angle = -58;
    const skid = scene.add.rectangle(-62, 64, 94, 8, 0xb3e5fc, 0.75);
    skid.__ignoreGroundAlign = true;
    container.add(skid);
    scene.tweens.add({
      targets: container,
      x: container.x + 46,
      yoyo: true,
      repeat: -1,
      duration: 280,
      ease: "Sine.InOut",
    });
    scene.tweens.add({
      targets: skid,
      alpha: { from: 0.25, to: 0.8 },
      width: { from: 60, to: 102 },
      yoyo: true,
      repeat: -1,
      duration: 200,
    });
    return;
  }

  if (template === "draw") {
    const board = scene.add.rectangle(76, 20, 56, 70, 0xfff8e1).setStrokeStyle(2, 0x8d6e63);
    const pencil = scene.add.rectangle(22, 20, 18, 4, 0xffca28).setAngle(-22);
    const sketch = scene.add.graphics();
    sketch.setPosition(48, -14);
    sketch.lineStyle(2, 0x1e88e5, 0.95);
    sketch.moveTo(6, 18);
    sketch.lineTo(20, 8);
    sketch.strokePath();
    sketch.lineStyle(2, 0xef5350, 0.95);
    sketch.moveTo(22, 10);
    sketch.lineTo(36, 24);
    sketch.strokePath();
    sketch.lineStyle(2, 0x43a047, 0.95);
    sketch.moveTo(36, 26);
    sketch.lineTo(12, 40);
    sketch.strokePath();
    container.add([board, sketch, pencil]);
    scene.tweens.add({
      targets: pencil,
      x: { from: 20, to: 84 },
      y: { from: 12, to: 38 },
      yoyo: true,
      repeat: -1,
      duration: 340,
      ease: "Sine.InOut",
    });
    return;
  }

  if (template === "brush") {
    const brushHandle = scene.add.rectangle(26, -22, 20, 5, 0xff7043).setStrokeStyle(2, 0x8d2b1f);
    const brushHead = scene.add.rectangle(36, -22, 8, 8, 0xffffff).setStrokeStyle(1, 0x90a4ae);
    const foam = scene.add.ellipse(6, -26, 22, 10, 0xffffff, 0.9);
    container.add([brushHandle, brushHead, foam]);
    const armRBase = basePose(parts.armR);
    if (parts.armR) {
      scene.tweens.add({
        targets: parts.armR,
        angle: { from: -8, to: -36 },
        yoyo: true,
        repeat: -1,
        duration: 140,
      });
      scene.tweens.add({
        targets: parts.armR,
        x: { from: armRBase.x, to: armRBase.x + 4 },
        y: { from: armRBase.y, to: armRBase.y - 4 },
        yoyo: true,
        repeat: -1,
        duration: 140,
      });
    }
    scene.tweens.add({
      targets: [brushHandle, brushHead],
      x: { from: 16, to: 36 },
      y: { from: -26, to: -18 },
      yoyo: true,
      repeat: -1,
      duration: 150,
    });
  }
}

function applyAdjective(scene, rig, template) {
  const { container, parts } = rig;
  const originalChildren = [...container.list];

  const hideBaseCharacter = () => {
    originalChildren.forEach((item) => item?.setVisible?.(false));
    if (!parts) return;
  };

  const addSubjectPair = (focus = "big") => {
    const left = scene.add.container(-86, 30);
    const right = scene.add.container(88, 30);

    const drawDog = (target, scale = 1, tint = 0xa98274, accent = 0xc0927d) => {
      const body = scene.add.ellipse(0, 0, 84 * scale, 52 * scale, tint, 0.95);
      const head = scene.add.circle(-36 * scale, -9 * scale, 16 * scale, accent, 0.95);
      const ear = scene.add.ellipse(-42 * scale, -14 * scale, 10 * scale, 18 * scale, 0x7a5648, 0.9);
      const eye = scene.add.circle(-32 * scale, -10 * scale, 2.4 * scale, 0x1f1f1f);
      const leg1 = scene.add.rectangle(-10 * scale, 20 * scale, 11 * scale, 18 * scale, 0x8d6e63);
      const leg2 = scene.add.rectangle(10 * scale, 20 * scale, 11 * scale, 18 * scale, 0x8d6e63);
      target.add([body, head, ear, eye, leg1, leg2]);
    };

    const drawCat = (target, scale = 1, tint = 0xffa64d, accent = 0xffc27a) => {
      const body = scene.add.ellipse(0, 0, 80 * scale, 48 * scale, tint, 0.95);
      const head = scene.add.circle(-34 * scale, -10 * scale, 15 * scale, tint, 0.95);
      const earL = scene.add.triangle(-43 * scale, -24 * scale, 0, 10 * scale, 10 * scale, 0, 18 * scale, 10 * scale, 0xff8f3c, 0.95);
      const earR = scene.add.triangle(-28 * scale, -24 * scale, 0, 10 * scale, 10 * scale, 0, 18 * scale, 10 * scale, 0xff8f3c, 0.95);
      const eye = scene.add.circle(-36 * scale, -11 * scale, 2.2 * scale, 0x1f1f1f);
      const tail = scene.add.ellipse(37 * scale, -8 * scale, 26 * scale, 9 * scale, accent, 0.95);
      const pawL = scene.add.rectangle(-10 * scale, 18 * scale, 10 * scale, 15 * scale, 0xea8f3b);
      const pawR = scene.add.rectangle(10 * scale, 18 * scale, 10 * scale, 15 * scale, 0xea8f3b);
      target.add([tail, body, head, earL, earR, eye, pawL, pawR]);
    };

    const drawHuman = (target, scale = 1, shirt = 0x42a5f5) => {
      const head = scene.add.circle(0, -22 * scale, 13 * scale, 0xffd4b8, 0.98);
      const hair = scene.add.rectangle(0, -30 * scale, 28 * scale, 8 * scale, 0x1f1f1f);
      const eyeL = scene.add.circle(-4 * scale, -23 * scale, 1.4 * scale, 0x1f1f1f);
      const eyeR = scene.add.circle(4 * scale, -23 * scale, 1.4 * scale, 0x1f1f1f);
      const mouth = scene.add.arc(0, -17 * scale, 4 * scale, 20, 160, false, 0x3e2723, 1);
      const torso = scene.add.rectangle(0, 2 * scale, 34 * scale, 38 * scale, shirt, 0.97);
      const armL = scene.add.rectangle(-20 * scale, -2 * scale, 7 * scale, 22 * scale, 0xffd4b8);
      const armR = scene.add.rectangle(20 * scale, -2 * scale, 7 * scale, 22 * scale, 0xffd4b8);
      const legL = scene.add.rectangle(-8 * scale, 28 * scale, 9 * scale, 24 * scale, 0x455a64);
      const legR = scene.add.rectangle(8 * scale, 28 * scale, 9 * scale, 24 * scale, 0x546e7a);
      target.add([legL, legR, torso, armL, armR, head, hair, eyeL, eyeR, mouth]);
    };

    const emphasizeSmall = focus === "small" || focus === "short";
    const leftScale = emphasizeSmall ? 0.7 : 1.06;
    const rightScale = emphasizeSmall ? 1.06 : 0.7;
    const isHuman = Boolean(parts?.torso);
    const isDog = Boolean(parts?.snout);
    if (isHuman) {
      drawHuman(left, leftScale, 0xffb74d);
      drawHuman(right, rightScale, 0x90caf9);
    } else if (isDog) {
      drawDog(left, leftScale, 0xffb74d, 0xffcc80);
      drawDog(right, rightScale, 0x9e887f, 0xbca28e);
    } else {
      drawCat(left, leftScale, 0xffb74d, 0xffcc80);
      drawCat(right, rightScale, 0x9e887f, 0xbca28e);
    }

    const glow = scene.add.ellipse(0, 0, 112, 76, 0xfff59d, 0.18).setStrokeStyle(2, 0xffca28, 0.85);
    left.addAt(glow, 0);

    container.add([left, right]);
    return { left, right };
  };

  if (template === "happy") {
    const pop = scene.add.text(94, -28, ":)", { fontSize: "30px", color: "#fff176", fontStyle: "bold", stroke: "#17324b", strokeThickness: 4 }).setOrigin(0.5);
    const smileMouth = scene.add.arc(0, -14, 11, 20, 160, false, 0x3e2723, 1);
    container.add([smileMouth, pop]);
    scene.tweens.add({ targets: container, y: container.y - 8, yoyo: true, repeat: -1, duration: 300 });
    scene.tweens.add({
      targets: smileMouth,
      scaleX: { from: 0.9, to: 1.25 },
      scaleY: { from: 0.8, to: 1.1 },
      yoyo: true,
      repeat: -1,
      duration: 200,
    });
    return;
  }
  if (template === "sad") {
    const tearL = scene.add.ellipse(-10, -34, 5, 9, 0x4fc3f7);
    const tearR = scene.add.ellipse(10, -34, 5, 9, 0x4fc3f7);
    container.add([tearL, tearR]);
    scene.tweens.add({ targets: [tearL, tearR], y: { from: -34, to: -6 }, alpha: { from: 0.95, to: 0.15 }, yoyo: true, repeat: -1, duration: 280 });
    return;
  }
  if (template === "big") {
    hideBaseCharacter();
    addSubjectPair("big");
    return;
  }
  if (template === "small") {
    hideBaseCharacter();
    addSubjectPair("small");
    return;
  }
  if (template === "tall") {
    hideBaseCharacter();
    const pair = addSubjectPair("tall");
    const ruler = scene.add.rectangle(-88, -26, 6, 120, 0xfff3e0, 0.95).setStrokeStyle(2, 0x8d6e63);
    const marks = [];
    for (let i = 0; i < 6; i += 1) {
      marks.push(scene.add.rectangle(-78, 20 - i * 18, 12, 2, 0x8d6e63));
    }
    pair.left.add([ruler, ...marks]);
    return;
  }
  if (template === "short") {
    hideBaseCharacter();
    const pair = addSubjectPair("short");
    const ruler = scene.add.rectangle(88, -14, 6, 86, 0xfff3e0, 0.95).setStrokeStyle(2, 0x8d6e63);
    const marks = [];
    for (let i = 0; i < 5; i += 1) {
      marks.push(scene.add.rectangle(78, 20 - i * 14, 12, 2, 0x8d6e63));
    }
    pair.left.add([ruler, ...marks]);
    return;
  }
  if (template === "fast") {
    applyLoco(scene, rig, { distance: 34, pace: 96, swing: 28, speedLines: true, lean: -16, bob: 6 });
    const burst1 = scene.add.star(-124, -12, 6, 3, 8, 0xfff176, 0.9);
    const burst2 = scene.add.star(-142, 8, 6, 2, 6, 0xfff59d, 0.82);
    const burst3 = scene.add.star(-112, 20, 6, 2, 6, 0xfff176, 0.75);
    container.add([burst1, burst2, burst3]);
    scene.tweens.add({
      targets: [burst1, burst2, burst3],
      x: { from: -150, to: -76 },
      alpha: { from: 0.1, to: 1 },
      scale: { from: 0.6, to: 1.2 },
      yoyo: true,
      repeat: -1,
      duration: 170,
      stagger: 45,
    });
    return;
  }
  if (template === "slow") {
    applyLoco(scene, rig, { distance: 4, pace: 620, swing: 6, lean: 5, bob: 1 });
    const snailBody = scene.add.ellipse(-94, 68, 34, 20, 0x8d6e63, 0.95);
    const shell = scene.add.circle(-108, 63, 12, 0xbcaaa4, 0.95).setStrokeStyle(2, 0x8d6e63);
    const shellSpiral = scene.add.circle(-108, 63, 5, 0x8d6e63, 0.12).setStrokeStyle(2, 0x6d4c41);
    const z1 = scene.add.text(76, -28, "z", { fontSize: "20px", color: "#e3f2fd", fontStyle: "bold" });
    const z2 = scene.add.text(90, -42, "z", { fontSize: "16px", color: "#e3f2fd", fontStyle: "bold" });
    container.add([snailBody, shell, shellSpiral, z1, z2]);
    scene.tweens.add({
      targets: [z1, z2],
      y: "-=16",
      alpha: { from: 0.85, to: 0.2 },
      yoyo: true,
      repeat: -1,
      duration: 520,
      stagger: 110,
    });
    return;
  }
  if (template === "hot") {
    const sun = scene.add.circle(92, -44, 20, 0xffb300, 0.95);
    const rays = [];
    for (let i = 0; i < 8; i += 1) {
      const ray = scene.add.rectangle(92, -44, 4, 16, 0xff8f00, 0.9);
      ray.angle = i * 45;
      rays.push(ray);
    }
    container.add([sun, ...rays]);
    scene.tweens.add({ targets: rays, scaleY: { from: 0.7, to: 1.25 }, yoyo: true, repeat: -1, duration: 180 });
    return;
  }
  if (template === "cold") {
    const flake1 = scene.add.star(82, -40, 6, 4, 9, 0xe3f2fd, 0.95);
    const flake2 = scene.add.star(112, -14, 6, 3, 7, 0xbbdefb, 0.9);
    const breath = scene.add.ellipse(30, -16, 28, 12, 0xe1f5fe, 0.6);
    container.add([flake1, flake2, breath]);
    scene.tweens.add({ targets: [flake1, flake2], angle: 360, repeat: -1, duration: 1800, ease: "Linear" });
    scene.tweens.add({ targets: breath, x: "+=20", alpha: { from: 0.6, to: 0.1 }, yoyo: true, repeat: -1, duration: 420 });
    return;
  }
  if (template === "wet") {
    const drop1 = scene.add.ellipse(-16, -44, 8, 14, 0x4fc3f7, 0.9);
    const drop2 = scene.add.ellipse(2, -40, 8, 14, 0x4fc3f7, 0.9);
    const drop3 = scene.add.ellipse(18, -42, 8, 14, 0x4fc3f7, 0.9);
    const puddle = scene.add.ellipse(0, 86, 80, 20, 0x81d4fa, 0.7);
    container.add([puddle, drop1, drop2, drop3]);
    scene.tweens.add({
      targets: [drop1, drop2, drop3],
      y: { from: -52, to: -12 },
      alpha: { from: 0.95, to: 0.2 },
      yoyo: true,
      repeat: -1,
      duration: 300,
      stagger: 80,
    });
    return;
  }
  if (template === "dirty") {
    const mud1 = scene.add.circle(-16, 32, 9, 0x5d4037, 0.85);
    const mud2 = scene.add.circle(12, 22, 7, 0x5d4037, 0.82);
    const mud3 = scene.add.circle(2, 48, 8, 0x4e342e, 0.82);
    const fly1 = scene.add.circle(66, -26, 2, 0x1f1f1f, 0.9);
    const fly2 = scene.add.circle(76, -20, 2, 0x1f1f1f, 0.9);
    container.add([mud1, mud2, mud3, fly1, fly2]);
    scene.tweens.add({ targets: [fly1, fly2], x: "+=10", yoyo: true, repeat: -1, duration: 180, stagger: 40 });
    return;
  }
  if (template === "clean") {
    const sparkle1 = scene.add.star(-42, -30, 5, 3, 8, 0xfff59d, 0.95);
    const sparkle2 = scene.add.star(44, -18, 5, 3, 8, 0xfff59d, 0.95);
    const sparkle3 = scene.add.star(6, 4, 5, 2, 6, 0xffffff, 0.95);
    container.add([sparkle1, sparkle2, sparkle3]);
    scene.tweens.add({
      targets: [sparkle1, sparkle2, sparkle3],
      scale: { from: 0.6, to: 1.15 },
      alpha: { from: 0.35, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 260,
      stagger: 80,
    });
  }
}

export function applyQuestionAction(scene, rig, word, category = "verbs") {
  const normalized = String(word ?? "").trim().toLowerCase();
  if (!normalized) return false;

  if (category === "adjectives") {
    const profile = ADJECTIVE_PROFILES[normalized];
    if (!profile) return false;
    applyAdjective(scene, rig, profile.template);
    return true;
  }

  const profile = VERB_PROFILES[normalized];
  if (!profile) return false;
  addBadge(scene, rig.container, profile.badge ?? normalized.toUpperCase());

  switch (profile.template) {
    case "runClassic":
      applyRunClassic(scene, rig, profile);
      break;
    case "walkClassic":
      applyWalkClassic(scene, rig, profile);
      break;
    case "locomotion":
      applyLoco(scene, rig, profile);
      break;
    case "fly":
      applyFly(scene, rig);
      break;
    case "look":
      applyLook(scene, rig);
      break;
    case "wash":
      applyWash(scene, rig);
      break;
    case "throw":
      applyThrow(scene, rig);
      break;
    case "catch":
      applyCatch(scene, rig);
      break;
    case "kick":
      applyKick(scene, rig);
      break;
    case "climb":
      applyClimb(scene, rig);
      break;
    case "hide":
      applyHide(scene, rig);
      break;
    case "cry":
      applyAdjective(scene, rig, "sad");
      break;
    case "smile":
      applyAdjective(scene, rig, "happy");
      break;
    default:
      applySimple(scene, rig, profile.template);
      break;
  }

  return true;
}
