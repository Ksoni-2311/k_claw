import { isCancel, text } from '@clack/prompts';
import chalk from 'chalk'
import { defaultAgentConfig } from './types';
import { ActionTracker } from './action-tracker';
import { ToolExecutor } from './tool-executor';
import { createAgentTools } from './agent-tools';
import { stepCountIs, ToolLoopAgent } from 'ai';
import { genAImodel } from '../../ai';
import { renderTerminalMarkdown } from '../../tui/terminal-md';
import { log } from 'console';
import { runApprovalFlow } from './approval';


export async function runAgentMode() {
    // console.log(chalk.bold('\nAgent Mode\n'));
    const goal = await text({
        message: "What is your goal? (e.g. 'Plan a trip to Paris')",
        placeholder: "Enter your goal here"
    })
    if (isCancel(goal) || !goal.trim()) { return; }
    const config = defaultAgentConfig();
    const tracker = new ActionTracker();
    // executor
    const executor = new ToolExecutor(config, tracker);
    const tools = createAgentTools(executor)
    const agent = new ToolLoopAgent({
        model: genAImodel(),
        stopWhen: stepCountIs(40),
        instructions: [
            `workspace root ${config.codebasePath}`,
            "All mutations are staged untill approval."
        ].join('\n'),
        tools
    })

    const result = await agent.generate({
        prompt: goal.trim(),
        onStepFinish: ({ toolCalls }) => {
            for (const tc of toolCalls) {
                const preview = JSON.stringify(tc.input).slice(0, 160);
                console.log(
                    chalk.green("Executing..."),
                    chalk.bold(String(tc.toolName)),
                    chalk.dim(preview + (preview.length >= 160 ? "..." : ""))
                )
            }
        }
    })
    if (result.text?.trim()) console.log(renderTerminalMarkdown(result.text));
    const ok = await runApprovalFlow(tracker);
    if (!ok) return executor.clearStaging()
    const { errors } = executor.applyApprovedFromTracker();
    if (errors.length) {
        console.log(chalk.red("\nSome operations reported error:\n"));
        for (const e of errors) console.log(chalk.red(`>${e}`))
    }
    else {
        console.log(chalk.green('\n Applied.\n'))
    }
    executor.clearStaging()
}