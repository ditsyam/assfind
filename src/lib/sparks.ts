import { PromptSpark } from '../types';

export const PROMPT_SPARKS: PromptSpark[] = [
  {
    id: 'daily-clarity',
    category: 'Mindfulness',
    title: 'Daily Mindfulness & Mood Check',
    description: 'Tune into your current emotional state, energy level, and headspace.',
    promptText: 'Today I am noticing that I feel... My energy is currently at... The biggest thing occupying my mind right now is...',
  },
  {
    id: 'decision-making',
    category: 'Problem Solving',
    title: 'Decision Dilemma & Clarity',
    description: 'Unpack competing options, fears, and optimal outcomes for a tough choice.',
    promptText: 'I am facing a decision about... The pros and cons seem to be... What I am most afraid of is... If I trusted my intuition, I would...',
  },
  {
    id: 'creative-brainstorm',
    category: 'Brainstorming',
    title: 'Creative Idea Sandbox',
    description: 'Explore a fresh concept, product idea, or story with Gemini.',
    promptText: 'I have a new idea that I want to brainstorm: [Describe concept]. Who could this help, and what are 3 unconventional angles to explore?',
  },
  {
    id: 'gratitude-wins',
    category: 'Gratitude',
    title: 'Wins & Gratitude Anchor',
    description: 'Cement positive momentum by documenting progress and appreciations.',
    promptText: 'Three things that went unexpectedly well today: 1) ... 2) ... 3) ... Someone I appreciate right now is...',
  },
  {
    id: 'growth-learning',
    category: 'Growth',
    title: 'Obstacle to Learning Loop',
    description: 'Transform a recent setback or friction point into actionable wisdom.',
    promptText: 'A challenge I encountered recently was... What made it difficult was... If I look at this as a learning opportunity, the key lesson is...',
  },
];
