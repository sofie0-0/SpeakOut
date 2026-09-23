import { beforeEach } from 'vitest'

// node 환경에는 localStorage가 없으므로 메모리 구현으로 대체한다.
class MemoryStorage {
  #data = new Map()
  get length() {
    return this.#data.size
  }
  key(i) {
    return [...this.#data.keys()][i] ?? null
  }
  getItem(k) {
    return this.#data.has(k) ? this.#data.get(k) : null
  }
  setItem(k, v) {
    this.#data.set(k, String(v))
  }
  removeItem(k) {
    this.#data.delete(k)
  }
  clear() {
    this.#data.clear()
  }
}

globalThis.localStorage = new MemoryStorage()

beforeEach(() => {
  globalThis.localStorage.clear()
})
