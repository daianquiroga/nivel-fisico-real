import { HashRouter, NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Icono } from '../components/Icono'
import { Aprender } from '../screens/Aprender'
import { Hoy } from '../screens/Hoy'
import { Inicio } from '../screens/Inicio'
import { Perfil } from '../screens/Perfil'
import { Plan } from '../screens/Plan'
import { Progreso } from '../screens/Progreso'
import s from './layout.module.css'

const PESTANAS = [
  { ruta: '/', nombre: 'Hoy', icono: 'hoy' },
  { ruta: '/plan', nombre: 'Plan', icono: 'plan' },
  { ruta: '/progreso', nombre: 'Progreso', icono: 'progreso' },
  { ruta: '/aprender', nombre: 'Aprender', icono: 'aprender' },
  { ruta: '/perfil', nombre: 'Perfil', icono: 'perfil' },
]

function ConBarra() {
  return (
    <div className={s.app}>
      <main className={s.contenido}>
        <Outlet />
      </main>
      <nav className={s.nav} aria-label="Secciones">
        {PESTANAS.map((p) => (
          <NavLink
            key={p.ruta}
            to={p.ruta}
            end={p.ruta === '/'}
            className={({ isActive }) => `${s.pestana} ${isActive ? s.activa : ''}`}
          >
            <Icono nombre={p.icono} />
            {p.nombre}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<ConBarra />}>
          <Route path="/" element={<Hoy />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="/aprender" element={<Aprender />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>
        <Route path="/inicio" element={<Inicio />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
