import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { FoldersProvider } from './hooks/FoldersContext.jsx'
import { FilterProvider } from './hooks/FilterContext.jsx'
import { CenterProvider } from './hooks/CenterContext.jsx'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/noto-sans-kr'
import './styles/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <FoldersProvider>
        <FilterProvider>
          <CenterProvider>
            <App />
          </CenterProvider>
        </FilterProvider>
      </FoldersProvider>
    </BrowserRouter>
  </StrictMode>,
)
