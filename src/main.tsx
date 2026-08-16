import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AddressMasterDataProvider } from './context/AddressMasterDataContext'
import { AuthProvider } from './context/AuthContext'
import 'antd/dist/reset.css'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AddressMasterDataProvider>
        <App />
      </AddressMasterDataProvider>
    </AuthProvider>
  </StrictMode>,
)
