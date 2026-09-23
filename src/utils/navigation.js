import { filterSentences, sortByPosition } from './filter.js'

// 위/아래 이동 대상을 고른다. 현재 번호보다 작은(up)/큰(down) 번호 중 필터를 통과하는
// 가장 가까운 문장. 없으면 반대쪽 끝으로 순환한다. 통과하는 문장이 없으면 null.
// 현재 문장이 필터에서 빠져 있어도 currentId의 position 기준으로 동작한다.
export function findNeighbor(sentences, currentId, direction, filter) {
  const passing = filterSentences(sortByPosition(sentences), filter)
  if (passing.length === 0) return null

  const current = sentences.find((s) => s.id === currentId)
  if (!current) return direction === 'up' ? passing[passing.length - 1] : passing[0]

  if (direction === 'up') {
    const before = passing.filter((s) => s.position < current.position)
    return before.length > 0 ? before[before.length - 1] : passing[passing.length - 1]
  }
  const after = passing.filter((s) => s.position > current.position)
  return after.length > 0 ? after[0] : passing[0]
}

// 필터를 바꿨을 때 중앙 문장을 정한다. 현재 문장이 통과하면 그대로, 아니면 번호가 가장 가까운
// 통과 문장(같은 거리면 위쪽). 통과하는 문장이 없으면 null.
export function resolveCurrent(sentences, currentId, filter) {
  const passing = filterSentences(sortByPosition(sentences), filter)
  if (passing.length === 0) return null

  const current = sentences.find((s) => s.id === currentId)
  if (!current) return passing[0]
  if (passing.some((s) => s.id === currentId)) return current

  let best = passing[0]
  for (const s of passing) {
    const d = Math.abs(s.position - current.position)
    if (d < Math.abs(best.position - current.position)) best = s
  }
  return best
}
