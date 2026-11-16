/* Voz en español con la Web Speech API (incluida en Chrome de Android, sin internet si el celular tiene la voz instalada).
   Si no hay voz, la app sigue con pitidos y vibración. */

const CLAVE = 'nfr-voz'

export function vozActiva(): boolean {
  try {
    return localStorage.getItem(CLAVE) !== 'no'
  } catch {
    return true
  }
}

export function setVozActiva(v: boolean) {
  try {
    localStorage.setItem(CLAVE, v ? 'si' : 'no')
  } catch {
    /* sin almacenamiento */
  }
  if (!v) callar()
}

export function hayVoz(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function vozEspanol(): SpeechSynthesisVoice | undefined {
  const voces = window.speechSynthesis.getVoices()
  return voces.find((v) => v.lang === 'es-AR') ?? voces.find((v) => v.lang === 'es-US') ?? voces.find((v) => v.lang.startsWith('es'))
}

export function hablar(texto: string) {
  if (!hayVoz() || !vozActiva()) return
  try {
    const u = new SpeechSynthesisUtterance(texto)
    const v = vozEspanol()
    if (v) u.voice = v
    u.lang = v?.lang ?? 'es-AR'
    u.rate = 1.05
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch {
    /* sin voz */
  }
}

export function callar() {
  if (hayVoz()) window.speechSynthesis.cancel()
}
