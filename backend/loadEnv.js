import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 1. Try loading from current directory (backend/.env)
dotenv.config();
// 2. If essential vars are missing, try parent directory (root/.env)
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}
console.log('✅ Environment variables initialized');
