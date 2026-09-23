// 숙련도 필터는 통과시킬 숙련도 값의 배열이다. 기본은 전체([0, 1, 2]).
export const PROFICIENCIES = [0, 1, 2]
export const DEFAULT_FILTER = [...PROFICIENCIES]
export const PROFICIENCY_LABELS = { 0: '완전 생소', 1: '활용 미숙', 2: '획득' }

export function passesFilter(sentence, filter) {
  return filter.includes(sentence.proficiency)
}

// 원래 position(번호)은 그대로 두고 통과하는 문장만 남긴다.
export function filterSentences(sentences, filter) {
  return sentences.filter((s) => passesFilter(s, filter))
}

export function sortByPosition(sentences) {
  return [...sentences].sort((a, b) => a.position - b.position)
}

// 숙련도 0 → 1 → 2 순, 같으면 번호순. 문장 표 화면 전용.
export function sortByProficiency(sentences) {
  return [...sentences].sort((a, b) => a.proficiency - b.proficiency || a.position - b.position)
}
