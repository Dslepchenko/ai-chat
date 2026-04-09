import { openai } from '@ai-sdk/openai'
import { AI_CONFIG } from '@/lib/constants'

export const chatModel = openai(AI_CONFIG.MODEL_ID)
export const SYSTEM_PROMPT = AI_CONFIG.SYSTEM_PROMPT
