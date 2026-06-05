import { isCancel,text } from '@clack/prompts';
import chalk from 'chalk'
import { defaultAgentConfig } from './types';


export async function runAgentMode(){
    console.log(chalk.bold('\nAgent Mode\n'));
    const goal=await text({
        message:"What is your goal? (e.g. 'Plan a trip to Paris')",
        placeholder:"Enter your goal here"
    })
    if(isCancel(goal) || !goal.trim()){return;}
    const config=defaultAgentConfig();
    const tracker=new ActionTracker();
}