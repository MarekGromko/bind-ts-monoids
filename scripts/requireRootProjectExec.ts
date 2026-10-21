/**
 * Module to require execution of script inside the root folder of the project (bind)
 */
import fs from 'node:fs';
import path from 'node:path';

export const PROJECT_DIR = process.cwd();
export const requireInRootProjectExec = () => {
    try {
        const raw_package_json = fs
            .readFileSync(path.join(PROJECT_DIR, 'package.json'))
            .toString('utf8');
        const package_json = JSON.parse(raw_package_json);
        if (package_json.name != 'bind') throw Error('package name is not "bind"');
    } catch (error: any) {
        console.error('Execute cleanup in the root folder of the project');
        console.log(error);
        process.exit(0);
    }
};
