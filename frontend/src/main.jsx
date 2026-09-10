import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

window.addEventListener('error', (e) => {
  console.error('Global window error:', e)
  const root = document.getElementById('root')
  if (root && (!root.innerHTML || root.innerHTML.trim() === '')) {
    root.innerHTML = `<div style="padding: 24px; color: #ef4444; font-family: sans-serif;">
      <h2>Client Error Detected</h2>
      <pre style="white-space: pre-wrap; background: #fee2e2; padding: 14px; border-radius: 8px;">${e.message}\n${e.error?.stack || ''}</pre>
    </div>`
  }
})

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: '#ef4444', fontFamily: 'sans-serif' }}>
          <h2>Application Crash</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fee2e2', padding: 14, borderRadius: 8 }}>
            {this.state.error?.message}
            {'\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

try {
  const rootElem = document.getElementById('root')
  if (rootElem) {
    ReactDOM.createRoot(rootElem).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    )
  }
} catch (err) {
  console.error('Root render error:', err)
  const rootElem = document.getElementById('root')
  if (rootElem) {
    rootElem.innerHTML = `<div style="padding:20px;color:red;">Render error: ${err.message}</div>`
  }
}
