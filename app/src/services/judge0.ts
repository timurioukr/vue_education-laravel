import type { ExecutionResult } from '@/types'

const LANGUAGE_IDS: Record<string, number> = {
  php: 68,
  javascript: 63,
  bash: 46,
}

const cache = new Map<string, ExecutionResult>()
const requestTimestamps: number[] = []
const MAX_REQUESTS_PER_MINUTE = 10

function getCacheKey(code: string, language: string): string {
  return `${language}:${code}`
}

function checkRateLimit(): boolean {
  const now = Date.now()
  const oneMinuteAgo = now - 60_000
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift()
  }
  return requestTimestamps.length < MAX_REQUESTS_PER_MINUTE
}

async function submitCode(code: string, languageId: number): Promise<string> {
  const apiUrl = import.meta.env.VITE_JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com'
  const apiKey = import.meta.env.VITE_JUDGE0_API_KEY

  const response = await fetch(`${apiUrl}/submissions?base64_encoded=true&wait=false`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
    },
    body: JSON.stringify({
      source_code: btoa(unescape(encodeURIComponent(code))),
      language_id: languageId,
      cpu_time_limit: 5,
      memory_limit: 128000,
    }),
  })

  if (!response.ok) {
    throw new Error(`Judge0 submit failed: ${response.status}`)
  }

  const data = await response.json()
  return data.token
}

async function pollResult(token: string): Promise<ExecutionResult> {
  const apiUrl = import.meta.env.VITE_JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com'
  const apiKey = import.meta.env.VITE_JUDGE0_API_KEY
  const maxAttempts = 20
  const pollInterval = 500

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `${apiUrl}/submissions/${token}?base64_encoded=true&fields=stdout,stderr,status,time,memory`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Judge0 poll failed: ${response.status}`)
    }

    const data = await response.json()

    // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4+=error states
    if (data.status.id <= 2) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
      continue
    }

    const decode = (b64: string | null): string => {
      if (!b64) return ''
      try {
        return decodeURIComponent(escape(atob(b64)))
      } catch {
        return atob(b64)
      }
    }

    const statusMap: Record<number, ExecutionResult['status']> = {
      3: 'success',
      5: 'timeout',
      6: 'compilation_error',
    }

    return {
      stdout: decode(data.stdout),
      stderr: decode(data.stderr),
      exitCode: data.status.id === 3 ? 0 : 1,
      time: data.time ?? '0',
      memory: data.memory ?? 0,
      status: statusMap[data.status.id] ?? 'error',
    }
  }

  return {
    stdout: '',
    stderr: 'Execution timed out while waiting for result',
    exitCode: 1,
    time: '0',
    memory: 0,
    status: 'timeout',
  }
}

export async function executeCode(
  code: string,
  language: 'php' | 'javascript' | 'bash',
): Promise<ExecutionResult> {
  const cacheKey = getCacheKey(code, language)
  const cached = cache.get(cacheKey)
  if (cached) return cached

  if (!checkRateLimit()) {
    return {
      stdout: '',
      stderr: 'Забагато запитів. Зачекайте хвилину.',
      exitCode: 1,
      time: '0',
      memory: 0,
      status: 'error',
    }
  }

  const languageId = LANGUAGE_IDS[language]
  if (!languageId) {
    return {
      stdout: '',
      stderr: `Мова "${language}" не підтримується`,
      exitCode: 1,
      time: '0',
      memory: 0,
      status: 'error',
    }
  }

  requestTimestamps.push(Date.now())

  const token = await submitCode(code, languageId)
  const result = await pollResult(token)

  if (result.status === 'success') {
    cache.set(cacheKey, result)
  }

  return result
}

export function isJudge0Configured(): boolean {
  return !!import.meta.env.VITE_JUDGE0_API_KEY
}
