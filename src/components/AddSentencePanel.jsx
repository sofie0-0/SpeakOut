import { useState } from 'react'
import { Upload } from 'lucide-react'
import { useFolders } from '../hooks/FoldersContext.jsx'
import { parseSentencesCsv } from '../utils/csv.js'
import Overlay from './Overlay.jsx'

// 문장 추가 패널 — 메인/문장 표 화면 공용 오버레이. 직접 입력 또는 CSV 업로드.
export default function AddSentencePanel({ defaultFolderId, onClose }) {
  const { folders, addSentence, addSentences } = useFolders()
  const [mode, setMode] = useState('file')
  const [folderId, setFolderId] = useState(
    folders.some((f) => f.id === defaultFolderId) ? defaultFolderId : (folders[0]?.id ?? ''),
  )
  const [en, setEn] = useState('')
  const [ko, setKo] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { ok: boolean, text: string }

  const folderName = folders.find((f) => f.id === folderId)?.name ?? ''

  async function handleFile(e) {
    const file = e.target.files[0]
    e.target.value = '' // 같은 파일을 다시 고를 수 있게
    if (!file) return
    setBusy(true)
    try {
      if (!/\.csv$/i.test(file.name)) {
        throw new Error('CSV 파일(.csv)만 올릴 수 있습니다. 엑셀은 CSV(UTF-8)로 저장해서 올려 주세요.')
      }
      const { items, skipped } = parseSentencesCsv(await file.text())
      const { added } = await addSentences(folderId, items)
      const skipText = skipped > 0 ? `, ${skipped}개 건너뜀` : ''
      setResult({ ok: true, text: `${folderName} 폴더에 ${added.length}개 추가${skipText}` })
    } catch (err) {
      setResult({ ok: false, text: `업로드를 취소했습니다. ${err.message}` })
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await addSentence(folderId, { en, ko })
      setEn('')
      setKo('')
      setResult({ ok: true, text: `${folderName} 폴더에 1개 추가` })
    } catch (err) {
      setResult({ ok: false, text: err.message })
    }
  }

  return (
    <Overlay title="문장 추가" onClose={onClose}>
      {folders.length === 0 ? (
        <p className="muted">추가할 폴더가 없습니다. 먼저 폴더를 만들어 주세요.</p>
      ) : (
        <>
          <label className="field">
            <span>추가할 폴더</span>
            <select value={folderId} onChange={(e) => setFolderId(e.target.value)}>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>

          <div className="segmented" role="radiogroup" aria-label="추가 방식">
            <label className="segment">
              <input type="radio" checked={mode === 'file'} onChange={() => setMode('file')} />
              파일로 추가
            </label>
            <label className="segment">
              <input type="radio" checked={mode === 'manual'} onChange={() => setMode('manual')} />
              직접 입력
            </label>
          </div>

          {mode === 'file' ? (
            <div className="field">
              <p className="muted">
                UTF-8로 저장한 CSV를 올려주세요. 열: id, en, ko, transcript (첫 행은 header, id 값은 무시)
              </p>
              <label className="button dropzone">
                <Upload size={16} aria-hidden="true" />
                CSV 파일 선택
                <input type="file" accept=".csv,text/csv" onChange={handleFile} disabled={busy} />
              </label>
            </div>
          ) : (
            <form className="field" onSubmit={handleSubmit}>
              <label className="field">
                <span>영어 원문</span>
                <textarea value={en} onChange={(e) => setEn(e.target.value)} rows={2} />
              </label>
              <label className="field">
                <span>한국어 직역</span>
                <textarea value={ko} onChange={(e) => setKo(e.target.value)} rows={2} />
              </label>
              <button type="submit" className="primary">
                추가
              </button>
            </form>
          )}

          {result && <p className={result.ok ? 'success' : 'error'}>{result.text}</p>}
        </>
      )}
    </Overlay>
  )
}
