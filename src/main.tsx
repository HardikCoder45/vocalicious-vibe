import { createRoot } from 'react-dom/client'
import { StrictMode, Component, ErrorInfo, ReactNode } from 'react'
import App from './App.tsx'
import './index.css'

// Error boundary to catch and display errors
class ErrorBoundary extends Component<{ children: ReactNode }> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          textAlign: 'center'
        }}>
          <h1 style={{ marginBottom: '20px' }}>Something went wrong</h1>
          <p style={{ marginBottom: '20px' }}>
            The application encountered an error. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '10px 20px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Try to load the app with appropriate error handling
try {
  const rootElement = document.getElementById("root")
  
  if (!rootElement) {
    throw new Error("Failed to find the root element")
  }
  
  const root = createRoot(rootElement)
  
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  )
  
  console.log('Application rendered successfully')
} catch (error) {
  console.error('Failed to start the application:', error)
  
  // Show a basic error message if the app can't even mount
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>Application Error</h1>
      <p>The application failed to start. Please try refreshing the page.</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">
        Refresh Page
      </button>
    </div>
  `
}
