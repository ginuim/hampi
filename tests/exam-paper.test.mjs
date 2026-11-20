import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildExamPaper, createOptionMapping } from '../src/subpkg/exam/utils/paper.ts'
import questions from '../src/subpkg/exam/data/questions.json' with { type: 'json' }
import idsA from '../src/subpkg/exam/data/A.json' with { type: 'json' }
import idsB from '../src/subpkg/exam/data/B.json' with { type: 'json' }
import idsC from '../src/subpkg/exam/data/C.json' with { type: 'json' }

const byId = new Map(questions.map(question => [question.id, question]))
const configs = {
  A: { singleChoiceCount: 32, multipleChoiceCount: 8 },
  B: { singleChoiceCount: 45, multipleChoiceCount: 15 },
  C: { singleChoiceCount: 70, multipleChoiceCount: 20 }
}

test('同文选项仍映射到不同的原始位置', () => {
  for (const id of ['MC1-1012', 'MC1-1053']) {
    const question = byId.get(id)
    const mapping = createOptionMapping(question.options.length, () => 0)
    assert.deepEqual(new Set(Object.values(mapping)).size, question.options.length)
    const displayAnswer = Object.keys(mapping).find(letter => mapping[letter] === question.answer)
    assert.ok(displayAnswer)
    assert.equal(mapping[displayAnswer], question.answer)
  }
})

for (const [type, ids] of Object.entries({ A: idsA, B: idsB, C: idsC })) {
  test(`${type} 类单选在前、多选在后，按配额组卷且避开近期题目`, () => {
    const pool = ids.map(id => byId.get(id))
    assert.ok(pool.every(Boolean))
    const first = buildExamPaper(pool, configs[type])
    const second = buildExamPaper(pool, configs[type], first.map(question => question.id))
    const expected = configs[type].singleChoiceCount + configs[type].multipleChoiceCount
    for (const paper of [first, second]) {
      assert.equal(paper.length, expected)
      assert.equal(new Set(paper.map(question => question.id)).size, expected)
      assert.equal(paper.filter(question => question.answer.length === 1).length, configs[type].singleChoiceCount)
      assert.equal(paper.filter(question => question.answer.length > 1).length, configs[type].multipleChoiceCount)
      assert.ok(paper.slice(0, configs[type].singleChoiceCount).every(question => question.answer.length === 1))
      assert.ok(paper.slice(configs[type].singleChoiceCount).every(question => question.answer.length > 1))
      for (const question of paper) {
        assert.equal(new Set(Object.values(question.optionMapping)).size, question.options.length)
      }
    }
    assert.equal(second.filter(question => first.some(previous => previous.id === question.id)).length, 0)
  })
}

test('题量不足时明确拒绝组卷', () => {
  assert.throws(() => buildExamPaper([byId.get('MC1-1012')], configs.A), /题库数量不足/)
})
