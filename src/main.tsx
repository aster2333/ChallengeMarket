import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './polyfills'
import './lib/i18n'

console.log('main.tsx is loading')

const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

if (!rootElement) {
  console.error('Root element not found!')
} else {
  console.log('Creating React root')
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
