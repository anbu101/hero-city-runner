import { useEffect, useMemo, useRef, useState } from "react";
import Phaser from "phaser";
import { createQuestionCharacter } from "./characters/characterFactory";
import { animateQuestionCharacter } from "./characters/characterAnimator";
import { QUESTION_BANKS } from "./data/wordBank";
import { AudioManager } from "./audio/audioManager";

const SUBJECTS = ["boy", "dog", "cat", "hero"];
const ADJECTIVE_WHITELIST = new Set([
  "big",
  "small",
  "tall",
  "short",
  "fast",
  "slow",
  "happy",
  "sad",
  "hot",
  "cold",
  "wet",
  "dirty",
  "clean",
]);

function createAnimationLabScene(config) {
  return class AnimationLabScene extends Phaser.Scene {
    constructor() {
      super("AnimationLabScene");
    }

    create() {
      const width = this.scale.width;
      const height = this.scale.height;
      this.cameras.main.setBackgroundColor("#8bc6ee");

      const groundY = height - 70;
      this.add.rectangle(width / 2, groundY + 30, width + 20, 120, 0x2e7d32).setDepth(1);
      this.add.rectangle(width / 2, groundY - 6, width * 0.6, 8, 0x66bb6a, 0.9).setDepth(2);
      this.add.ellipse(width / 2, groundY - 14, 140, 22, 0x000000, 0.18).setDepth(2);
      this.add
        .text(
          width / 2,
          28,
          `${config.category.toUpperCase()} • ${config.subject.toUpperCase()} • ${config.word.toUpperCase()}`,
          {
            fontSize: "28px",
            fontStyle: "bold",
            color: "#17324b",
            stroke: "#ffffff",
            strokeThickness: 5,
          }
        )
        .setOrigin(0.5);

      const rig = createQuestionCharacter(this, config.subject);
      rig.container.setPosition(width / 2, groundY - 12);
      rig.container.setScale(1.35);
      animateQuestionCharacter(this, rig, config.word, config.category);
      const b = rig.container.getBounds();
      if (b && Number.isFinite(b.bottom)) {
        rig.container.y += groundY - b.bottom;
      }
    }
  };
}

function uniqueWordsFor(category) {
  const list = QUESTION_BANKS[category] ?? [];
  const words = [...new Set(list.map((entry) => entry.correct))];
  if (category !== "adjectives") return words;
  return words.filter((word) => ADJECTIVE_WHITELIST.has(word));
}

export default function AnimationLab() {
  const mountRef = useRef(null);
  const audioRef = useRef(null);
  const [category, setCategory] = useState("verbs");
  const words = useMemo(() => uniqueWordsFor(category), [category]);
  const [word, setWord] = useState("running");
  const [subject, setSubject] = useState("boy");
  const [loopCue, setLoopCue] = useState(true);
  const selectedWord = words.includes(word) ? word : words[0] ?? "";
  const selectedSubject = category === "adjectives" ? "boy" : subject;

  const onCategoryChange = (nextCategory) => {
    setCategory(nextCategory);
    if (nextCategory === "adjectives") {
      setSubject("boy");
    }
    const nextWords = uniqueWordsFor(nextCategory);
    setWord(nextWords[0] ?? "");
  };

  const playCue = () => {
    if (!selectedWord) return;
    if (!audioRef.current) {
      audioRef.current = new AudioManager();
    }
    audioRef.current.unlock();
    audioRef.current.playActionCue(selectedWord, category);
  };

  useEffect(() => {
    if (!mountRef.current || !selectedWord) return undefined;

    const SceneClass = createAnimationLabScene({ category, subject: selectedSubject, word: selectedWord });

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: mountRef.current,
      backgroundColor: "#8bc6ee",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [SceneClass],
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false },
      },
    });

    return () => game.destroy(true);
  }, [category, selectedSubject, selectedWord]);

  useEffect(() => {
    if (!selectedWord || !audioRef.current) return undefined;
    if (!loopCue) {
      audioRef.current.stopActionCueLoop();
      return undefined;
    }
    audioRef.current.startActionCueLoop(selectedWord, category, 1200);
    return () => audioRef.current?.stopActionCueLoop();
  }, [selectedWord, category, loopCue]);

  useEffect(() => {
    const onUnlock = () => {
      if (!audioRef.current) {
        audioRef.current = new AudioManager();
      }
      audioRef.current.unlock();
      if (loopCue && selectedWord) {
        audioRef.current.startActionCueLoop(selectedWord, category, 1200);
      }
    };
    window.addEventListener("pointerdown", onUnlock, { passive: true });
    window.addEventListener("touchstart", onUnlock, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onUnlock);
      window.removeEventListener("touchstart", onUnlock);
      audioRef.current?.stopActionCueLoop();
    };
  }, [loopCue, selectedWord, category]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#8bc6ee", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 100,
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: "rgba(19, 47, 74, 0.86)",
          border: "2px solid #ffe082",
          borderRadius: 10,
          padding: "8px 10px",
        }}
      >
        <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
          <option value="verbs">Verbs</option>
          <option value="adjectives">Adjectives</option>
        </select>
        <select
          value={selectedSubject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={category === "adjectives"}
        >
          {SUBJECTS.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
        <select value={selectedWord} onChange={(e) => setWord(e.target.value)}>
          {words.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={playCue}
          style={{
            color: "#ffffff",
            background: "#2a6fdb",
            border: "1px solid #ffffff",
            borderRadius: 8,
            padding: "5px 10px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Play Cue
        </button>
        <button
          type="button"
          onClick={() => setLoopCue((v) => !v)}
          style={{
            color: "#ffffff",
            background: loopCue ? "#2e7d32" : "#5d6d7e",
            border: "1px solid #ffffff",
            borderRadius: 8,
            padding: "5px 10px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {loopCue ? "Loop On" : "Loop Off"}
        </button>
        <a
          href="/"
          style={{
            color: "#fff3b0",
            textDecoration: "none",
            fontWeight: 800,
            border: "1px solid #fff3b0",
            borderRadius: 8,
            padding: "4px 8px",
          }}
        >
          Back To Game
        </a>
      </div>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
