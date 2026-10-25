import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Intentar primero backend/.env.local, luego subir a la raíz
const possiblePaths = [
  path.resolve(__dirname, '../../../.env.local'), // replica/.env.local
  path.resolve(__dirname, '../../.env.local'),     // backend/.env.local
  path.resolve(__dirname, '../.env.local'),        // src/.env.local
];

let loadedPath = '';
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
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

export const config = {
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  loadedFrom: loadedPath,
};