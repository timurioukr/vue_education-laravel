/**
 * Web Worker that executes user JavaScript in an isolated scope.
 * No access to DOM, localStorage, fetch, or any browser APIs.
 */

self.onmessage = (e: MessageEvent<{ code: string }>) => {
  const { code } = e.data
  const logs: string[] = []
  const errors: string[] = []
  const startTime = performance.now()

  const fakeConsole = {
    log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
    error: (...args: unknown[]) => errors.push(args.map(String).join(' ')),
    warn: (...args: unknown[]) => logs.push('[warn] ' + args.map(String).join(' ')),
    info: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
    debug: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
    table: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
  }

  try {
    const fn = new Function('console', code)
    fn(fakeConsole)
  } catch (err) {
    errors.push(String(err))
  }

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(3)

  self.postMessage({
    stdout: logs.join('\n') + (logs.length ? '\n' : ''),
    stderr: errors.join('\n'),
    exitCode: errors.length > 0 ? 1 : 0,
    time: elapsed,
    memory: 0,
    status: errors.length > 0 ? 'error' : 'success',
  })
}
