/**
 * Script to cleanup the project
 */
import fs from 'node:fs';
import path from 'node:path';
import { requireInRootProjectExec, PROJECT_DIR } from './requireRootProjectExec.ts';
requireInRootProjectExec();

const rmdir = (dirname: string): void => {
    fs.rm(path.join(PROJECT_DIR, dirname), { recursive: true, force: true }, () => {
        console.log(`remove folder "${dirname}/"`);
    });
};

export const cleanup = () => {
    rmdir('coverage');
    rmdir('dist');
    rmdir('.nyc_output');
};

if (import.meta.main) cleanup();
