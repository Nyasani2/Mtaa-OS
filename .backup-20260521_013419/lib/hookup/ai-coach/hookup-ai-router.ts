import {
  generateAdvice
} from "./hookup-ai-coach";

import {
  detectEmotionalTone
} from "../emotional-intelligence/hookup-ei-engine";

import {
  safetyAdvice
} from "../safety-advice/hookup-safety-advisor";

export function hookupAI(
  context: any,
  message: string
) {

  const emotion =
    detectEmotionalTone(message);

  const safety =
    safetyAdvice(message);

  const advice =
    generateAdvice(context);

  return {
    emotion,
    safety,
    advice,
  };
}
