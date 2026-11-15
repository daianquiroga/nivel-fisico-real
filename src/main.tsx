import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import './theme/global.css'
import App from './app/App'
import { pedirAlmacenamientoPersistente } from './lib/db/db'
import { registrarActualizaciones } from './lib/actualizar'

void pedirAlmacenamientoPersistente()
registrarActualizaciones()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
