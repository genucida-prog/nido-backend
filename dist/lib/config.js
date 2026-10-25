"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Intentar primero backend/.env.local, luego subir a la raíz
const possiblePaths = [
    path_1.default.resolve(__dirname, '../../../.env.local'), // replica/.env.local
    path_1.default.resolve(__dirname, '../../.env.local'), // backend/.env.local
    path_1.default.resolve(__dirname, '../.env.local'), // src/.env.local
];
let loadedPath = '';
for (const p of possiblePaths) {
    if (fs_1.default.existsSync(p)) {
        dotenv_1.default.config({ path: p });
        loadedPath = p;
        break;
    }
}
if (!loadedPath) {
    console.error('❌ No se encontró ningún archivo .env.local');
}
// Validar variables requeridas
const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY'];
for (const v of requiredVars) {
    if (!process.env[v]) {
        console.warn(`⚠️  Variable de entorno no configurada: ${v}`);
    }
}
exports.config = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    loadedFrom: loadedPath,
};
