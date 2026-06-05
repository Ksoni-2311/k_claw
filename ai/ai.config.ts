import {createOpenRouter} from '@openrouter/ai-sdk-provider'
export function genAImodel() {
    const provide=createOpenRouter({apiKey:process.env.OPENROUTER_KEY})
    const modelID=process.env.OPENROUER_DEFAULT_MODEL
    return provide(modelID)
}