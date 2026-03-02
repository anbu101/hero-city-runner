function makeFace(scene, container, x, y, skinColor = 0xffd4b8) {
  const head = scene.add.circle(x, y, 34, skinColor);
  const eyeL = scene.add.circle(x - 11, y - 4, 3, 0x1f1f1f);
  const eyeR = scene.add.circle(x + 11, y - 4, 3, 0x1f1f1f);
  const smile = scene.add.arc(x, y + 9, 9, 20, 160, false, 0x1f1f1f, 1);
  container.add([head, eyeL, eyeR, smile]);
  return { head, eyes: [eyeL, eyeR] };
}

export const RUNNER_STYLES = {
  orange_star: { name: "Orange Star", jacket: 0xf57c00, torso: 0x2b2b2b, legsL: 0x1e2f82, legsR: 0x263aa2 },
  red_royal: { name: "Red Royal", jacket: 0x9d1b21, torso: 0x222222, legsL: 0x1e2f82, legsR: 0x263aa2 },
  blue_bolt: { name: "Blue Bolt", jacket: 0x1565c0, torso: 0x1c2a3a, legsL: 0x29436d, legsR: 0x365986 },
  gold_flash: { name: "Gold Flash", jacket: 0xffb300, torso: 0x2a2212, legsL: 0x3f3a2a, legsR: 0x4d4733 },
};

export function createRunnerCharacter(scene, x, y, styleKey = "orange_star") {
  const style = RUNNER_STYLES[styleKey] ?? RUNNER_STYLES.orange_star;
  const container = scene.add.container(x, y).setDepth(12);

  const torso = scene.add.rectangle(0, 8, 42, 56, style.torso, 1).setOrigin(0.5, 0.55);
  const jacketL = scene.add.triangle(-9, 8, 0, -28, 16, 28, 0, 28, style.jacket, 0.95);
  const jacketR = scene.add.triangle(9, 8, 16, -28, 0, 28, 16, 28, style.jacket, 0.95);
  const shirt = scene.add.rectangle(0, 8, 10, 44, 0xe8e8e8, 1).setOrigin(0.5, 0.55);
  const armL = scene.add.rectangle(-22, 9, 10, 33, 0xffc8a8).setOrigin(0.5, 0.15);
  const armR = scene.add.rectangle(22, 9, 10, 33, 0xffc8a8).setOrigin(0.5, 0.15);
  const legL = scene.add.rectangle(-9, 44, 12, 40, style.legsL).setOrigin(0.5, 0.12);
  const legR = scene.add.rectangle(9, 44, 12, 40, style.legsR).setOrigin(0.5, 0.12);
  const shoeL = scene.add.ellipse(-9, 74, 16, 7, 0x121212);
  const shoeR = scene.add.ellipse(9, 74, 16, 7, 0x121212);

  const hasPhoto = scene.textures.exists("vijayPhoto");
  let head;
  let eyes = [];
  const headDecor = [];

  if (hasPhoto) {
    const facePhoto = scene.add
      .image(0, -34, "vijayPhoto")
      .setCrop(92, 4, 460, 460)
      .setDisplaySize(72, 72);
    headDecor.push(facePhoto);
    head = facePhoto;
  } else {
    const face = makeFace(scene, container, 0, -30, 0xffc8a8);
    const hairBack = scene.add.ellipse(0, -49, 58, 20, 0x151515);
    const hairTop = scene.add.triangle(10, -58, 0, 12, 24, 0, 28, 16, 0x151515);
    const beard = scene.add.ellipse(0, -20, 26, 11, 0x2a2320, 0.95);
    const mustache = scene.add.ellipse(0, -24, 18, 4, 0x2a2320, 0.95);
    headDecor.push(hairBack, hairTop, beard, mustache);
    head = face.head;
    eyes = face.eyes;
  }

  container.add([
    legL,
    legR,
    shoeL,
    shoeR,
    torso,
    shirt,
    jacketL,
    jacketR,
    armL,
    armR,
  ]);
  container.add(headDecor);

  return {
    container,
    parts: {
      torso,
      armL,
      armR,
      legL,
      legR,
      head,
      eyes,
    },
  };
}

