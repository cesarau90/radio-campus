import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Pantalla from './pages/Pantalla'
import Votar from './pages/Votar'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/pantalla" element={<Pantalla />} />
        <Route path="/votar" element={<Votar />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="*" element={<Navigate to="/votar" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
