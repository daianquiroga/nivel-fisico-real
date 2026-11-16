import { describe, expect, it } from 'vitest'
import { armarTextoClaude, type DatosPregunta } from './preguntar'

const d: DatosPregunta = {
  hoy: '2026-11-16',
  nivel: 'principiante',
  perfil: { sexo: 'h', edad: 30, alturaCm: 175, pesoKg: 72.5, objetivos: { estetica: 50, condicion: 30, combate: 20 }, zonas: ['brazos'], limitaciones: ['rodilla'], aptoCuestionario: true, diasSinFumar: 40 },
  evaluacion: { fecha: '2026-11-10T10:00:00', condicion: 54.4, areas: { cardio: 38, fuerza: 47 } },
  plan: [
    { dia: 'Lunes', sesiones: [{ titulo: 'Fuerza A', lugar: 'Casa', desde: '19:30', hasta: '20:15', minutos: 45, ejercicios: ['Flexión 3×8-12'] }] },
    { dia: 'Martes', sesiones: [] },
  ],
  sesionesHechas: [{ fecha: '2026-11-12T20:00:00', titulo: 'Fuerza A', version: 'completa', minutos: 44, esfuerzo: 7, nota: 'me costó' }],
  ejercicios: [{ nombre: 'Flexión', fecha: '2026-11-12T20:00:00', series: '10 (RIR 2), 9 (RIR 1)' }],
  controles: [{ fecha: '2026-11-16', sueno: 5.5, energia: 3, dolor: 'molestia', zona: 'rodilla' }],
  pasosPromedio: 7400,
  consejos: ['Dormiste poco: versión reducida.'],
}

describe('preguntarle a Claude', () => {
  it('arma el texto con todo y la pregunta', () => {
    const t = armarTextoClaude(d, { horarios: true, salud: true, diario: true }, '¿Cómo mejoro mis flexiones?')
    expect(t).toContain('Mi pregunta: ¿Cómo mejoro mis flexiones?')
    expect(t).toContain('paso a paso')
    expect(t).toContain('- hombre, 30 años, 175 cm, 72,5 kg')
    expect(t).toContain('Condición física: 54 de 100')
    expect(t).toContain('cardio 38, fuerza y resistencia 47')
    expect(t).toContain('- Lunes 19:30–20:15 en Casa: Fuerza A (45 min): Flexión 3×8-12')
    expect(t).not.toContain('Martes')
    expect(t).toContain('esfuerzo 7/10 · nota: me costó')
    expect(t).toContain('durmió 5,5 h, energía 3/5, molestia en rodilla')
    expect(t).toContain('Cuidar: rodilla')
    expect(t).toContain('7.400 por día')
  })

  it('saca horarios, salud y diario si se pide, y nunca habla de fotos', () => {
    const t = armarTextoClaude(d, { horarios: false, salud: false, diario: false })
    expect(t).toContain('Mi pregunta: (escribila acá)')
    expect(t).toContain('- Lunes: Fuerza A')
    expect(t).not.toContain('19:30')
    expect(t).not.toContain('Casa')
    expect(t).not.toContain('rodilla')
    expect(t).not.toContain('fumar')
    expect(t).not.toContain('me costó')
    expect(t.toLowerCase()).not.toContain('foto')
  })
})
