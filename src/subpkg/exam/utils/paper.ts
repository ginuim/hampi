export interface PaperQuestion {
  id: string
  options: string[]
  answer: string
  optionMapping?: Record<string, string>
}

export interface PaperConfig {
  singleChoiceCount: number
  multipleChoiceCount: number
}

const letters = ['A', 'B', 'C', 'D']

export function shuffleItems<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

// 按原始位置打乱，选项文本相同时也能准确还原答案。
export function createOptionMapping(optionCount: number, random: () => number = Math.random): Record<string, string> {
  if (optionCount < 1 || optionCount > letters.length) {
    throw new Error(`不支持 ${optionCount} 个选项的题目`)
  }
  const order = shuffleItems(Array.from({ length: optionCount }, (_, index) => index), random)
  const mapping: Record<string, string> = {}
  order.forEach((originalIndex, displayIndex) => {
    mapping[letters[displayIndex]] = letters[originalIndex]
  })
  return mapping
}

export function buildExamPaper<T extends PaperQuestion>(
  questions: T[],
  config: PaperConfig,
  recentIds: Iterable<string> = [],
  random: () => number = Math.random
): T[] {
  const recent = new Set(recentIds)
  const unique = [...new Map(questions.map(question => [question.id, question])).values()]
  const single = unique.filter(question => question.answer?.length === 1)
  const multiple = unique.filter(question => question.answer?.length > 1)
  if (single.length < config.singleChoiceCount || multiple.length < config.multipleChoiceCount) {
    throw new Error('题库数量不足，无法按当前配置组卷')
  }

  const pick = (pool: T[], count: number) => {
    const fresh = shuffleItems(pool.filter(question => !recent.has(question.id)), random)
    const seen = shuffleItems(pool.filter(question => recent.has(question.id)), random)
    return [...fresh, ...seen].slice(0, count)
  }

  // 保持单选在前、多选在后；两组内部仍随机抽取。
  return [
    ...pick(single, config.singleChoiceCount),
    ...pick(multiple, config.multipleChoiceCount)
  ].map(question => ({
    ...question,
    optionMapping: createOptionMapping(question.options.length, random)
  }))
}
