import { Routes, Route, Navigate } from 'react-router-dom'
import PracticePage from './pages/PracticePage.jsx'
import TablePage from './pages/TablePage.jsx'

// 화면(URL) 목록. 폴더 패널과 문장 추가 패널은 URL이 없고 화면 위에 열리는 오버레이다.
export default function App() {
  return (
    <Routes>
      {/* 앱을 열면 메인 화면으로. 첫 폴더로의 이동은 PracticePage가 한다 */}
      <Route path="/" element={<PracticePage />} />
      <Route path="/folders/:folderId" element={<PracticePage />} />
      <Route path="/folders/:folderId/table" element={<TablePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
