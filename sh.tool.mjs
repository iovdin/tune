import { exec } from 'node:child_process';
import util from 'node:util';

const execPromise = util.promisify(exec);

export default async function sh({ text }) {
    try {
        const { stdout, stderr } = await execPromise(text);
        return stdout || stderr; // Return stdout if available, otherwise stderr
    } catch (error) {
        throw new Error(`Error executing command: ${error.message}`);
    }
}