const path = require('node:path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/ai-mystery-room'),
  MONGODB_DNS_SERVERS: z.string().default(''),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  SESSION_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_TEXT_MODEL: z.string().min(1).default('gemini-3.8-flash'),
  GEMINI_IMAGE_MODEL: z.string().optional(),
  GEMINI_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(3).default(2),
  GENERATION_TIMEOUT_MS: z.coerce.number().int().min(5000).max(120000).default(60000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

if (parsed.data.NODE_ENV === 'production' && (!parsed.data.SESSION_SECRET || parsed.data.SESSION_SECRET.length < 32)) {
  throw new Error('SESSION_SECRET must contain at least 32 characters in production.');
}

module.exports = {
  ...parsed.data,
  MONGODB_DNS_SERVERS: parsed.data.MONGODB_DNS_SERVERS.split(',').map((value) => value.trim()).filter(Boolean),
};
