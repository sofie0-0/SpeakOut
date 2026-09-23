import { X } from 'lucide-react'

// 화면 위에 열리는 패널의 공통 껍데기. 바깥(배경)을 누르면 닫힌다.
// side="right"면 오른쪽에서 열리는 드로어 모양이 된다.
export default function Overlay({ title, onClose, side, children }) {
  return (
    <div className={side ? 'overlay drawer' : 'overlay'} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="panel" role="dialog" aria-modal="true" aria-label={title}>
        <header className="panel-header">
          <h2>{title}</h2>
          <button type="button" className="ghost icon" onClick={onClose} aria-label="닫기" title="닫기">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}
