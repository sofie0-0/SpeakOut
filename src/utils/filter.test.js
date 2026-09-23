import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTER, filterSentences, sortByProficiency } from './filter.js'

const s = (position, proficiency) => ({ id: `s${position}`, position, proficiency })
const list = [s(1, 2), s(2, 0), s(3, 1), s(4, 0)]

describe('filter', () => {
  it('기본 필터는 전체를 통과시키고 번호를 유지한다', () => {
    expect(filterSentences(list, DEFAULT_FILTER).map((x) => x.position)).toEqual([1, 2, 3, 4])
  })
  it('선택한 숙련도만 남기고 원래 번호를 유지한다', () => {
    expect(filterSentences(list, [0]).map((x) => x.position)).toEqual([2, 4])
  })
  it('아무것도 선택하지 않으면 0개', () => {
    expect(filterSentences(list, [])).toEqual([])
  })
  it('숙련도순은 0→1→2, 같으면 번호순이며 원본을 바꾸지 않는다', () => {
    expect(sortByProficiency(list).map((x) => x.position)).toEqual([2, 4, 3, 1])
    expect(list.map((x) => x.position)).toEqual([1, 2, 3, 4])
  })
})