function makeCat(scene) {
  const container = scene.add.container(0, 0);
  const body = scene.add.ellipse(0, 28, 156, 88, 0xffa64d);
  const belly = scene.add.ellipse(-8, 34, 74, 44, 0xffc27a, 0.92);
  const head = scene.add.circle(-60, -8, 34, 0xffa64d);
  const earL = scene.add.triangle(-78, -36, 0, 18, 16, 0, 30, 18, 0xff8f3c);
  const earR = scene.add.triangle(-48, -36, 0, 18, 16, 0, 30, 18, 0xff8f3c);
  const innerEarL = scene.add.triangle(-78, -31, 5, 15, 14, 4, 22, 15, 0xffd7b0, 0.9);
  const innerEarR = scene.add.triangle(-48, -31, 5, 15, 14, 4, 22, 15, 0xffd7b0, 0.9);
  const eye = scene.add.circle(-68, -14, 3, 0x1f1f1f);
  const nose = scene.add.circle(-82, -4, 2.2, 0x5d4037);
  const whisker1 = scene.add.rectangle(-92, -5, 16, 2, 0x5d4037);
  const whisker2 = scene.add.rectangle(-92, 1, 16, 2, 0x5d4037);
  const tail = scene.add.ellipse(76, -6, 46, 14, 0xff8f3c);
  const pawL = scene.add.rectangle(-20, 62, 18, 22, 0xea8f3b);
  const pawR = scene.add.rectangle(16, 62, 18, 22, 0xea8f3b);
  container.add([
    tail,
    body,
    belly,
    head,
    earL,
    earR,
    innerEarL,
    innerEarR,
    eye,
    nose,
    whisker1,
    whisker2,
    pawL,
    pawR,
  ]);

  return {
    container,
    parts: { eyes: [eye], legL: pawL, legR: pawR, body, head, tail },
  };
}

function makeDog(scene) {
  const container = scene.add.container(0, 0);
  const body = scene.add.ellipse(2, 26, 176, 92, 0x9b7a66);
  const chest = scene.add.ellipse(-40, 30, 52, 42, 0xb28f79, 0.95);
  const head = scene.add.ellipse(-66, -4, 68, 58, 0x9b7a66);
  const snout = scene.add.ellipse(-90, 4, 32, 24, 0xc7a58c);
  const nose = scene.add.ellipse(-102, 2, 8, 6, 0x1f1f1f);
  const earL = scene.add.triangle(-78, -30, 0, 0, 14, 26, 24, 2, 0x6d4c41);
  const earR = scene.add.triangle(-54, -32, 0, 2, 12, 28, 24, 0, 0x6d4c41);
  const tail = scene.add.ellipse(90, 0, 24, 12, 0x8b6b59);
  const eye = scene.add.circle(-76, -10, 3.2, 0x1f1f1f);
  const legL = scene.add.rectangle(-18, 62, 20, 28, 0x8b6b59);
  const legR = scene.add.rectangle(24, 62, 20, 28, 0x8b6b59);
  container.add([tail, body, chest, head, snout, nose, earL, earR, eye, legL, legR]);

  return {
    container,
    parts: {
      eyes: [eye],
      legL,
      legR,
      body,
      head,
      tail,
      snout,
      earL,
      earR,
    },
  };
}

function makeBoy(scene, shirt = 0x42a5f5) {
  const container = scene.add.container(0, 0);
  const torso = scene.add.rectangle(0, 30, 84, 78, shirt);
  const collar = scene.add.rectangle(0, -1, 36, 10, 0xffffff, 0.85);
  const armL = scene.add.rectangle(-50, 20, 16, 52, 0xffd4b8).setOrigin(0.5, 0.12);
  const armR = scene.add.rectangle(50, 20, 16, 52, 0xffd4b8).setOrigin(0.5, 0.12);
  const legL = scene.add.rectangle(-18, 82, 20, 44, 0x455a64).setOrigin(0.5, 0.05);
  const legR = scene.add.rectangle(18, 82, 20, 44, 0x546e7a).setOrigin(0.5, 0.05);
  const face = makeFace(scene, container, 0, -44);
  const hair = scene.add.rectangle(0, -62, 70, 16, 0x1f1f1f);
  container.add([legL, legR, torso, armL, armR, hair]);
  container.add(collar);
  return { container, parts: { torso, armL, armR, legL, legR, head: face.head, eyes: face.eyes } };
}

export function createQuestionCharacter(scene, subject) {
  if (subject === "cat") {
    return makeCat(scene);
  }

  if (subject === "dog") {
    return makeDog(scene);
  }

  if (subject === "boy") {
    return makeBoy(scene, 0x42a5f5);
  }

  return makeBoy(scene, 0xef5350);
}
