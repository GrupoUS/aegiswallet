#!/usr/bin/env bun
/**
 * Helper script to configure Google Calendar credentials for local and Supabase environments.
 *
 * Usage:
 *   bun run setup:google-calendar
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';

interface Question {
  key: 'GOOGLE_OAUTH_CLIENT_ID' | 'GOOGLE_OAUTH_CLIENT_SECRET' | 'GOOGLE_OAUTH_REDIRECT_URI';
  prompt: string;
  default?: string;
}

const QUESTIONS: Question[] = [
  {
    key: 'GOOGLE_OAUTH_CLIENT_ID',
    prompt: 'Google OAuth Client ID',
  },
  {
    key: 'GOOGLE_OAUTH_CLIENT_SECRET',
    prompt: 'Google OAuth Client Secret',
  },
  {
    default: 'https://aegiswallet.vercel.app/api/google-calendar/callback', key: 'GOOGLE_OAUTH_REDIRECT_URI', prompt: 'OAuth Redirect URI',
  },
];

const rl = createInterface({ input, output });

async function promptForValue(question: Question): Promise<string> {
  const envValue = process.env[question.key];
  if (envValue?.trim()) {
    return envValue.trim();
  }
  const answer = (await rl.question(`${question.prompt}${question.default ? ` (${question.default})` : ''}: `)).trim();
  if (answer) {
    return answer;
  }
  if (question.default) {
    return question.default;
  }
  output.write('Este valor é obrigatório. Pressione Ctrl+C para sair.\n');
  return promptForValue(question);
}

function upsertEnvValues(filePath: string, values: Record<string, string>) {
  let content = existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';

  Object.entries(values).forEach(([key, value]) => {
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    if (pattern.test(content)) {
      content = content.replace(pattern, `${key}=${value}`);
    } else {
      if (content.length > 0 && !content.endsWith('\n')) {
        content += '\n';
      }
      content += `${key}=${value}\n`;
    }
  });

  writeFileSync(filePath, content);
}

function readProjectRef(): string | null {
  try {
    const configPath = path.resolve(process.cwd(), 'supabase', 'config.toml');
    if (!existsSync(configPath)) {
      return null;
    }
    const config = readFileSync(configPath, 'utf8');
    const match = config.match(/project_id\s*=\s*"([^"]+)"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function main() {
  const answers: Record<Question['key'], string> = {
    GOOGLE_OAUTH_CLIENT_ID: '',
    GOOGLE_OAUTH_CLIENT_SECRET: '',
    GOOGLE_OAUTH_REDIRECT_URI: '',
  };

  for (const question of QUESTIONS) {
    answers[question.key] = await promptForValue(question);
  }

  rl.close();

  const envUpdates = {
    GOOGLE_CLIENT_ID: answers.GOOGLE_OAUTH_CLIENT_ID, GOOGLE_CLIENT_SECRET: answers.GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_REDIRECT_URI: answers.GOOGLE_OAUTH_REDIRECT_URI, VITE_GOOGLE_CLIENT_ID: answers.GOOGLE_OAUTH_CLIENT_ID,
  };

  const envPath = path.resolve(process.cwd(), '.env.local');
  upsertEnvValues(envPath, envUpdates);

  const supabaseEnvPath = path.resolve(process.cwd(), 'supabase', 'google-calendar.env');
  upsertEnvValues(supabaseEnvPath, {
    GOOGLE_CLIENT_ID: answers.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: answers.GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: answers.GOOGLE_OAUTH_REDIRECT_URI,
  });

  const projectRef = readProjectRef();
  const secretArgs = [
    'secrets',
    'set',
    `GOOGLE_CLIENT_ID=${answers.GOOGLE_OAUTH_CLIENT_ID}`,
    `GOOGLE_CLIENT_SECRET=${answers.GOOGLE_OAUTH_CLIENT_SECRET}`,
    `GOOGLE_REDIRECT_URI=${answers.GOOGLE_OAUTH_REDIRECT_URI}`,
  ];

  if (projectRef) {
    secretArgs.push('--project-ref', projectRef);
  }

  output.write('\nAtualizando segredos no Supabase...\n');
  const supabaseResult = spawnSync('supabase', secretArgs, { stdio: 'inherit' });

  if (supabaseResult.status !== 0) {
    output.write(
      '\n⚠️  Não foi possível aplicar os segredos automaticamente. Execute manualmente:\n' +
        `supabase secrets set GOOGLE_CLIENT_ID=${answers.GOOGLE_OAUTH_CLIENT_ID} GOOGLE_CLIENT_SECRET=${answers.GOOGLE_OAUTH_CLIENT_SECRET} GOOGLE_REDIRECT_URI=${answers.GOOGLE_OAUTH_REDIRECT_URI}${
          projectRef ? ` --project-ref ${projectRef}` : ''
        }\n`
    );
  }

  output.write('\n✅ Configuração concluída!\n');
  output.write(`  - Variáveis salvas em ${envPath}\n`);
  output.write(`  - Arquivo auxiliar gerado em ${supabaseEnvPath}\n`);
  output.write(
    '  - Execute `vercel env set VITE_GOOGLE_CLIENT_ID <valor>` e equivalentes se precisar propagar para previews.\n'
  );
  output.write(
    '\nPara validar, autentique-se no app e acesse: /api/trpc/googleCalendar.getSyncStatus\n' +
      'Você também pode rodar:\n' +
      'curl -H "Authorization: Bearer <jwt>" "http://localhost:3000/api/trpc/googleCalendar.getSyncStatus"\n'
  );
}

main().catch((error) => {
  console.error('Erro durante a configuração do Google Calendar:', error);
  process.exit(1);
});

