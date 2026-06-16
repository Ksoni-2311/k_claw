import {createOpenRouter} from '@openrouter/ai-sdk-provider'
import { log } from 'node:console'
export function genAImodel() {
    const provide=createOpenRouter({apiKey:process.env.OPENROUTER_KEY})
    const modelID=process.env.OPENROUTER_DEFAULT_MODEL
    return provide(modelID)
}
