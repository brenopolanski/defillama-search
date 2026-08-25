import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'

import { About } from '@/components/about/About'
import { isAboutWindow } from '@/lib/desktop'

import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>{isAboutWindow() ? <About /> : <App />}</React.StrictMode>,
)
