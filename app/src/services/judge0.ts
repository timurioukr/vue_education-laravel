import type { ExecutionResult } from '@/types'

const EXECUTOR_URL = 'http://localhost:8088'

const cache = new Map<string, ExecutionResult>()

function getCacheKey(code: string, language: string): string {
  return `${language}:${code}`
}

async function executePhpLocally(code: string): Promise<ExecutionResult> {
  const response = await fetch(EXECUTOR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language: 'php' }),
  })

  if (!response.ok) {
    throw new Error(`Executor failed: ${response.status}`)
  }

  return await response.json()
}

function executeJsLocally(code: string): ExecutionResult {
  const logs: string[] = []
  const errors: string[] = []
  const startTime = performance.now()

  const fakeConsole = {
    log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
    error: (...args: unknown[]) => errors.push(args.map(String).join(' ')),
    warn: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
  }

  try {
    const fn = new Function('console', code)
    fn(fakeConsole)
  } catch (e) {
    errors.push(String(e))
  }

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(3)

  return {
    stdout: logs.join('\n') + (logs.length ? '\n' : ''),
    stderr: errors.join('\n'),
    exitCode: errors.length > 0 ? 1 : 0,
    time: elapsed,
    memory: 0,
    status: errors.length > 0 ? 'error' : 'success',
  }
}

export async function executeCode(
  code: string,
  language: 'php' | 'javascript' | 'bash',
): Promise<ExecutionResult> {
  const cacheKey = getCacheKey(code, language)
  const cached = cache.get(cacheKey)
  if (cached) return cached

  let result: ExecutionResult

  if (language === 'javascript') {
    result = executeJsLocally(code)
  } else if (language === 'php') {
    result = await executePhpLocally(code)
  } else {
    return {
      stdout: '',
      stderr: `Мова "${language}" не підтримується`,
      exitCode: 1,
      time: '0',
      memory: 0,
      status: 'error',
    }
  }

  if (result.status === 'success') {
    cache.set(cacheKey, result)
  }

  return result
}

export async function isExecutorAvailable(): Promise<boolean> {
  try {
    const response = await fetch(EXECUTOR_URL, {
      method: 'OPTIONS',
    })
    return response.ok || response.status === 204
  } catch {
    return false
  }
}
