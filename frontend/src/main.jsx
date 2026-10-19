import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

// El DSN de un front no es secreto: solo sirve para enviar datos, no para
// leerlos, y cualquier app web lo expone en el JS que baja el navegador.
Sentry.init({
  dsn: 'https://b8e451cace60527b49e74d00041d3279@o4512284497674240.ingest.us.sentry.io/4512284503244800',
  environment: window.location.hostname,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
