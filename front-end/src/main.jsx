import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/mobile.css'
import AppWithLanguage from './App.jsx'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <AppWithLanguage />
    </BrowserRouter>
)
