export const WORD_BANK = [
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
    subject: "hero",
    correct: "flying",
    sentence: "The hero is ____.",
    options: ["flying", "running", "jumping"],
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
    subject: "cat",
    correct: "hiding",
    sentence: "The cat is ____.",
    options: ["hiding", "running", "sleeping"],
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
    options: ["crying", "smiling", "talking"],
  },
  {
    type: "context",
    subject: "hero",
    correct: "smiling",
    sentence: "The hero is ____.",
    options: ["smiling", "crying", "looking"],
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
    options: ["talking", "smiling", "waving"],
  },
  {
    type: "context",
    subject: "cat",
    correct: "looking",
    sentence: "The cat is ____.",
    options: ["looking", "hiding", "sleeping"],
  },
  {
    type: "context",
    subject: "boy",
    correct: "sliding",
    sentence: "The boy is ____.",
    options: ["sliding", "walking", "running"],
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
    options: ["brushing", "washing", "smiling"],
  },
];

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createQuestionDeck() {
  return shuffle(WORD_BANK);
}

export function buildQuestionPrompt(entry) {
  const options = shuffle(entry.options);
  const sentence = entry.sentence ?? `The ${entry.subject} is ____.`;

  return {
    type: "fillBlank",
    subject: entry.subject,
    correctAnswer: entry.correct,
    options,
    sentence,
    instruction: "",
    speechText: sentence.replace("____", "blank"),
    speechWord: entry.correct,
  };
}
