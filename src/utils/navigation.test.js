import { describe, expect, it } from 'vitest'
import { findNeighbor, resolveCurrent } from './navigation.js'

const s = (position, proficiency = 0) => ({ id: `s${position}`, position, proficiency })
const all = [0, 1, 2]

describe('findNeighbor', () => {
  const list = [s(1), s(2), s(3), s(4), s(5)]
  it('위/아래로 한 칸 이동', () => {
    expect(findNeighbor(list, 's3', 'up', all).id).toBe('s2')
    expect(findNeighbor(list, 's3', 'down', all).id).toBe('s4')
  })
  it('첫 문장에서 위로 가면 마지막, 마지막에서 아래로 가면 첫 문장', () => {
    expect(findNeighbor(list, 's1', 'up', all).id).toBe('s5')
    expect(findNeighbor(list, 's5', 'down', all).id).toBe('s1')
  })
  it('필터를 통과하는 가장 가까운 문장으로 건너뛴다', () => {
    const l = [s(1, 0), s(2, 1), s(3, 2), s(4, 1), s(5, 0)]
    expect(findNeighbor(l, 's1', 'down', [0]).id).toBe('s5')
    expect(findNeighbor(l, 's5', 'up', [0]).id).toBe('s1')
    expect(findNeighbor(l, 's3', 'down', [1]).id).toBe('s4')
  })
  it('현재 문장이 필터에서 빠져 있어도 그 번호 기준으로 이동한다', () => {
    const l = [s(1, 0), s(2, 1), s(3, 0), s(4, 1), s(5, 0)]
    expect(findNeighbor(l, 's2', 'up', [0]).id).toBe('s1')
    expect(findNeighbor(l, 's2', 'down', [0]).id).toBe('s3')
  })
  it('순서가 섞인 입력도 번호 기준으로 처리한다', () => {
    expect(findNeighbor([s(3), s(1), s(2)], 's1', 'down', all).id).toBe('s2')
  })
  it('통과 문장이 없거나 문장이 없으면 null', () => {
    expect(findNeighbor(list, 's1', 'down', [])).toBeNull()
    expect(findNeighbor([], 'x', 'down', all)).toBeNull()
  })
  it('통과 문장이 현재 하나뿐이면 자기 자신', () => {
    expect(findNeighbor([s(1), s(2, 1)], 's1', 'down', [0]).id).toBe('s1')
  })
  it('현재 문장이 사라졌으면 끝에서 시작한다', () => {
    expect(findNeighbor(list, 'gone', 'down', all).id).toBe('s1')
    expect(findNeighbor(list, 'gone', 'up', all).id).toBe('s5')
  })
})

describe('resolveCurrent', () => {
  const l = [s(1, 0), s(2, 1), s(3, 1), s(4, 1), s(5, 0)]
  it('현재 문장이 통과하면 그대로', () => {
    expect(resolveCurrent(l, 's3', all).id).toBe('s3')
  })
  it('빠지면 번호가 가장 가까운 통과 문장, 같은 거리면 위쪽', () => {
    expect(resolveCurrent(l, 's2', [0]).id).toBe('s1')
    expect(resolveCurrent(l, 's3', [0]).id).toBe('s1')
    expect(resolveCurrent(l, 's4', [0]).id).toBe('s5')
  })
  it('통과 문장이 없으면 null', () => {
    expect(resolveCurrent(l, 's3', [2])).toBeNull()
  })
})
