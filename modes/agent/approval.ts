import type string from "figlet/fonts/babyface-lame";
import type { ActionTracker } from "./action-tracker";
import chalk from "chalk";
import { isCancel, path, select } from "@clack/prompts";
import type { Actionlogs } from "./types";
import { composedBeforeAfter, formatPatch } from "./diff-view";
import { group, log } from "node:console";
import { renderTerminalMarkdown } from "../../tui/terminal-md";
import { constrainedMemory } from "node:process";

interface ReviewGroup{
    label:string;
    actionIds:string[];
    patch:string |null;
}

function groupPending(pending:Actionlogs[]):ReviewGroup[]{
    const byPath=new Map<string,Actionlogs[]>();
    const shells:Actionlogs[]=[];
    for (const a of pending){
        if(a.type==='tool_execute'){
            shells.push(a)
            continue;
        }
        const key=a.path;
        if(!byPath.has(key)) byPath.set(key,[]);
        byPath.get(key)!.push(a);
    }
    const groups:ReviewGroup[]=[];
    const pathEntries=[...byPath.entries()].sort(([a],[b])=>a.localeCompare(b));
    for(const [p,acts] of pathEntries){
        const sorted=acts.sort((x,y)=> x.timestamp.getTime()-y.timestamp.getTime());
        const ids=sorted.map((x)=>x.id);
        if(sorted.every((x)=>x.type==='folder_create')){
            groups.push({
                label:`Create folder : ${p}`,
                actionIds:ids,
                patch:null
            })
        }
        const {before,after}=composedBeforeAfter(sorted);
        const patch=formatPatch(p,before,after);
        const kinds=[...new Set(sorted.map((x)=>x.type))].join(',');
        groups.push({
            label:`${p}(${kinds})`,
            actionIds:ids,
            patch
        })
    }
    for(const s of shells){
        groups.push({
            label:`Shell : ${s.details.command ?? '(no command)'}`,
            actionIds:[s.id],
            patch:null
        })
    }
return groups;
}


export async function runApprovalFlow(tracker:ActionTracker):Promise<boolean>{
    const pending=tracker.getPendingMutations();
    if(pending.length ===0){
        console.log(
            chalk.dim('\nNo staged changes found in file or folder to review ')
        );
        return false;
    }
    const choice =await select({
        message:"Apply staged changes?",
        options:[
            {value:"all",label:"Approve and apply all"},
            {value:"select",label:"Review one by one"},
            {value:"cancel",label:"Cancel"},
        ]
    })
    if(isCancel(choice) || choice==="cancel"){
        for (const a of pending) tracker.updateStatus(a.id,"rejected",false);
        return false;
    }
    if(choice ==="all"){
        for(const a of pending) tracker.updateStatus(a.id,"approved",true)
        return true;
    }
    for(const g of groupPending(pending)){
        while(true){
            const opt=await select({
                message:chalk.bold(g.label),
                options:[
                    {value:"accept",label:"Accept"},
                    {value:"diff",label:"diff",hint:g.patch?"":"N/A"},
                    {value:"reject",label:"Rejected"},
                ]
            });

            if(isCancel(opt)){
                for(const a of pending) tracker.updateStatus(a.id,'rejected',false);
                return false;
            }
            if(opt==="diff"){
                if(g.patch){
                    console.log(
                        '\n' + renderTerminalMarkdown('```diff\n' + g.patch + '\n```\n' + '\n,')
                    )
                }
                continue;
            }
            for(const id of g.actionIds){
                tracker.updateStatus(id,opt==="accept"?"approved":"rejected",
                    opt==="accept"
                )
            }
            break;  
        }
    }
    return tracker.getActions().some((a)=>a.status === "approved")
}