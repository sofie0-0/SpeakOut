import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import ProficiencyBadge from './ProficiencyBadge.jsx'

// 문장 표 — 읽기 전용 열(발화·숙련도)과 행 안 수정/삭제. 발화·듣기 기능은 없다.
export default function SentenceTable({ sentences, onSelect, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({ en: '', ko: '' })
  const [error, setError] = useState('')

  function startEdit(sentence) {
    setEditingId(sentence.id)
    setDraft({ en: sentence.en, ko: sentence.ko })
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setError('')
  }

  async function saveEdit() {
    try {
      await onUpdate(editingId, draft)
      setEditingId(null)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(sentence) {
    if (!window.confirm(`${sentence.position}번 문장과 발화 기록을 삭제할까요?`)) return
    try {
      await onDelete(sentence.id)
      if (editingId === sentence.id) cancelEdit()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="table-wrap">
      {error && <p className="notice error">{error}</p>}
      <table className="sentence-table">
        <thead>
          <tr>
            <th className="col-no">번호</th>
            <th>영어</th>
            <th>한국어</th>
            <th className="col-tr">내가 말한 내용</th>
            <th className="col-pf">숙련도</th>
            <th className="col-actions">
              <span className="sr-only">관리</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sentences.map((s) =>
            s.id === editingId ? (
              <tr key={s.id} className="editing">
                <td className="no">{s.position}</td>
                <td>
                  <textarea
                    value={draft.en}
                    onChange={(e) => setDraft({ ...draft, en: e.target.value })}
                    aria-label="영어"
                  />
                </td>
                <td>
                  <textarea
                    value={draft.ko}
                    onChange={(e) => setDraft({ ...draft, ko: e.target.value })}
                    aria-label="한국어"
                  />
                </td>
                <td className="tr">{s.last_transcript}</td>
                <td>
                  <ProficiencyBadge level={s.proficiency} />
                </td>
                <td className="actions">
                  <div className="actions-inner">
                    <button type="button" className="primary" onClick={saveEdit}>
                      저장
                    </button>
                    <button type="button" onClick={cancelEdit}>
                      취소
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={s.id} className="clickable" onClick={() => onSelect(s)}>
                <td className="no">{s.position}</td>
                <td className="en">{s.en.trim() ? s.en : '(없음)'}</td>
                <td className="ko">{s.ko.trim() ? s.ko : '(없음)'}</td>
                <td className="tr">{s.last_transcript}</td>
                <td>
                  <ProficiencyBadge level={s.proficiency} />
                </td>
                <td className="actions" onClick={(e) => e.stopPropagation()}>
                  <div className="actions-inner">
                    <button type="button" className="ghost icon" onClick={() => startEdit(s)} aria-label="수정" title="수정">
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="ghost danger icon"
                      onClick={() => handleDelete(s)}
                      aria-label="삭제"
                      title="삭제"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  )
}
