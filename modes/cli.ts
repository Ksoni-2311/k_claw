import { select, isCancel } from "@clack/prompts";
import chalk from "chalk";
import { runwakeup } from "../tui/wakeup";
import { runAgentMode } from "./agent/orchestrator";
import { runAskMode } from "./ask/orchestrator";
import { runPlanMode } from "./plan/orchestrator";
export async function runCliMode() {
    while (true) {
        const mode = await select({
            message: "Select a CLI submode",
            options: [
                { value: "agent", label: "Agent Mode" },
                { value: "plan", label: "Create a Plan Mode" },
                { value: "ask", label: "Ask a question" },
                { value: "back", label: "Back to Main Menu" }
            ]
        })
        if (mode === "agent") {
            console.log("Agent Mode Activated");
            await runAgentMode();
        }
        else if (isCancel(mode) || mode === 'back') {
            // console.log(chalk.red("Operation cancelled. Exiting..."));
            return runwakeup();
        }
        else if (mode === "plan") {
            await runPlanMode()

        }
        else if (mode === "ask") {
            await runAskMode()

        }
        if (mode !== "agent" && mode !== "plan" && mode !== "ask") {
            console.log(chalk.yellow("\nThat mode is not implemented yet. Exiting...\n"));
            process.exit(0);
        }
    }
}