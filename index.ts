#!/usr/bin/env bun

import {Command} from 'commander';
import { runwakeup } from './tui/wakeup';

const program = new Command();

program
    .name('K_claw')
    .description('A command-line tool for K_claw')
    .version('0.0.1');
program
    .command('wakeup')
    .description('Show the banner of K_claw and wake up the server pick cli or telegram mode')
    .action(async() => {
        console.log('Starting K_claw server...');
        await runwakeup()
    });
program.parse(process.argv);