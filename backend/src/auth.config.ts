import { resolve } from 'node:path';
import { getAuth } from './auth';

process.loadEnvFile(resolve(process.cwd(), '.env'));

export const auth = getAuth();
export default auth;
