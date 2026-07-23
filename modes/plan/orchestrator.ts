import { isCancel,text } from '@clack/prompts'
import chalk from 'chalk'
import { generatePlan } from './planner';
import { printPlan, selectSteps } from './selection';
import { defaultAgentConfig } from '../agent/types';
import { ActionTracker } from '../agent/action-tracker';
import { ToolExecutor } from '../agent/tool-executor';
import { createAgentTools } from '../agent/agent-tools';
import { stepCountIs, ToolLoopAgent } from 'ai';
import { genAImodel } from '../../ai';
import type { PlanStep } from './types';
import { renderTerminalMarkdown } from '../../tui/terminal-md';
import { runApprovalFlow } from '../agent/approval';

function stepPrompt(goal:string , step:PlanStep):string{
    return [`Goal : ${goal},step:{step.title}`, step.description].join('\n')
}

export async function runPlanMode():Promise<void>{
    console.log(chalk.bold('\n Plan Mode\n'))
    const goal=await text({message:"what is your goal?"})
    if(isCancel(goal) || !goal.trim()) return;

    const plan=await generatePlan(goal);
    printPlan(plan);
    const selected=await selectSteps(plan);
    if(selected.length===0) return;
    // const proceed=await  confirm({
    //     message:`Execute ${selected.length} step`,initialValue:true
    // })
    const config=defaultAgentConfig();
    const tracker=new ActionTracker()
    const executor=new ToolExecutor(config,tracker);
    const tools={
        ...createAgentTools(executor)
    }
    for(const step of selected){
        console.log(chalk.bold(`\n ${step.title}\n`))
        const agent=new ToolLoopAgent({
            model:genAImodel(),
            stopWhen:stepCountIs(30),
            tools
        })
        const r=await agent.generate({
            prompt:stepPrompt(plan.goal,step)
        })
        if(r.text) return console.log(renderTerminalMarkdown(r.text))
    }
    const ok=await runApprovalFlow(tracker);
    if(!ok) return executor.clearStaging();
    const {errors}=executor.applyApprovedFromTracker();
    if(errors.length){
        console.log(chalk.red('\nSome operations reported errors : \n'))
        for(const e of errors) console.log(chalk.red(`${e}`));
    }else{
        console.log(chalk.green(`\nApplied.\n`));
    }
    executor.clearStaging();
}