import { getPosition, type PositionId } from '../../lib/positionBank';
import type { CourseModule, Lesson, Quiz, QuizQuestion, PracticeActivity } from '../types/learning';

// ---------------------------------------------------------------------------
// Small builders
// ---------------------------------------------------------------------------

function q(id: string, question: string, options: string[], correctIndex: number, explanation: string): QuizQuestion {
  return { id, question, options, correctIndex, explanation };
}

// Distractor skills for the role-competency question (deliberately from other domains).
const DISTRACTOR_SKILLS = [
  'Designing website wireframes',
  'Writing marketing ad copy',
  'Editing promotional videos',
  'Managing warehouse inventory',
  'Building financial forecasts',
];

function roleCompetencyQuestion(id: string, label: string, competencies: string[]): QuizQuestion {
  const correct = competencies[0] ?? 'Clear communication';
  const distractors = DISTRACTOR_SKILLS.filter((d) => !competencies.includes(d)).slice(0, 3);
  const options = [correct, ...distractors];
  return q(
    id,
    `Which of these is a core competency for the ${label} role?`,
    options,
    0,
    `${correct} is central to succeeding as a ${label}.`,
  );
}

// ---------------------------------------------------------------------------
// Shared communication quiz banks (reused across every role path)
// ---------------------------------------------------------------------------

const FOUNDATION_QUIZ_BASE: QuizQuestion[] = [
  q('fq1', 'What is the most professional way to open a call with a new contact?',
    ['Immediately launch into your pitch', 'Greet them, introduce yourself, and state your purpose briefly', 'Ask for personal information first', 'Wait silently for them to speak'],
    1, 'A clear greeting, your name, and a brief purpose set a professional tone and build trust.'),
  q('fq2', 'Active listening on a call primarily means:',
    ['Planning your next sentence while they talk', 'Interrupting to save time', 'Focusing fully, then confirming your understanding', 'Taking the call on speaker'],
    2, 'Active listening means giving full attention and reflecting back what you heard to confirm understanding.'),
];

const CORE_QUIZ_BASE: QuizQuestion[] = [
  q('cq1', 'Which sentence is clearest and most professional?',
    ['Yeah so the thing is kinda broken I guess', 'Your account shows a billing error, and I can fix it now.', 'Idk what happened but maybe try later', 'It is what it is, sorry'],
    1, 'Clear, specific, and solution-oriented language reads as professional and competent.'),
  q('cq2', 'A good way to keep a steady, confident speaking pace is to:',
    ['Talk as fast as possible', 'Use frequent filler words', 'Pause briefly at commas and periods', 'Lower your volume until inaudible'],
    2, 'Natural pauses at punctuation project confidence and make you easier to understand.'),
];

const SCENARIO_QUIZ_BASE: QuizQuestion[] = [
  q('sq1', 'A customer is upset and raising their voice. Your first move should be to:',
    ['Match their energy and argue back', 'Stay calm, acknowledge their frustration, and listen', 'Put them on hold immediately', 'End the call'],
    1, 'De-escalation starts with staying calm and showing the person they have been heard.'),
  q('sq2', 'When you do not know the answer to a customer question, the best response is to:',
    ['Guess confidently', 'Say it is not your job', 'Acknowledge it and commit to finding out', 'Ignore the question'],
    2, 'Honesty plus a clear commitment to follow up preserves trust.'),
];

const INTERVIEW_QUIZ_BASE: QuizQuestion[] = [
  q('iq1', 'The STAR method structures an answer as:',
    ['Situation, Task, Action, Result', 'Start, Talk, Ask, Repeat', 'Story, Theme, Angle, Reason', 'Setup, Tone, Answer, Rest'],
    0, 'STAR — Situation, Task, Action, Result — gives interview answers a clear, complete structure.'),
  q('iq2', 'A strong interview answer usually includes:',
    ['A vague generalization', 'A specific example with a measurable outcome', 'Only your job title', 'A one-word reply'],
    1, 'Concrete examples with outcomes are far more convincing than generalizations.'),
];

// ---------------------------------------------------------------------------
// Role module factory
// ---------------------------------------------------------------------------

