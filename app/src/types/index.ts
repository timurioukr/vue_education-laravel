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
