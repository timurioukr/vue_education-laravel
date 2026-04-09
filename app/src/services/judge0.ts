import type { ExecutionResult } from '@/types'
import JsSandboxWorker from './js-sandbox.worker?worker'

const EXECUTOR_URL = 'http://localhost:8088'
const CACHE_MAX_SIZE = 200

const cache = new Map<string, ExecutionResult>()

/** phpAvailable is cached for 30 seconds, then re-checked */
let phpAvailable: boolean | null = null
let phpCheckedAt = 0
const PHP_CHECK_TTL = 30_000

function getCacheKey(code: string, language: string): string {
  return `${language}:${code}`
}

function cacheSet(key: string, result: ExecutionResult): void {
  if (cache.size >= CACHE_MAX_SIZE) {
    // Evict the oldest entry (first inserted)
    const firstKey = cache.keys().next().value
    if (firstKey !== undefined) cache.delete(firstKey)
  }
  cache.set(key, result)
}

async function checkPhpExecutor(): Promise<boolean> {
  const now = Date.now()
  if (phpAvailable !== null && now - phpCheckedAt < PHP_CHECK_TTL) {
    return phpAvailable
  }
  try {
    const response = await fetch(EXECUTOR_URL, { method: 'OPTIONS' })
    phpAvailable = response.ok || response.status === 204
  } catch {
    phpAvailable = false
  }
  phpCheckedAt = now
  return phpAvailable
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

function executeJsInWorker(code: string): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const worker = new JsSandboxWorker()
    const timeout = setTimeout(() => {
      worker.terminate()
      resolve({
        stdout: '',
        stderr: 'Execution timed out after 5 seconds',
        exitCode: 1,
        time: '5.000',
        memory: 0,
        status: 'error',
      })
    }, 5000)

    worker.onmessage = (e: MessageEvent<ExecutionResult>) => {
      clearTimeout(timeout)
      worker.terminate()
      resolve(e.data)
    }

    worker.onerror = (e) => {
      clearTimeout(timeout)
      worker.terminate()
      resolve({
        stdout: '',
        stderr: String(e.message ?? e),
        exitCode: 1,
        time: '0',
        memory: 0,
        status: 'error',
      })
    }

    worker.postMessage({ code })
  })
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
    result = await executeJsInWorker(code)
  } else if (language === 'php') {
    const available = await checkPhpExecutor()
    if (!available) {
      return {
        stdout: '',
        stderr: '',
        exitCode: 1,
        time: '0',
        memory: 0,
        status: 'php_unavailable',
      }
    }
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
    cacheSet(cacheKey, result)
  }

  return result
}