function insuranceRole(category: string): boolean {
  return category.toLowerCase().includes('insurance');
}

export function buildRoleModules(positionId: PositionId): CourseModule[] {
  const cfg = getPosition(positionId);
  const label = cfg.label;
  const comp = cfg.keyCompetencies;
  const coaching = cfg.coachingFocus;
  const roleplay = cfg.roleplayScenarios;
  const listening = cfg.listeningScenarios;
  const interview = cfg.interviewQuestions;

  const flashcards: PracticeActivity = {
    id: `${positionId}-m1-flash`,
    title: 'Key competency flashcards',
    kind: 'flashcards',
    instructions: 'Review the core competencies for this role.',
    terms: comp.map((c) => ({ term: c, definition: `A core skill expected of a ${label}.` })),
  };

  // ---- Module 1: Foundations ----
  const m1Lessons: Lesson[] = [
    {
      id: `${positionId}-m1-l1`,
      title: `What the ${label} role demands`,
      summary: `Understand the purpose and expectations of the ${label} role.`,
      estimatedMinutes: 6,
      blocks: [
        { type: 'concept', title: 'Role overview', body: cfg.description },
        { type: 'keyTerms', title: 'Core competencies', items: comp },
        { type: 'tip', title: 'Coaching focus', body: coaching[0] ?? 'Communicate clearly and professionally.' },
      ],
    },
    {
      id: `${positionId}-m1-l2`,
      title: 'The vocabulary of the role',
      summary: 'Learn the language and mindset that signal competence.',
      estimatedMinutes: 6,
      blocks: [
        { type: 'concept', title: 'Speak the part', body: `Employers listen for role-specific fluency. Use the vocabulary of a ${label} naturally and confidently.` },
        { type: 'keyTerms', title: 'Focus areas', items: coaching },
      ],
    },
  ];
  const m1Quiz: Quiz = {
    id: `${positionId}-m1-quiz`, title: 'Foundations check', passingScore: 70,
    questions: [...FOUNDATION_QUIZ_BASE, roleCompetencyQuestion(`${positionId}-m1-rq`, label, comp)],
  };
  const m1: CourseModule = {
    id: `${positionId}-m1`,
    title: `Foundations of the ${label} Role`,
    objectives: [
      `Explain what a ${label} does day to day`,
      `Recognize the core competencies: ${comp.slice(0, 3).join(', ')}`,
      'Adopt role-appropriate vocabulary and tone',
    ],
    estimatedMinutes: 28,
    lessons: m1Lessons,
    practice: [flashcards],
    quiz: m1Quiz,
    simulation: { moduleNumber: 1, moduleName: 'Listening Comprehension', minScore: 55, description: 'Prove you can follow a role-relevant conversation accurately.' },
    xpReward: 50,
  };

  // ---- Module 2: Core Communication ----
  const m2Lessons: Lesson[] = [
    {
      id: `${positionId}-m2-l1`,
      title: 'Clarity and structure',
      summary: 'Say more with fewer, clearer words.',
      estimatedMinutes: 7,
      blocks: [
        { type: 'concept', title: 'Structure your message', body: 'Lead with the point, support it with one clear reason or step, and close with a next action. Avoid rambling and filler words.' },
        { type: 'example', title: 'Weak vs strong', items: ['Weak: "Um, so yeah, the thing is maybe kind of an issue."', 'Strong: "There is a billing error on your account, and I can correct it right now."'] },
      ],
    },
    {
      id: `${positionId}-m2-l2`,
      title: 'Tone and professionalism',
      summary: `Project warmth and competence as a ${label}.`,
      estimatedMinutes: 7,
      blocks: [
        { type: 'concept', title: 'Warm and competent', body: 'A professional tone is calm, positive, and respectful even under pressure. Smile while you speak — it changes your voice.' },
        { type: 'tip', title: 'For this role', body: coaching[1] ?? coaching[0] ?? 'Keep a steady, reassuring tone.' },
      ],
    },
  ];
  const m2Quiz: Quiz = {
    id: `${positionId}-m2-quiz`, title: 'Communication check', passingScore: 70,
    questions: [...CORE_QUIZ_BASE, roleCompetencyQuestion(`${positionId}-m2-rq`, label, comp)],
  };
  const m2: CourseModule = {
    id: `${positionId}-m2`,
    title: 'Core Communication Skills',
    objectives: ['Structure a clear, concise message', 'Maintain a warm, professional tone', 'Reduce filler words and hesitations'],
    estimatedMinutes: 30,
    lessons: m2Lessons,
    practice: [{ id: `${positionId}-m2-drill`, title: 'Read-aloud drill', kind: 'prompt', instructions: 'Record yourself reading a short professional script at a steady pace.', prompt: 'Thank you for calling. My name is Alex — may I ask who I have the pleasure of speaking with today?' }],
    quiz: m2Quiz,
    simulation: { moduleNumber: 3, moduleName: 'Reading Aloud', minScore: 60, description: 'Read a role script aloud with clear pronunciation and natural pacing.' },
    xpReward: 50,
  };

  // ---- Module 3: Scenario Mastery ----
  const scenarioItems = roleplay.slice(0, 3).map((r) => `Customer: "${r.customerLine}" — respond with empathy, then a concrete next step.`);
  const listeningItems = listening.slice(0, 2).map((l) => `${l.context}: ${l.script}`);
  const m3Lessons: Lesson[] = [
    {
      id: `${positionId}-m3-l1`,
      title: 'Handling real scenarios',
      summary: 'Apply a repeatable framework to tough moments.',
      estimatedMinutes: 8,
      blocks: [
        { type: 'concept', title: 'Acknowledge → Solve → Confirm', body: 'Acknowledge the person\'s situation, offer a concrete solution or next step, then confirm they are satisfied. This works whether the person is upset, rushed, or unsure.' },
        { type: 'example', title: 'Practice lines', items: scenarioItems.length ? scenarioItems : ['Acknowledge, solve, and confirm on every interaction.'] },
      ],
    },
    {
      id: `${positionId}-m3-l2`,
      title: 'Active listening in context',
      summary: 'Catch the details that matter and reflect them back.',
      estimatedMinutes: 7,
      blocks: [
        { type: 'concept', title: 'Listen for specifics', body: 'Names, numbers, dates, and the real request hide inside long messages. Note them and repeat them back to confirm.' },
        { type: 'script', title: 'Listen carefully', items: listeningItems.length ? listeningItems : ['Reflect back the key details you hear to confirm understanding.'] },
      ],
    },
  ];
  const m3Quiz: Quiz = {
    id: `${positionId}-m3-quiz`, title: 'Scenario check', passingScore: 70,
    questions: [...SCENARIO_QUIZ_BASE, roleCompetencyQuestion(`${positionId}-m3-rq`, label, comp)],
  };
  const m3: CourseModule = {
    id: `${positionId}-m3`,
    title: 'Scenario Mastery',
    objectives: ['Use the Acknowledge → Solve → Confirm framework', 'De-escalate difficult interactions', 'Reflect back key details to confirm understanding'],
    estimatedMinutes: 32,
    lessons: m3Lessons,
    practice: [{ id: `${positionId}-m3-drill`, title: 'Scenario response', kind: 'prompt', instructions: 'Read the customer line, then say your response out loud.', prompt: roleplay[0]?.customerLine ?? 'I need help and I am not happy about how long this has taken.' }],
    quiz: m3Quiz,
    simulation: { moduleNumber: 5, moduleName: 'Customer Roleplay', minScore: 60, description: 'Handle a live, reactive roleplay where the customer responds to what you say.' },
    xpReward: 50,
  };

  // ---- Module 4: Interview & Assessment (capstone) ----
  const interviewItems = interview.slice(0, 4);
  const capstoneSim = insuranceRole(cfg.category)
    ? { moduleNumber: 7, moduleName: 'Insurance Communication', minScore: 62, description: 'Demonstrate accurate, clear insurance communication.' }
    : { moduleNumber: 4, moduleName: 'Conversation Simulation', minScore: 62, description: 'Complete an adaptive interview simulation for this role.' };
  const m4Lessons: Lesson[] = [
    {
      id: `${positionId}-m4-l1`,
      title: 'Answering interview questions',
      summary: 'Turn common questions into confident, structured answers.',
      estimatedMinutes: 8,
      blocks: [
        { type: 'concept', title: 'Use STAR', body: 'Situation, Task, Action, Result. Give a real example, what you did, and the outcome. Keep it to 3–5 sentences.' },
        { type: 'example', title: 'Questions to prepare', items: interviewItems.length ? interviewItems : ['Tell me about yourself.', 'Why should we hire you?'] },
      ],
    },
    {
      id: `${positionId}-m4-l2`,
      title: 'Putting it all together',
      summary: 'Combine clarity, tone, listening, and structure under pressure.',
      estimatedMinutes: 6,
      blocks: [
        { type: 'concept', title: 'The complete communicator', body: `A strong ${label} listens closely, speaks clearly, stays warm under pressure, and always moves the conversation toward a resolution.` },
        { type: 'tip', title: 'Before your simulation', body: 'Breathe, slow down, and answer the question that was actually asked.' },
      ],
    },
  ];
  const m4Quiz: Quiz = {
    id: `${positionId}-m4-quiz`, title: 'Interview readiness', passingScore: 70,
    questions: [...INTERVIEW_QUIZ_BASE, roleCompetencyQuestion(`${positionId}-m4-rq`, label, comp)],
  };
  const m4: CourseModule = {
    id: `${positionId}-m4`,
    title: 'Interview & Assessment',
    objectives: ['Answer interview questions using STAR', 'Integrate every communication skill under pressure', `Meet the readiness bar for the ${label} role`],
    estimatedMinutes: 34,
    lessons: m4Lessons,
    practice: [{ id: `${positionId}-m4-drill`, title: 'Mock answer', kind: 'prompt', instructions: 'Answer this out loud using the STAR method.', prompt: interview[0] ?? 'Tell me about yourself and your experience.' }],
    quiz: m4Quiz,
    simulation: capstoneSim,
    xpReward: 50,
  };

  return [m1, m2, m3, m4];
}

