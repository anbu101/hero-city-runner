export const VERB_WORD_BANK = [
  {
    type: "context",
    subject: "cat",
    correct: "running",
    sentence: "The cat is ____.",
    options: ["running", "sleeping", "jumping"],
  },
  {
    type: "context",
    subject: "cat",
    correct: "sleeping",
    sentence: "The cat is ____.",
    options: ["sleeping", "running", "eating"],
  },
  {
    type: "context",
    subject: "cat",
    correct: "jumping",
    sentence: "The cat is ____.",
    options: ["jumping", "sleeping", "running"],
  },
  {
    type: "context",
    subject: "cat",
    correct: "eating",
    sentence: "The cat is ____.",
    options: ["eating", "running", "jumping"],
  },
  {
    type: "context",
    subject: "dog",
    correct: "barking",
    sentence: "The dog is ____.",
    options: ["barking", "sleeping", "running"],
  },
  {
    type: "context",
    subject: "dog",
    correct: "running",
    sentence: "The dog is ____.",
    options: ["running", "digging", "sleeping"],
  },
  {
    type: "context",
    subject: "dog",
    correct: "digging",
    sentence: "The dog is ____.",
    options: ["digging", "running", "barking"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "jumping",
    sentence: "The boy is ____.",
    options: ["jumping", "reading", "laughing"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "reading",
    sentence: "The boy is ____.",
    options: ["reading", "jumping", "running"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "laughing",
    sentence: "The boy is ____.",
    options: ["laughing", "reading", "jumping"],
  },
  {
    type: "context",
    subject: "hero",
    correct: "running",
    sentence: "The hero is ____.",
    options: ["running", "dancing", "sleeping"],
  },
  {
    type: "context",
    subject: "hero",
    correct: "dancing",
    sentence: "The hero is ____.",
    options: ["dancing", "running", "sleeping"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "walking",
    sentence: "The boy is ____.",
    options: ["walking", "running", "jumping"],
  },
  {
    type: "context",
    subject: "dog",
    correct: "climbing",
    sentence: "The dog is ____.",
    options: ["climbing", "running", "sleeping"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "throwing",
    sentence: "The boy is ____.",
    options: ["throwing", "catching", "kicking"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "kicking",
    sentence: "The boy is ____.",
    options: ["kicking", "throwing", "catching"],
  },
  {
    type: "context",
    subject: "hero",
    correct: "catching",
    sentence: "The hero is ____.",
    options: ["catching", "throwing", "kicking"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "crying",
    sentence: "The boy is ____.",
    options: ["crying", "laughing", "talking"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "waving",
    sentence: "The boy is ____.",
    options: ["waving", "talking", "running"],
  },
  {
    type: "context",
    subject: "hero",
    correct: "talking",
    sentence: "The hero is ____.",
    options: ["talking", "laughing", "waving"],
  },
  {
    type: "context",
    subject: "cat",
    correct: "looking",
    sentence: "The cat is ____.",
    options: ["looking", "running", "sleeping"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "drawing",
    sentence: "The boy is ____.",
    options: ["drawing", "reading", "talking"],
  },
  {
    type: "context",
    subject: "dog",
    correct: "washing",
    sentence: "The dog is ____.",
    options: ["washing", "digging", "barking"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "brushing",
    sentence: "The boy is ____.",
    options: ["brushing", "washing", "talking"],
  },
];

export const ADJECTIVE_WORD_BANK = [
  {
    type: "context",
    subject: "boy",
    correct: "big",
    sentence: "The boy is ____.",
    options: ["big", "small", "tall"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "small",
    sentence: "The boy is ____.",
    options: ["small", "big", "short"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "tall",
    sentence: "The boy is ____.",
    options: ["tall", "short", "big"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "short",
    sentence: "The boy is ____.",
    options: ["short", "tall", "small"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "fast",
    sentence: "The boy is running ____.",
    options: ["fast", "slow", "happy"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "slow",
    sentence: "The boy is running ____.",
    options: ["slow", "fast", "sad"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "happy",
    sentence: "The boy is feeling ____.",
    options: ["happy", "sad", "clean"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "sad",
    sentence: "The boy is feeling ____.",
    options: ["sad", "happy", "slow"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "hot",
    sentence: "The boy feels ____.",
    options: ["hot", "cold", "wet"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "cold",
    sentence: "The boy feels ____.",
    options: ["cold", "hot", "clean"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "wet",
    sentence: "The boy is ____.",
    options: ["wet", "dirty", "clean"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "dirty",
    sentence: "The boy is ____.",
    options: ["dirty", "wet", "clean"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "clean",
    sentence: "The boy is ____.",
    options: ["clean", "dirty", "wet"],
  },
];

export const QUESTION_BANKS = {
  verbs: VERB_WORD_BANK,
  adjectives: ADJECTIVE_WORD_BANK,
};

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createQuestionDeck(category = "verbs") {
  if (category === "random") {
    const mixed = [
      ...QUESTION_BANKS.verbs.map((entry) => ({ ...entry, category: "verbs" })),
      ...QUESTION_BANKS.adjectives.map((entry) => ({ ...entry, category: "adjectives" })),
    ];
    return shuffle(mixed);
  }

  const list = QUESTION_BANKS[category] ?? QUESTION_BANKS.verbs;
  return shuffle(list).map((entry) => ({ ...entry, category }));
}

export function buildQuestionPrompt(entry) {
  const options = shuffle(entry.options);
  const sentence = entry.sentence ?? `The ${entry.subject} is ____.`;
  const category = entry.category ?? "verbs";

  return {
    type: "fillBlank",
    category,
    categoryLabel: category === "adjectives" ? "Adjectives" : category === "random" ? "Random" : "Verbs",
    subject: entry.subject,
    correctAnswer: entry.correct,
    options,
    sentence,
    instruction: "",
    speechText: sentence.replace("____", "blank"),
    speechWord: entry.correct,
  };
}
