// Reactive roleplay engine.
// Generates the customer's / prospect's next line based on what the VA actually said,
// instead of a fixed script. Fully client-side (no API key needed).

export interface CustomerReply {
  text: string;
  emotion: string;
  resolved: boolean;
}

type Tier = 'silence' | 'poor' | 'weak' | 'partial' | 'neutral' | 'good' | 'strong';

// Emotion ordering from most negative (0) to most positive (5).
const EMOTION_LEVEL: Record<string, number> = {
  angry: 0, demanding: 0, distressed: 0, condescending: 0,
  frustrated: 1, impatient: 1, urgent: 1, dismissive: 1,
  skeptical: 2, confused: 2, anxious: 2, evasive: 2, firm: 2, disappointed: 2, rushed: 2,
  professional: 3, polite: 3, casual: 3,
  interested: 4, hopeful: 4,
  satisfied: 5, excited: 5,
};

const LEVEL_EMOTIONS: Record<number, string[]> = {
  0: ['angry', 'demanding'],
  1: ['frustrated', 'impatient'],
  2: ['skeptical', 'confused', 'disappointed'],
  3: ['polite', 'professional'],
  4: ['interested', 'hopeful'],
  5: ['satisfied'],
};

function levelToEmotion(level: number, seed: number, salesFlavor: boolean): string {
  const clamped = Math.max(0, Math.min(5, level));
  const pool = LEVEL_EMOTIONS[clamped];
  // Prospects skew skeptical rather than confused at the mid level.
  if (salesFlavor && clamped === 2) return 'skeptical';
  return pool[seed % pool.length];
}

function analyzeVA(vaResponse: string) {
  const raw = vaResponse.trim();
  const t = raw.toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);
  const empty = !/[a-z]/i.test(raw) || words.length === 0;
  const veryShort = !empty && words.length < 6;
  const hasEmpathy = /(sorry|apolog|understand|i hear|i get|frustrat|appreciate|patience|i know how|that must|i realize|i can see)/.test(t);
  const hasSolution = /(i'?ll|i will|i can|let me|we can|we'?ll|here'?s what|i'?m going to|next step|make sure|refund|replace|escalate|resolve|fix|process|send|schedule|set up|arrange|follow up|take care|sort (?:this|it) out|get this|check on|look into)/.test(t);
  const hasQuestion = /\?/.test(raw) || /^(can|could|would|may|what|when|where|how|which|do you|are you|is there)\b/.test(t) || /(could you|can you|may i ask|to confirm|just to clarify|help me understand|tell me more)/.test(t);
  const deflect = /(not my (job|department|problem)|can'?t help|nothing i can do|that'?s not possible|it'?s (?:the |our )?policy|you'?ll (?:just )?have to|not my fault|calm down|there'?s nothing)/.test(t);
  return { empty, veryShort, hasEmpathy, hasSolution, hasQuestion, deflect };
}

function classify(vaResponse: string): Tier {
  const a = analyzeVA(vaResponse);
  if (a.empty) return 'silence';
  if (a.deflect) return 'poor';
  if (a.hasEmpathy && a.hasSolution) return 'strong';
  if (a.hasSolution) return 'good';
  if (a.hasEmpathy && !a.veryShort) return 'partial';
  if (a.veryShort) return 'weak';
  return 'neutral';
}

// Reply pools by tier. Sales/prospect variants used for cold-call / SDR scenarios.
const SERVICE_LINES: Record<Tier, string[]> = {
  silence: [
    "Hello? Are you still there? I asked you a question.",
    "Um... is anyone going to say something? I need help here.",
    "I can't hear a response. Is this line even working?",
  ],
  poor: [
    "That's not good enough. I didn't call to be told what you can't do.",
    "Excuse me? So you're just not going to help me?",
    "That's exactly why I'm calling you — so don't tell me it's my problem. I'd like a supervisor.",
  ],
  weak: [
    "Okay... but that doesn't really tell me anything. Can you be more specific?",
    "That's a bit vague. What are you actually going to do about it?",
    "I'm going to need more than that. Can you explain what happens now?",
  ],
  partial: [
    "I appreciate you saying that, but what are you actually going to do to fix it?",
    "Thanks for understanding, but I still need this resolved. What's the next step?",
    "That's kind of you, but sympathy doesn't solve my problem. What now?",
  ],
  neutral: [
    "Alright. And what would you recommend I do next?",
    "Okay. Can you walk me through how that works?",
    "I see. Is there anything else I should know?",
  ],
  good: [
    "Okay, that sounds reasonable. How long will that take?",
    "Alright, I can work with that. What do you need from me?",
    "That helps. Can you confirm that for me in writing?",
  ],
  strong: [
    "Oh, thank you — that's exactly what I needed to hear. I really appreciate your help.",
    "Okay, that actually makes me feel a lot better. Thank you for sorting this out.",
    "Honestly, I wasn't expecting this to go so smoothly. Thank you.",
  ],
};