// ---------------------------------------------------------------------------
// Foundational "General English Communication" path (role-agnostic, authored)
// ---------------------------------------------------------------------------

export const FOUNDATIONAL_MODULES: CourseModule[] = [
  {
    id: 'english-m1',
    title: 'Grammar Essentials',
    objectives: ['Use correct subject–verb agreement', 'Form clear past, present, and future tenses', 'Build complete, well-ordered sentences'],
    estimatedMinutes: 30,
    lessons: [
      {
        id: 'english-m1-l1', title: 'Sentence building blocks', summary: 'Subjects, verbs, and objects in the right order.', estimatedMinutes: 8,
        blocks: [
          { type: 'concept', title: 'The core pattern', body: 'Most English sentences follow Subject → Verb → Object: "I (subject) processed (verb) the request (object)." Keep that order for clarity.' },
          { type: 'example', title: 'Fix the order', items: ['Unclear: "The request I processed yesterday it was."', 'Clear: "I processed the request yesterday."'] },
        ],
      },
      {
        id: 'english-m1-l2', title: 'Tenses that matter at work', summary: 'Talk about what you did, do, and will do.', estimatedMinutes: 7,
        blocks: [
          { type: 'concept', title: 'Past, present, future', body: 'Past: "I helped a customer." Present: "I help customers." Future: "I will help you now." Match the tense to the time you mean.' },
          { type: 'tip', title: 'Common trap', body: 'Say "I have worked here for two years" (not "I am working here since two years").' },
        ],
      },
    ],
    practice: [{ id: 'english-m1-flash', title: 'Tense flashcards', kind: 'flashcards', instructions: 'Match each sentence to the right tense.', terms: [{ term: 'I called the client.', definition: 'Past simple' }, { term: 'I am calling the client.', definition: 'Present continuous' }, { term: 'I will call the client.', definition: 'Future simple' }] }],
    quiz: {
      id: 'english-m1-quiz', title: 'Grammar check', passingScore: 70, questions: [
        q('em1q1', 'Choose the correct sentence:', ['She don\'t have the file.', 'She doesn\'t have the file.', 'She not have the file.', 'She haven\'t the file.'], 1, 'Third-person singular uses "doesn\'t".'),
        q('em1q2', 'Which is correct?', ['I have worked here since two years.', 'I am working here for two years.', 'I have worked here for two years.', 'I working here two years.'], 2, 'Present perfect + "for" + duration is correct.'),
        q('em1q3', 'Pick the clearest sentence:', ['The email yesterday I sent it.', 'I sent the email yesterday.', 'Yesterday email sent I.', 'Sent I the email yesterday.'], 1, 'Subject–verb–object in natural order reads clearest.'),
      ],
    },
    simulation: { moduleNumber: 3, moduleName: 'Reading Aloud', minScore: 55, description: 'Read a short passage aloud with correct, natural delivery.' },
    xpReward: 50,
  },
  {
    id: 'english-m2',
    title: 'Pronunciation & Clarity',
    objectives: ['Articulate difficult sounds clearly', 'Control pace and volume', 'Be understood on the first try'],
    estimatedMinutes: 28,
    lessons: [
      {
        id: 'english-m2-l1', title: 'Sounds that trip people up', summary: 'Target the sounds that most affect clarity.', estimatedMinutes: 7,
        blocks: [
          { type: 'concept', title: 'Clarity over accent', body: 'You do not need a "perfect" accent — you need to be clearly understood. Focus on finishing word endings and separating similar sounds.' },
          { type: 'example', title: 'Practice pairs', items: ['th vs t: "three" vs "tree"', 'v vs b: "vote" vs "boat"', 'Word endings: "asked", "helped", "called"'] },
        ],
      },
      {
        id: 'english-m2-l2', title: 'Pace, pausing, and volume', summary: 'The delivery habits that make you sound confident.', estimatedMinutes: 6,
        blocks: [
          { type: 'concept', title: 'Slow is clear', body: 'Aim for about 130–160 words per minute. Pause at commas and periods. A steady pace projects confidence and reduces mistakes.' },
          { type: 'tip', title: 'Try this', body: 'Record one sentence, listen back, and check: could a stranger understand every word?' },
        ],
      },
    ],
    practice: [{ id: 'english-m2-drill', title: 'Minimal pairs', kind: 'prompt', instructions: 'Say each pair clearly and distinctly.', prompt: 'three / tree · vote / boat · thirty / dirty · very / berry' }],
    quiz: {
      id: 'english-m2-quiz', title: 'Clarity check', passingScore: 70, questions: [
        q('em2q1', 'A good speaking pace for clarity is about:', ['60 words per minute', '130–160 words per minute', '220 words per minute', 'As fast as possible'], 1, '130–160 wpm is clear and natural.'),
        q('em2q2', 'To sound confident and clear you should:', ['Skip word endings', 'Pause at commas and periods', 'Speak as quietly as possible', 'Run words together'], 1, 'Pausing at punctuation aids clarity and confidence.'),
        q('em2q3', 'Clear pronunciation mainly means:', ['Copying a specific accent perfectly', 'Being easily understood', 'Speaking louder than others', 'Using big words'], 1, 'The goal is to be understood, not to erase your accent.'),
      ],
    },
    simulation: { moduleNumber: 2, moduleName: 'Pronunciation Assessment', minScore: 55, description: 'Pronounce target sentences clearly and accurately.' },
    xpReward: 50,
  },
  {
    id: 'english-m3',
    title: 'Fluency & Conversation',
    objectives: ['Reduce filler words and long pauses', 'Keep a conversation flowing', 'Think and respond in English in real time'],
    estimatedMinutes: 30,
    lessons: [
      {
        id: 'english-m3-l1', title: 'Cutting filler words', summary: 'Replace "um" and "like" with confident pauses.', estimatedMinutes: 7,
        blocks: [
          { type: 'concept', title: 'Silence beats filler', body: 'A short silent pause sounds more confident than "um, uh, like". When you need a moment, simply pause.' },
          { type: 'example', title: 'Swap it', items: ['Instead of: "Um, like, I guess I can help?"', 'Say: "Yes — I can help you with that."'] },
        ],
      },
      {
        id: 'english-m3-l2', title: 'Keeping the conversation moving', summary: 'Bridge phrases and follow-up questions.', estimatedMinutes: 7,
        blocks: [
          { type: 'concept', title: 'Bridges and questions', body: 'Use short bridges ("Let me check that for you") and follow-up questions ("Can you tell me a bit more?") to keep momentum and show engagement.' },
          { type: 'tip', title: 'Buy thinking time', body: 'Repeat the question in your own words while you think: "So you\'d like to..."' },
        ],
      },
    ],
    practice: [{ id: 'english-m3-drill', title: 'No-filler challenge', kind: 'prompt', instructions: 'Answer out loud with zero filler words.', prompt: 'Tell me about something you did well this week.' }],
    quiz: {
      id: 'english-m3-quiz', title: 'Fluency check', passingScore: 70, questions: [
        q('em3q1', 'A confident alternative to "um" is:', ['A longer "ummmm"', 'A brief silent pause', 'Saying "like" instead', 'Talking faster'], 1, 'A brief pause sounds more composed than filler.'),
        q('em3q2', 'A good bridge phrase to keep a call moving is:', ['"I don\'t know, bye."', '"Let me check that for you."', 'Silence for 20 seconds', '"That\'s not my job."'], 1, 'Bridges keep momentum and show you are engaged.'),
        q('em3q3', 'To buy yourself thinking time, you can:', ['Hang up', 'Repeat the question in your own words', 'Change the subject', 'Say nothing at all'], 1, 'Paraphrasing the question buys time and confirms understanding.'),
      ],
    },
    simulation: { moduleNumber: 4, moduleName: 'Conversation Simulation', minScore: 55, description: 'Hold an adaptive conversation with natural flow.' },
    xpReward: 50,
  },
  {
    id: 'english-m4',
    title: 'Professional Communication',
    objectives: ['Handle difficult conversations calmly', 'Sound warm and professional', 'Close interactions with a clear next step'],
    estimatedMinutes: 32,
    lessons: [
      {
        id: 'english-m4-l1', title: 'Warmth and professionalism', summary: 'The tone that builds trust fast.', estimatedMinutes: 7,
        blocks: [
          { type: 'concept', title: 'Warm + competent', body: 'People trust communicators who are both warm (kind, attentive) and competent (clear, capable). Aim for both in every interaction.' },
          { type: 'example', title: 'Professional phrasing', items: ['"I completely understand, and here is what I can do."', '"Thank you for your patience — let me sort this out for you."'] },
        ],
      },
      {
        id: 'english-m4-l2', title: 'Difficult conversations', summary: 'Stay calm and lead to a resolution.', estimatedMinutes: 7,
        blocks: [
          { type: 'concept', title: 'Acknowledge, solve, confirm', body: 'When someone is upset: acknowledge how they feel, offer a concrete solution, and confirm they are satisfied before closing.' },
          { type: 'tip', title: 'Always close', body: 'End with a clear next step: "I\'ve done X, and you\'ll receive Y by Friday. Is there anything else I can help with?"' },
        ],
      },
    ],
    practice: [{ id: 'english-m4-drill', title: 'De-escalation', kind: 'prompt', instructions: 'Respond calmly and professionally.', prompt: 'This is the third time I\'ve called about this and nobody has fixed it!' }],
    quiz: {
      id: 'english-m4-quiz', title: 'Professionalism check', passingScore: 70, questions: [
        q('em4q1', 'When a customer is upset, start by:', ['Defending yourself', 'Acknowledging how they feel', 'Transferring them', 'Talking over them'], 1, 'Acknowledging feelings de-escalates and builds trust.'),
        q('em4q2', 'A professional way to close an interaction is:', ['Hang up quickly', 'State the next step and ask if they need anything else', 'Say "bye" and disconnect', 'Leave it open-ended'], 1, 'Clear next steps leave a professional final impression.'),
        q('em4q3', 'Being "warm and competent" means:', ['Only being friendly', 'Only being efficient', 'Being kind and clearly capable', 'Being neither'], 2, 'The most trusted communicators are both warm and competent.'),
      ],
    },
    simulation: { moduleNumber: 5, moduleName: 'Customer Roleplay', minScore: 55, description: 'Handle a reactive roleplay with a calm, professional tone.' },
    xpReward: 50,
  },
];
