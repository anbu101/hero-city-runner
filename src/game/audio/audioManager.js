function createTone(context, destination, frequency, durationMs, when, type = "sine", gainValue = 0.05) {
  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, when);

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(gainValue, when + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + durationMs / 1000);

  osc.connect(gain);
  gain.connect(destination);
  osc.start(when);
  osc.stop(when + durationMs / 1000 + 0.03);
}

const ACTION_AUDIO_FILES = new Set([
  "afraid",
  "barking",
  "big",
  "brave",
  "brushing",
  "calm",
  "catching",
  "climbing",
  "crying",
  "dancing",
  "digging",
  "drawing",
  "eating",
  "fast",
  "flying",
  "happy",
  "hiding",
  "jumping",
  "kicking",
  "laughing",
  "looking",
  "reading",
  "running",
  "sad",
  "sleeping",
  "slow",
  "small",
  "smiling",
  "strong",
  "tall",
  "throwing",
  "walking",
  "washing",
  "waving",
  "weak",
]);

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.voices = [];
    this.speechToken = 0;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.bgmEnabled = false;
    this.actionCueTimer = null;
    this.isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    this.fileAudioVolume = this.isIOS ? 1 : 0.95;
    this.actionAudioPlayers = new Map();
    this.currentActionAudioKey = null;
    this.lastActionCueAt = 0;
    this.bgmMuted = false;
    this.clipsMuted = false;

    this.refreshVoices = this.refreshVoices.bind(this);
    this.refreshVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = this.refreshVoices;
    }
  }

  refreshVoices() {
    if (!window.speechSynthesis) return;
    this.voices = window.speechSynthesis.getVoices() ?? [];
  }

  unlock() {
    if (this.unlocked) {
      this.ensureAudioReady();
      return;
    }

    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      this.ctx = new Ctx();
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }

    this.unlocked = true;

    // iOS Safari often needs a user-gesture speech warmup before later prompts work reliably.
    if (window.speechSynthesis) {
      try {
        const warm = new SpeechSynthesisUtterance(" ");
        warm.volume = 0;
        warm.rate = 1;
        warm.pitch = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(warm);
      } catch {
        // ignore speech warmup errors
      }
    }
  }

  forceEnableFromGesture() {
    this.unlock();
    if (!this.ensureAudioReady()) return false;

    const t = this.ctx.currentTime;
    createTone(this.ctx, this.ctx.destination, 740, 40, t, "square", 0.04);
    createTone(this.ctx, this.ctx.destination, 920, 45, t + 0.03, "triangle", 0.035);
    return this.ctx.state === "running";
  }

  startBackgroundMusic() {
    if (this.bgmMuted) return;
    if (this.bgmEnabled) return;
    if (!this.ensureAudioReady()) return;

    this.bgmEnabled = true;
    this.bgmStep = 0;
    const lead = [659, 784, 988, 784, 659, 523, 587, 659];
    const bass = [196, 196, 220, 196, 175, 165, 147, 165];

    this.bgmTimer = window.setInterval(() => {
      if (!this.bgmEnabled || !this.ensureAudioReady()) return;
      const t = this.ctx.currentTime + 0.01;
      const i = this.bgmStep % lead.length;
      createTone(this.ctx, this.ctx.destination, lead[i], 140, t, "square", 0.014);
      createTone(this.ctx, this.ctx.destination, bass[i], 220, t, "triangle", 0.01);
      this.bgmStep += 1;
    }, 240);
  }

  stopBackgroundMusic() {
    this.bgmEnabled = false;
    if (this.bgmTimer) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  setBgmMuted(muted) {
    this.bgmMuted = Boolean(muted);
    if (this.bgmMuted) {
      this.stopBackgroundMusic();
    }
  }

  setClipsMuted(muted) {
    this.clipsMuted = Boolean(muted);
    if (!this.clipsMuted) return;
    this.stopSpeech();
    this.stopActionCueLoop();
  }

  stopActionCueLoop() {
    if (this.actionCueTimer) {
      window.clearInterval(this.actionCueTimer);
      this.actionCueTimer = null;
    }
    if (this.currentActionAudioKey) {
      const player = this.actionAudioPlayers.get(this.currentActionAudioKey);
      if (player) {
        player.pause();
        player.currentTime = 0;
      }
      this.currentActionAudioKey = null;
    }
  }

  resolveActionAudioKey(action) {
    const key = String(action ?? "").toLowerCase();
    if (key === "talking") return null;
    return ACTION_AUDIO_FILES.has(key) ? key : null;
  }

  playActionAudioFile(action) {
    const key = this.resolveActionAudioKey(action);
    if (!key) return false;

    let player = this.actionAudioPlayers.get(key);
    if (!player) {
      player = new Audio(`/audio/actions-sfx/${key}.mp3`);
      player.preload = "auto";
      this.actionAudioPlayers.set(key, player);
    }

    try {
      if (this.currentActionAudioKey && this.currentActionAudioKey !== key) {
        const prev = this.actionAudioPlayers.get(this.currentActionAudioKey);
        if (prev) {
          prev.pause();
          prev.currentTime = 0;
        }
      }
      player.pause();
      player.currentTime = 0;
      player.volume = this.fileAudioVolume;
      const playPromise = player.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          // fallback handles playback failure
        });
      }
      this.currentActionAudioKey = key;
      return true;
    } catch {
      return false;
    }
  }

  ensureAudioReady() {
    if (!this.ctx) {
      this.unlock();
      if (!this.ctx) return false;
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx.state !== "closed";
  }

  stopSpeech() {
    if (!window.speechSynthesis) return;
    this.speechToken += 1;
    window.speechSynthesis.cancel();
  }

  pickFriendlyVoice(lang = "en-US") {
    if (!this.voices.length) return null;

    const englishVoices = this.voices.filter((voice) => voice.lang?.startsWith("en"));
    const candidates = englishVoices.length ? englishVoices : this.voices;
    const langPrefix = lang.split("-")[0];

    const scoreVoice = (voice) => {
      let score = 0;
      const name = voice.name.toLowerCase();

      if (voice.lang?.toLowerCase().startsWith(langPrefix.toLowerCase())) score += 20;
      if (voice.lang?.toLowerCase().includes("en-us")) score += 20;
      if (voice.lang?.toLowerCase().includes("en-gb")) score += 14;
      if (name.includes("female")) score += 24;
      if (name.includes("child")) score += 24;
      if (name.includes("kids")) score += 24;
      if (name.includes("girl")) score += 16;
      if (name.includes("samantha")) score += 18;
      if (name.includes("serena")) score += 16;
      if (name.includes("ava")) score += 16;
      if (name.includes("karen")) score += 12;
      if (name.includes("victoria")) score += 12;
      if (name.includes("zira")) score += 10;
      if (name.includes("google") && name.includes("us")) score += 10;
      if (name.includes("india")) score += 8;
      if (name.includes("ravi")) score -= 4;
      if (name.includes("prabhat")) score -= 4;
      if (name.includes("male")) score -= 16;
      if (voice.localService) score += 2;
      if (name.includes("fred")) score -= 24;
      if (name.includes("daniel")) score -= 12;

      return score;
    };

    return [...candidates].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ?? null;
  }

  speak(text, config = {}) {
    if (this.clipsMuted) return Promise.resolve(false);
    if (!window.speechSynthesis || !text) return Promise.resolve(false);

    const token = ++this.speechToken;
    const rate = config.rate ?? 0.9;
    const pitch = config.pitch ?? 1.22;
    const volume = config.volume ?? 0.9;
    const lang = config.lang ?? "en-US";
    const voice = this.pickFriendlyVoice(lang);
    const flushDelay = config.flushDelay ?? (this.isIOS ? 60 : 0);

    window.speechSynthesis.cancel();

    return new Promise((resolve) => {
      window.setTimeout(() => {
        if (token !== this.speechToken) {
          resolve(false);
          return;
        }

        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = rate;
        utter.pitch = pitch;
        utter.volume = volume;
        utter.lang = lang;
        if (voice) utter.voice = voice;

        utter.onend = () => resolve(token === this.speechToken);
        utter.onerror = () => resolve(false);

        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utter);

        const fallbackMs = Math.max(1800, Math.min(5000, text.length * 130));
        window.setTimeout(() => resolve(token === this.speechToken), fallbackMs);
      }, flushDelay);
    });
  }

  speakQuestionPrompt(question) {
    if (!question) return Promise.resolve(false);
    const sentence = question.speechText ?? question.sentence?.replace("____", "blank");

    return this.speak(sentence, {
      rate: 0.9,
      pitch: 1.26,
      volume: 0.86,
      lang: "en-US",
    });
  }

  async speakQuestionPromptReliable(question, retries = 1) {
    let ok = await this.speakQuestionPrompt(question);
    let attempts = retries;
    while (!ok && attempts > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, this.isIOS ? 220 : 120));
      ok = await this.speakQuestionPrompt(question);
      attempts -= 1;
    }
    return ok;
  }

  speakWord(word) {
    return this.speak(word, {
      rate: 0.82,
      pitch: 1.3,
      volume: 0.88,
      lang: "en-US",
    });
  }

  playHit() {
    if (this.clipsMuted) return;
    this.unlock();
    if (!this.ensureAudioReady()) return;

    const t = this.ctx.currentTime;
    createTone(this.ctx, this.ctx.destination, 190, 180, t, "square", 0.14);
    createTone(this.ctx, this.ctx.destination, 120, 260, t + 0.06, "sawtooth", 0.12);
  }

  playCorrect() {
    if (this.clipsMuted) return;
    this.unlock();
    if (!this.ensureAudioReady()) return;

    const t = this.ctx.currentTime;
    createTone(this.ctx, this.ctx.destination, 523.25, 100, t, "triangle", 0.08);
    createTone(this.ctx, this.ctx.destination, 659.25, 110, t + 0.08, "triangle", 0.08);
    createTone(this.ctx, this.ctx.destination, 783.99, 130, t + 0.16, "triangle", 0.08);
  }

  playWrong() {
    if (this.clipsMuted) return;
    this.unlock();
    if (!this.ensureAudioReady()) return;

    const t = this.ctx.currentTime;
    createTone(this.ctx, this.ctx.destination, 260, 110, t, "sine", 0.08);
    createTone(this.ctx, this.ctx.destination, 210, 140, t + 0.1, "sine", 0.08);
  }

  playCoin() {
    if (this.clipsMuted) return;
    this.unlock();
    if (!this.ensureAudioReady()) return;

    const t = this.ctx.currentTime;
    createTone(this.ctx, this.ctx.destination, 1046.5, 60, t, "square", 0.04);
    createTone(this.ctx, this.ctx.destination, 1318.5, 80, t + 0.04, "square", 0.04);
  }

  playJump() {
    if (this.clipsMuted) return;
    this.unlock();
    if (!this.ensureAudioReady()) return;

    const t = this.ctx.currentTime;
    createTone(this.ctx, this.ctx.destination, 660, 45, t, "square", 0.05);
    createTone(this.ctx, this.ctx.destination, 820, 48, t + 0.035, "square", 0.048);
    createTone(this.ctx, this.ctx.destination, 980, 52, t + 0.07, "triangle", 0.04);
  }

  playWin() {
    if (this.clipsMuted) return;
    this.unlock();
    if (!this.ensureAudioReady()) return;

    const t = this.ctx.currentTime;
    createTone(this.ctx, this.ctx.destination, 523.25, 90, t, "triangle", 0.07);
    createTone(this.ctx, this.ctx.destination, 659.25, 100, t + 0.08, "triangle", 0.07);
    createTone(this.ctx, this.ctx.destination, 783.99, 120, t + 0.16, "triangle", 0.07);
    createTone(this.ctx, this.ctx.destination, 1046.5, 150, t + 0.28, "triangle", 0.08);
  }

  playActionCue(action, category = "verbs") {
    if (this.clipsMuted) return;
    const key = String(action ?? "").toLowerCase();
    if (key === "talking") return;

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - this.lastActionCueAt >= 170) {
      const filePlayed = this.playActionAudioFile(action);
      this.lastActionCueAt = now;
      if (filePlayed) return;
    }

    this.unlock();
    if (!this.ensureAudioReady()) return;
    const t = this.ctx.currentTime;

    if (category === "adjectives") {
      if (key === "happy" || key === "smiling") {
        createTone(this.ctx, this.ctx.destination, 660, 70, t, "triangle", 0.07);
        createTone(this.ctx, this.ctx.destination, 880, 80, t + 0.08, "triangle", 0.07);
        return;
      }
      if (key === "sad" || key === "crying") {
        createTone(this.ctx, this.ctx.destination, 420, 120, t, "sine", 0.065);
        createTone(this.ctx, this.ctx.destination, 300, 130, t + 0.12, "sine", 0.065);
        return;
      }
    }

    switch (key) {
      case "running":
      case "walking":
        createTone(this.ctx, this.ctx.destination, 240, 45, t, "square", 0.065);
        createTone(this.ctx, this.ctx.destination, 300, 45, t + 0.09, "square", 0.065);
        break;
      case "flying":
        createTone(this.ctx, this.ctx.destination, 560, 120, t, "triangle", 0.07);
        createTone(this.ctx, this.ctx.destination, 720, 130, t + 0.1, "triangle", 0.07);
        break;
      case "laughing":
        createTone(this.ctx, this.ctx.destination, 520, 60, t, "sine", 0.072);
        createTone(this.ctx, this.ctx.destination, 620, 60, t + 0.07, "sine", 0.072);
        createTone(this.ctx, this.ctx.destination, 700, 70, t + 0.14, "sine", 0.072);
        break;
      case "smiling":
        createTone(this.ctx, this.ctx.destination, 740, 70, t, "triangle", 0.072);
        createTone(this.ctx, this.ctx.destination, 980, 85, t + 0.08, "triangle", 0.072);
        break;
      case "talking":
        createTone(this.ctx, this.ctx.destination, 360, 45, t, "square", 0.06);
        createTone(this.ctx, this.ctx.destination, 420, 45, t + 0.07, "square", 0.06);
        break;
      case "sleeping":
        createTone(this.ctx, this.ctx.destination, 250, 150, t, "sine", 0.05);
        break;
      default:
        createTone(this.ctx, this.ctx.destination, 600, 60, t, "triangle", 0.05);
        break;
    }
  }

  startActionCueLoop(action, category = "verbs", intervalMs = 520) {
    if (this.clipsMuted) return;
    this.stopActionCueLoop();
    this.playActionCue(action, category);
    this.actionCueTimer = window.setInterval(() => {
      this.playActionCue(action, category);
    }, intervalMs);
  }
}