const SALES_LINES: Record<Tier, string[]> = {
  silence: [
    "Hello? Did I lose you? I don't have all day.",
    "Are you still there? If you called me, at least say something.",
    "I can't hear anything. I'm going to hang up if no one's there.",
  ],
  poor: [
    "Like I said, just email me. I really don't have time for this.",
    "I'm not interested. Please take me off your list.",
    "You're not giving me a reason to keep listening. I'm going to go.",
  ],
  weak: [
    "I still don't see why this is relevant to me. Can you get to the point?",
    "You haven't told me anything that makes me want to keep listening.",
    "That's pretty generic. What do you actually do?",
  ],
  partial: [
    "That's a nice pitch, but why should I care?",
    "I hear you, but what's actually in it for my team?",
    "Okay, you understand my situation — so what are you proposing?",
  ],
  neutral: [
    "Alright. And how is this different from what we already use?",
    "Okay. What would the next step even look like?",
    "I see. How much does something like this run?",
  ],
  good: [
    "Okay, you've got my attention. How exactly does it work?",
    "Alright, that's mildly interesting. What would you need from me?",
    "That's not bad. Can you send me something concrete?",
  ],
  strong: [
    "You know what, that does sound useful. Send me a calendar invite for next week.",
    "Okay, I'm willing to do a 20-minute call. You've made a good case.",
    "Alright, book the meeting. I'd like my team to hear this.",
  ],
};

// Firmer wrap-up lines when the conversation ends unresolved.
const SERVICE_UNRESOLVED = [
  "This still isn't resolved. I'll be following up, and I'm not happy about it.",
  "I don't feel like this got handled. I'd like a reference number and a supervisor's name.",
];
const SALES_UNRESOLVED = [
  "I've heard enough. If I'm interested, I'll reach out. Goodbye.",
  "This isn't for us right now. Please don't call again.",
];

function hashSeed(s: string, turn: number): number {
  let h = turn * 7 + 13;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h;
}

export function generateCustomerReply(params: {
  vaResponse: string;
  currentEmotion: string;
  scenarioContext?: string;
  scenarioEmotion?: string;
  positionCategory?: string;
  turn: number;
  isFinalTurn?: boolean;
}): CustomerReply {
  const { vaResponse, currentEmotion, scenarioContext, positionCategory, turn, isFinalTurn } = params;
  const salesFlavor = /sales|cold|sdr|prospect|appointment/i.test(
    `${positionCategory ?? ''} ${scenarioContext ?? ''}`,
  );
  const tier = classify(vaResponse);
  const seed = hashSeed(vaResponse, turn);

  // Move the emotion based on how well the VA handled the turn.
  const currentLevel = EMOTION_LEVEL[currentEmotion] ?? 1;
  const delta: Record<Tier, number> = {
    silence: -1, poor: -1, weak: 0, neutral: 0, partial: 1, good: 1, strong: 2,
  };
  // Silence never lets the emotion sit above "frustrated".
  let newLevel = currentLevel + delta[tier];
  if (tier === 'silence') newLevel = Math.min(newLevel, 1);
  newLevel = Math.max(0, Math.min(5, newLevel));

  const resolved =
    tier === 'strong' && (turn >= 1 || newLevel >= 5)
      ? true
      : newLevel >= 5;

  const pool = salesFlavor ? SALES_LINES : SERVICE_LINES;
  let text: string;
  let emotion: string;

  if (isFinalTurn && !resolved && (tier === 'silence' || tier === 'poor' || tier === 'weak')) {
    const wrap = salesFlavor ? SALES_UNRESOLVED : SERVICE_UNRESOLVED;
    text = wrap[seed % wrap.length];
    emotion = salesFlavor ? 'dismissive' : 'disappointed';
  } else {
    const lines = pool[tier];
    text = lines[seed % lines.length];
    // Keep the emotion label coherent with the reply's tone.
    let displayLevel = newLevel;
    if (tier === 'strong') displayLevel = Math.max(displayLevel, 4);
    else if (tier === 'good') displayLevel = Math.max(displayLevel, 3);
    else if (tier === 'partial') displayLevel = Math.max(displayLevel, 2);
    emotion = resolved ? 'satisfied' : levelToEmotion(displayLevel, seed, salesFlavor);
  }

  return { text, emotion, resolved };
}
