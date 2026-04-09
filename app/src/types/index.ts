export interface Lesson {
  id: string
  title: string
  titleUa: string
  week: number
  order: number
  duration: string
  icon: string
  isTest?: boolean
}

export interface Week {
  number: number
  title: string
  titleUa: string
  icon: string
  lessons: Lesson[]
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

export interface FlowStep {
  icon: string
  title: string
  subtitle: string
  color: string
}

export interface TreeNode {
  name: string
  type: 'file' | 'dir'
  children?: TreeNode[]
  highlight?: boolean
}

export interface DiagramStep {
  highlightNodes: string[]
  description: string
  code?: string
}

export interface CodeFlowStep {
  line: number
  variables: Record<string, string>
  output?: string
  note?: string
}

export interface ExecutionResult {
  stdout: string
  stderr: string
  exitCode: number
  time: string
  memory: number
  status: 'success' | 'error' | 'timeout' | 'compilation_error' | 'php_unavailable'
}
