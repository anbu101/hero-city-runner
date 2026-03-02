import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import MainScene from "./MainScene";

function detectTouchDevice() {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches)
  );
}

export default function Game() {
  const gameRef = useRef(null);
  const [showAudioUnlock, setShowAudioUnlock] = useState(() => detectTouchDevice());
  const [initError, setInitError] = useState("");
  const [gameReady, setGameReady] = useState(false);

  useEffect(() => {
    if (!gameRef.current) return undefined;
    const markRuntimeError = (message) => {
      window.requestAnimationFrame(() => {
        setInitError(message || "Unknown runtime error.");
      });
    };
    const onWindowError = (event) => {
      markRuntimeError(event?.error?.message || event?.message || "Runtime error");
    };
    const onRejection = (event) => {
      markRuntimeError(event?.reason?.message || String(event?.reason || "Promise rejection"));
    };
    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onRejection);

    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      resolution: 1,
      autoRound: true,
      parent: gameRef.current,
      backgroundColor: "#9ed9ff",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 2000 },
          debug: false,
        },
      },
      scene: [MainScene],
    };

    let game;
    try {
      game = new Phaser.Game(config);
    } catch {
      try {
        game = new Phaser.Game({
          ...config,
          type: Phaser.CANVAS,
        });
      } catch (err) {
        window.requestAnimationFrame(() => {
          setInitError(err instanceof Error ? err.message : "Failed to initialize game.");
        });
        window.removeEventListener("error", onWindowError);
        window.removeEventListener("unhandledrejection", onRejection);
        return undefined;
      }
    }

    window.requestAnimationFrame(() => setInitError(""));
    game.canvas.style.width = "100%";
    game.canvas.style.height = "100%";
    game.canvas.style.display = "block";
    window.requestAnimationFrame(() => setGameReady(true));

    return () => {
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onRejection);
      if (game) {
        game.destroy(true);
      }
    };
  }, []);

  const enableAudio = () => {
    if (!gameReady) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      try {
        if (!window.__heroAudioCtx || window.__heroAudioCtx.state === "closed") {
          window.__heroAudioCtx = new Ctx();
        }
        const ctx = window.__heroAudioCtx;
        if (ctx.state === "suspended") {
          ctx.resume();
        }
        const t = ctx.currentTime + 0.01;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(880, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.03, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.09);
      } catch {
        // ignore and continue with scene bridge
      }
    }

    let attempts = 0;
    const tryEnable = () => {
      const bridge = window.__heroEnableAudio;
      if (typeof bridge === "function") {
        const ok = bridge();
        if (ok !== false) {
          setShowAudioUnlock(false);
          return;
        }
      }

      attempts += 1;
      if (attempts < 8) {
        window.setTimeout(tryEnable, 80);
      }
    };

    tryEnable();
  };

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <div
        ref={gameRef}
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          touchAction: "none",
        }}
      />
      {showAudioUnlock ? (
        <button
          type="button"
          onClick={enableAudio}
          onTouchStart={enableAudio}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 9999,
            background: "rgba(4, 20, 42, 0.7)",
            color: "#fff3b0",
            fontSize: "30px",
            fontWeight: 800,
            border: "0",
            outline: "none",
            cursor: "pointer",
          }}
        >
          Tap to Enable Sound
        </button>
      ) : null}
      {initError ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#0d2238",
            color: "#fff3b0",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px",
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          {`Game failed to load on this browser: ${initError}`}
        </div>
      ) : null}
    </div>
  );
}
