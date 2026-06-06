import { select, isCancel } from "@clack/prompts";
import chalk from "chalk";
import { runwakeup } from "../tui/wakeup";
import { runAgentMode } from "./agent/orchestrator";
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
        if (isCancel(mode) || mode === 'back') {
            // console.log(chalk.red("Operation cancelled. Exiting..."));
            return runwakeup();
        }
        if (mode === "agent") {
            console.log("Agent Mode Activated");
            return runAgentMode();
        }
        if (mode === "plan") {
            console.log("Plan");

        }
        if (mode === "ask") {
            console.log("Ask");

        }
        if (mode !== "agent" && mode !== "plan" && mode !== "ask") {
            console.log(chalk.yellow("\nThat mode is not implemented yet. Exiting...\n"));
            process.exit(0);
        }
    }
}