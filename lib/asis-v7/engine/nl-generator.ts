/**
 * ASIS v7 Natural Language Generator
 * Converts synthesized responses into human-readable text
 * Kamos Theory: language = interaction pattern
 */

import { SynthesizedResponse, ContextVector, ASISPersonality } from '../types';

// ─── Response Templates ───────────────────────────────────────

const RESPONSE_TEMPLATES: Record<string, string[]> = {
  greeting: [
    "Hello! How can I help you today?",
    "Hi there! What can I do for you?",
    "Welcome! I am ASIS, your AI assistant.",
  ],
  farewell: [
    "Goodbye! Have a great day!",
    "See you later! Let me know if you need anything else.",
    "Take care! I am here whenever you need me.",
  ],
  weather: [
    "The weather in {location} is {condition} with a temperature of {temperature}.",
    "Currently in {location}: {condition}, {temperature}.",
    "{location} weather update: {condition} at {temperature}.",
  ],
  news: [
    "Here are the latest headlines: {headlines}",
    "Top stories: {headlines}",
    "Breaking news: {headlines}",
  ],
  search: [
    "I found {count} results for your query. {summary}",
    "Here is what I found: {summary}",
    "Search complete. {summary}",
  ],
  code: [
    "Here is the code you requested in {language}: {code}",
    "I have generated the {language} code: {code}",
    "Here is a {language} solution: {code}",
  ],
  math: [
    "The result is {result}.",
    "Calculated: {result}",
    "Answer: {result}",
  ],
  database: [
    "Here is your data: {data}",
    "Query result: {data}",
    "Database response: {data}",
  ],
  shell: [
    "Command executed. Output: {output}",
    "Result: {output}",
    "Execution complete: {output}",
  ],
  error: [
    "I encountered an issue: {error}",
    "Something went wrong: {error}",
    "Error: {error}. Please try again.",
  ],
  unknown: [
    "I am not sure I understand. Could you rephrase?",
    "I did not catch that. Can you clarify?",
    "I am still learning. Could you explain differently?",
  ],
  translation: [
    "Translation: {translation}",
    "In the target language: {translation}",
    "Here is the translation: {translation}",
  ],
  definition: [
    "{term}: {definition}",
    "Definition of {term}: {definition}",
    "{term} means {definition}",
  ],
  calculation: [
    "The answer is {result}.",
    "Result: {result}",
    "Calculated value: {result}",
  ],
  help: [
    "I can help you with: web search, weather, news, code generation, math, database queries, and more.",
    "My capabilities include: search, calculations, coding assistance, weather updates, and system commands.",
    "Ask me anything! I can search the web, run calculations, write code, check weather, and query databases.",
  ],
};

const FOLLOWUP_TEMPLATES: Record<string, string[]> = {
  weather: [
    "Would you like a forecast for tomorrow?",
    "Need weather for another location?",
    "Want hourly details?",
  ],
  news: [
    "Would you like more details on any story?",
    "Shall I search for related news?",
    "Want news from a specific source?",
  ],
  search: [
    "Would you like me to refine the search?",
    "Shall I look for more results?",
    "Need a specific type of information?",
  ],
  code: [
    "Would you like me to explain the code?",
    "Need tests for this code?",
    "Want it in a different language?",
  ],
  math: [
    "Need the steps shown?",
    "Want a visual representation?",
    "Shall I solve a related problem?",
  ],
  database: [
    "Would you like to filter the results?",
    "Need a different query?",
    "Want to export this data?",
  ],
  default: [
    "Is there anything else I can help with?",
    "Would you like to explore related topics?",
    "Need assistance with something else?",
  ],
};

// ─── NLGenerator Class ────────────────────────────────────────

export class NLGenerator {
  private personality: ASISPersonality;

  constructor(personality: ASISPersonality) {
    this.personality = personality;
  }

  generate(
    synthesized: SynthesizedResponse,
    intentCategory: string,
    context: ContextVector
  ): string {
    const templates = RESPONSE_TEMPLATES[intentCategory] || RESPONSE_TEMPLATES.unknown;
    const template = this.selectTemplate(templates, synthesized.confidence);

    let response = this.fillTemplate(template, (synthesized as any).data);
    response = this.applyPersonality(response, context);

    if (synthesized.sources && synthesized.sources.length > 0) {
      response += this.formatSources(synthesized.sources);
    }

    return response;
  }

  generateFollowUps(intentCategory: string, _context: ContextVector): string[] {
    const templates = FOLLOWUP_TEMPLATES[intentCategory] || FOLLOWUP_TEMPLATES.default;
    return this.selectRandom(templates, 3);
  }

  generateGreeting(context: ContextVector): string {
    const hour = new Date().getHours();
    let timeGreeting = "Hello";

    if (hour >= 5 && hour < 12) timeGreeting = "Good morning";
    else if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon";
    else if (hour >= 17 && hour < 21) timeGreeting = "Good evening";
    else timeGreeting = "Hello";

    const templates = RESPONSE_TEMPLATES.greeting;
    return timeGreeting + "! " + templates[0];
  }

  generateError(error: string, _context: ContextVector): string {
    const templates = RESPONSE_TEMPLATES.error;
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template.replace(/{error}/g, error);
  }

  private selectTemplate(templates: string[], confidence: number): string {
    if (confidence > 0.8) {
      return templates[0];
    } else if (confidence > 0.5) {
      return templates[1] || templates[0];
    }
    return templates[templates.length - 1] || templates[0];
  }

  private fillTemplate(template: string, data: Record<string, any>): string {
    let filled = template;
    for (const [key, value] of Object.entries(data || {})) {
      const placeholder = "{" + key + "}";
      const stringValue = Array.isArray(value) ? value.join(", ") : String(value ?? "");
      filled = filled.split(placeholder).join(stringValue);
    }
    return filled;
  }

  private applyPersonality(response: string, context: ContextVector): string {
    if (this.personality.verbosity === "concise") {
      const sentences = response.split(".").filter((s: any) => s.trim());
      if (sentences.length > 2) {
        response = sentences.slice(0, 2).join(".") + ".";
      }
    }

    if (this.personality.empathy > 0.7 && context.timeOfDay === "night") {
      response = "I hope you are having a peaceful evening. " + response;
    }

    return response;
  }

  private formatSources(sources: any[]): string {
    if (!sources.length) return "";
    const sourceList = sources.map((s, i) => (i + 1) + ". " + (s.title || s.name || "Source")).join("\n");
    return "\n\nSources:\n" + sourceList;
  }

  private selectRandom(arr: string[], count: number): string[] {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

// ─── Singleton ────────────────────────────────────────────────

let nlGeneratorInstance: NLGenerator | null = null;

export function getNLGenerator(personality?: ASISPersonality): NLGenerator {
  if (!nlGeneratorInstance) {
    nlGeneratorInstance = new NLGenerator(personality || {
      name: "ASIS",
      greetingStyle: "friendly",
      verbosity: "balanced",
      humor: 0.3,
      empathy: 0.7,
      technicalDepth: 0.6,
      culturalAwareness: ["african", "global"],
    });
  }
  return nlGeneratorInstance;
}
