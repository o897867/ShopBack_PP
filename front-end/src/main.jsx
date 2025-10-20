import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/mobile.css'
import AppWithLanguage from './App.jsx'

createRoot(document.getElementById('root')).render(
    <AppWithLanguage />
)
