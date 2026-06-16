export type ActionType =
    | 'file_create'
    | 'file_read'
    | 'file_modify'
    | 'file_delete'
    | 'folder_update'
    | 'folder_create'
    | 'code_analysis'
    | 'tool_execute'
    | 'web_search'
    | 'api_call'

export type ActionStatus = 'pending' | 'executed' | 'approved' | 'rejected';
export interface Actionlogs {
    id: string;
    timestamp: Date;
    type: ActionType;
    path: string;
    status: ActionStatus;
    userApproved?: boolean;
    input?: string;
    output?: string;
    error?: string;
    details: {
        before?: string;
        after?: string;
        toolName?: string;
        toolResults?: string;
        error?: string;
        command?: string;
    }
    
}

export interface AgentConfig {
    codebasePath: string;
    maxFileSizeToRead: number;
    excludePatterns: string[];
    tools: {
        allowfileCreation: boolean;
        allowshellExecution: boolean;
        allowFileModification: boolean;
        allowWebSearch: boolean;
        allowAPICalls: boolean;
        allowFolderCreation: boolean;
    }
}
export const defaultAgentConfig = (): AgentConfig => ({
    codebasePath: process.cwd(),

    maxFileSizeToRead: 1024 * 1024,

    excludePatterns: [
        'node_modules',
        '.git',
        'dist',
        'build',
        '.next',
        '*.log',
        '.env*',
    ],

    tools: {
        allowshellExecution: true,
        allowFileModification: true,
        allowfileCreation: true,
        allowFolderCreation: true,
    }
});

export function isMutationType(t: ActionType): boolean {
    return (
        t === 'file_create' ||
        t === 'file_modify' ||
        t === 'file_delete' ||
        t === 'folder_update' ||
        t === 'tool_execute'
    )}