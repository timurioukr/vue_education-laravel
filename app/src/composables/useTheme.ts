import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return systemPrefersDark() ? 'dark' : 'light'
}

function applyTheme(value: Theme): void {
  document.documentElement.setAttribute('data-theme', value)
}

// Shared singleton state across all callers.
const theme = ref<Theme>(getInitialTheme())
let initialized = false

export function useTheme() {
  if (!initialized) {
    initialized = true
    applyTheme(theme.value)

    // Follow the OS setting only while the user hasn't picked a theme manually.
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (event) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
          theme.value = event.matches ? 'dark' : 'light'
          applyTheme(theme.value)
        }
      })
  }

  function setTheme(value: Theme): void {
    theme.value = value
    localStorage.setItem(STORAGE_KEY, value)
    applyTheme(value)
  }

  function toggle(): void {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggle }
}
