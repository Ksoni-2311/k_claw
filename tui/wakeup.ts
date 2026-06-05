import {select,isCancel} from '@clack/prompts'
import chalk from 'chalk'
import figlet from 'figlet'
import { log } from 'node:console';
import { runCliMode } from '../modes/cli';

const BANNER_FONT='ANSI Shadow';
const SHADOW=chalk.hex('#ffebeb');
const FACE=chalk.hex('#0b903e').bold;
function printbannerWithShadow(ascii:string){
    const bannerLines=ascii.replace(/\s+$/,'').split('\n');
    const maxLen=Math.max(...bannerLines.map((l)=> l.length),0);
    const rowWidth=maxLen+2;

    for(const line of bannerLines){
        console.log(SHADOW((''+line).padEnd(rowWidth)));
    }
    process.stdout.write(`\x1b[${bannerLines.length}A`);
    for(const line of bannerLines){
        console.log(FACE(line.padEnd(rowWidth)));
    }
    console.log();
}

export async function runwakeup() {
    let ascii:string;
    try {
        ascii=figlet.textSync("K_claw",{font:BANNER_FONT})
    } catch (error) {
        ascii=figlet.textSync("K_claw",{font:"Standard"})        
    }
        printbannerWithShadow(ascii);
        const mode=await select({
            message:"Select a mode to proceed with",
            options:[
                {value:"cli",label:"Command Line Interface"},
                {value:"telegram",label:"Telegram"},
                {value:"exit",label:"Exit"}
            ]
        })
        if(isCancel(mode) || mode==='exit'){
            console.log(chalk.red("Operation cancelled. Exiting..."));
            process.exit(0);
        }
        if(mode==="cli"){
           return runCliMode()
        }
        if(mode==="telegram"){
            console.log(chalk.green("You have selected Telegram mode. Starting Telegram Bot..."));
            return "telegram";
        } 
}