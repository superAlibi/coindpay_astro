import process from 'node:process'
export function env(key: keyof ImportMetaEnv): string | undefined {
  return import.meta.env[key] ?? process.env[key];
}