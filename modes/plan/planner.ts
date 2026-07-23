import z from 'zod'
import { ToolExecutor } from '../agent/tool-executor'
import { extractJsonMiddleware, generateText, Output, stepCountIs, tool, wrapLanguageModel } from 'ai'
import { defaultAgentConfig } from '../agent/types'
import { ActionTracker } from '../agent/action-tracker'
import chalk from 'chalk'
import { genAImodel } from '../../ai'
import type { Plan, PlanStep } from './types'

const planSchema=z.object({
    researchSummary:z.string().optional(),
    steps:z
    .array(
        z.object({
            title:z.string(),
            description:z.string(),
            hints:z.array(z.string()).optional(),
            complexity:z.enum(['low','medium','high']).optional(),
        })
    )
    .min(1)
    .max(15)
})

function readOnlyTools(executor:ToolExecutor){
    return{
        read_file: tool({
      description: "Read the text file from workspace . Use a path relative  to the project root.",
      inputSchema: z.object({
        path: z.string().describe("Relative file path")
      }),
      execute: async ({ path: p }) => executor.readFile(p)
    }),
    createFile: tool({
      description: "Stage creation of a new file (do not append till approval by user)",
      inputSchema: z.object({
        path: z.string(),
        content: z.string(),
      }),
      execute: async ({ path: p, content }) => executor.createFile(p, content)
    }),
    modifyFile: tool({
      description: "Stage full file replacement for existing file(pending approvals).",
      inputSchema: z.object({
        path: z.string(),
        content: z.string().describe('Complete new file contents'),
      }),
      execute: async ({ path: p, content }) => executor.modifyFile(p, content)
    }),
    deleteFile: tool({
      description: "Stage deletion of file (pending approvals).",
      inputSchema: z.object({
        path: z.string(),
      }),
      execute: async ({ path: p }) => executor.deleteFile(p)
    }),
    create_folder: tool({
      description:
        "Stage creation of a directory tree (pending approval). Uses mkdir -p on apply.",
      inputSchema: z.object({
        path: z.string().describe("Relative directory path"),
      }),
      execute: async ({ path: p }) => executor.createFolder(p),
    }),

    list_files: tool({
      description: "List files and directories under a path.",
      inputSchema: z.object({
        path: z.string(),
        recursive: z.boolean().optional().default(false),
      }),
      execute: async ({ path: p, recursive }) =>
        executor.listFiles(p, recursive),
    }),

    search_files: tool({
      description:
        'Find files matching a glob pattern (e.g. "*.ts", "**/*.md"). Optional content substring filter.',
      inputSchema: z.object({
        root: z.string().describe("Directory to search, relative to root"),
        pattern: z
          .string()
          .describe("Glob-like pattern using * and ** (forward slashes)"),
        content_contains: z.string().optional(),
      }),
      execute: async ({ root, pattern, content_contains }) =>
        executor.searchFiles(root, pattern, content_contains),
    }),

    analyze_codebase: tool({
      description:
        "Summarize structure: file counts, size, extensions. Read-only.",
      inputSchema: z.object({
        path: z.string().default("."),
      }),
      execute: async ({ path: p }) => executor.analyzeCodebase(p),
    }),

    list_skills: tool({
      description:
        "List absolute paths to SKILL.md files under configured skill directories (Cursor / Claude).",
      inputSchema: z.object({}),
      execute: async () => executor.listSkills(),
    }),

    read_skill: tool({
      description:
        "Read a SKILL.md file. Path must be absolute and under skill roots, or use a path returned by list_skills.",
      inputSchema: z.object({
        path: z.string(),
      }),
      execute: async ({ path: p }) => executor.readSkill(p),
    }),
    }
}

const PLAN_INSTRUCTIONS = (codebase: string, hasWeb: boolean) => [
  "You are an expert Software Architect operating in PLAN MODE.",

  "Your responsibility is to analyze the request, inspect the codebase, and produce a precise implementation plan.",

  "IMPORTANT RULES:",
  "- Never modify files.",
  "- Never generate patches, diffs, or code changes.",
  "- Use only read-only tools to inspect the repository.",
  "- Gather enough context before planning.",
  "- Identify affected files, components, APIs, and dependencies.",
  "- Consider edge cases, validation, security, performance, and testing.",
  "- Avoid speculative assumptions. Verify using available tools whenever possible.",
  "- If requirements are ambiguous, explicitly mention assumptions.",

  `Workspace Root: ${codebase}`,

  hasWeb
    ? "- Web research tools are available. Use them only when external documentation or library behavior must be verified."
    : "- Web research tools are unavailable. Rely solely on repository context.",

  "PLAN REQUIREMENTS:",
  "- Produce a concise implementation strategy.",
  "- Keep plans between 1 and 15 steps.",
  "- Each step should be actionable and ordered logically.",
  "- Mention files or modules likely to be affected.",
  "- Include testing and validation steps.",
  "- Highlight risks or blockers if discovered.",

  "OUTPUT REQUIREMENTS:",
  "- Response must strictly follow the provided JSON schema.",
  "- Do not include markdown.",
  "- Do not include explanations outside the JSON output.",
].join("\n");

export async function generatePlan(goal:string){
    const config=defaultAgentConfig();
    const tracker=new ActionTracker();
    const executor=new ToolExecutor(config,tracker);

    const hasWeb=false;
    const model=wrapLanguageModel({
        model:genAImodel(),
        middleware:extractJsonMiddleware()
    })

    const tools={...readOnlyTools(executor)}
    console.log(chalk.cyan('\n Researching & drafting a plan \n'))
    const result=await generateText({
        model,
        tools,
        stopWhen:stepCountIs(20),
        system:PLAN_INSTRUCTIONS(config.codebasePath,hasWeb),
        prompt:`User goal :\n${goal}`,
        output:Output.object({schema:planSchema})
    })

    const validate=planSchema.parse(result.output);
    const steps:PlanStep[]=validate.steps.map((s,i)=>({
        id:`step-${i+1}`,
        title:s.title,
        description:s.description,
        hints:s.hints,
        complexity:s.complexity
    }))
    return {goal,researchSummary:validate.researchSummary,steps}
}