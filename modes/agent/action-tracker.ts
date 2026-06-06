import type { Actionlogs,ActionStatus } from "./types";
import {isMutationType} from "./types";

export class ActionTracker {
    private actions: Actionlogs[] = [];
    log(
        entry: Omit<Actionlogs, 'id' | 'timestamp'>
        & { 
            id?: string;
            timestamp?: Date;
         }
    ):Actionlogs{
        const action: Actionlogs = {
            id:entry.id ?? `action_${Date.now()}`,
            timestamp: entry.timestamp ?? new Date(),
            type: entry.type,
            path: entry.path,
            details: {...entry.details},
            status: entry.status,
            userApproved: entry.userApproved,
        }
        this.actions.push(action);
        return action;
    }
    getActions():readonly Actionlogs[]{
        return this.actions;
    }
    getPendingMutations():Actionlogs[]{
        return this.actions.filter(
            (a)=>isMutationType(a.type) && a.status ==='pending'
        )
    }
    updateStatus(id:string,status:ActionStatus,userApproved?:boolean):void{
        const a=this.actions.find((x)=>x.id===id)
        if(!a) return;
        a.status=status;
        if(userApproved !== undefined) a.userApproved=userApproved;
    }
}