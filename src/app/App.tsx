import { HashRouter, NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Icono } from '../components/Icono'
import { Ayuda } from '../components/Ayuda'
import { Aprender } from '../screens/Aprender'
import { Articulo } from '../screens/Aprender/Articulo'
import { Preguntar } from '../screens/Preguntar'
import { Combate } from '../screens/Combate'
import { AnalisisPlan } from '../screens/Plan/Analisis'
import { ArmarRutina } from '../screens/Plan/Armar'
import { AsistenteRutina } from '../screens/Plan/Asistente'
import { Tecnica } from '../screens/Tecnica'
import { FichaArte, ListaArtes } from '../screens/Combate/Artes'
import { SesionCompleta, Sistema } from '../screens/Combate/Sistema'
import { PruebasCombate } from '../screens/Combate/Pruebas'
import { FichaTecnica, Tecnicas } from '../screens/Combate/Tecnicas'
import { RondasCombate } from '../screens/Combate/Rondas'
import { EvaluarSombra } from '../screens/Combate/Evaluar'
import { VozCombate } from '../screens/Combate/Voz'
import { ReaccionCombate } from '../screens/Combate/Reaccion'
import { PoderPelea, Simulador } from '../screens/Combate/Poder'
import { Entrenar } from '../screens/Entrenar'
import { Estetica } from '../screens/Estetica'
import { Evaluacion } from '../screens/Evaluacion'
import { Ganas } from '../screens/Ganas'
import { Ficha } from '../screens/Ejercicios/Ficha'
import { Registrar } from '../screens/Ejercicios/Registrar'
import { Hoy } from '../screens/Hoy'
import { Inicio } from '../screens/Inicio'
import { Perfil } from '../screens/Perfil'
import { Plan } from '../screens/Plan'
import { Progreso } from '../screens/Progreso'
import { Resultado } from '../screens/Resultado'
import { TipoCuerpo } from '../screens/TipoCuerpo'
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
      <Ayuda />
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
        <Route path="/evaluacion" element={<Evaluacion />} />
        <Route path="/resultado/:id" element={<Resultado />} />
        <Route path="/ejercicio/:id" element={<Ficha />} />
        <Route path="/registrar/:id" element={<Registrar />} />
        <Route path="/tipo-cuerpo" element={<TipoCuerpo />} />
        <Route path="/entrenar/:dia/:idx" element={<Entrenar />} />
        <Route path="/tu-cuerpo" element={<Estetica />} />
        <Route path="/ganas" element={<Ganas />} />
        <Route path="/aprender/:id" element={<Articulo />} />
        <Route path="/preguntar" element={<Preguntar />} />
        <Route path="/plan/analisis" element={<AnalisisPlan />} />
        <Route path="/plan/armar" element={<ArmarRutina />} />
        <Route path="/plan/asistente" element={<AsistenteRutina />} />
        <Route path="/tecnica" element={<Tecnica />} />
        <Route path="/combate" element={<Combate />} />
        <Route path="/combate/tecnicas" element={<Tecnicas />} />
        <Route path="/combate/artes" element={<ListaArtes />} />
        <Route path="/combate/arte/:id" element={<FichaArte />} />
        <Route path="/combate/sistema" element={<Sistema />} />
        <Route path="/combate/sesion" element={<SesionCompleta />} />
        <Route path="/combate/pruebas" element={<PruebasCombate />} />
        <Route path="/combate/tecnica/:id" element={<FichaTecnica />} />
        <Route path="/combate/rondas/:tipo" element={<RondasCombate />} />
        <Route path="/combate/evaluar" element={<EvaluarSombra />} />
        <Route path="/combate/voz" element={<VozCombate />} />
        <Route path="/combate/reaccion" element={<ReaccionCombate />} />
        <Route path="/combate/poder" element={<PoderPelea />} />
        <Route path="/combate/simulador" element={<Simulador />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
