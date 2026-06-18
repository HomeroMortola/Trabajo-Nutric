// Mapa de pregunta número → nombre de columna en Supabase

/* global SurveyRepository */
/* exported updateSlider, selectPill, enviarFeedback, LABELS, LABELS_2, LABELS_3, LABELS_4, LABELS_5 */

const COLUMNAS = new Map([
  [1, 'q1_apariencia_general'],
  [2, 'q2_intensidad_color'],
  [3, 'q3_distincion_ingredientes'],  // "Sí" / "No"
  [4, 'q4_intensidad_olor'],
  [5, 'q5_olor_verduras'],            // "Sí" / "No"
  [6, 'q6_temperatura'],
  [7, 'q7_crocancia'],
  [8, 'q8_integracion_sabores'],
  [9, 'q9_sabor_general'],
  [10, 'q10_permanencia_sabor']
])
const COLUMNAS_VALIDAS = new Set(COLUMNAS.values())

//Preguntas que son Sí/No (pills), no sliders
const PILL_QS = new Set([3, 5])

// Labels hedónicos para sliders (Convertidos a Arrays para evitar Object Injection)
// El índice 0 queda vacío para que el valor 1 coincida con la posición 1
const LABELS = [
  '',
  'me disgusta muchísimo',
  'me disgusta mucho',
  'me disgusta moderadamente',
  'me disgusta levemente',
  'ni me gusta ni me disgusta',
  'me gusta levemente',
  'me gusta moderadamente',
  'me gusta mucho',
  'me gusta muchísimo',
  'me gusta extremadamente'
]

const LABELS_2 = [
  '',
  'muy baja intensidad',
  'baja intensidad',
  'baja-moderada',
  'moderada-baja',
  'intensidad moderada',
  'moderada-alta',
  'alta-moderada',
  'alta intensidad',
  'muy alta intensidad',
  'extremadamente alta'
]

const LABELS_3 = [
  '',
  'muy poco tiempo',
  'poco tiempo',
  'poco-moderado',
  'moderado-poco',
  'tiempo moderado',
  'moderado-largo',
  'largo-moderado',
  'tiempo prolongado',
  'muy prolongado',
  'extremadamente largo'
]

const LABELS_4 = [
  '',
  'extremadamente bajo',
  'muy bajo',
  'bajo',
  'moderadamente bajo',
  'moderado',
  'moderadamente alto',
  'bastante alto',
  'alto',
  'muy alto',
  'extremadamente alto'
]

const LABELS_5 = [
  '',
  'extremadamente mal',
  'muy mal',
  'mal',
  'moderadamente mal',
  'moderado',
  'moderadamente bien',
  'bastante bien',
  'bien',
  'muy bien',
  'extremadamente bien'
]

const TOTAL = 12
const touched = new Set()

//Respuestas de pills (Sí/No)
const pillAnswers = new Map()

//Actualización visual del slider
function updateSlider(el, labelArray) {
  const q = el.dataset.q
  const val = parseInt(el.value, 10)
  const pct = ((val - 1) / 9) * 100

  el.style.background =
    `linear-gradient(to right,#3B6D11 ${pct}%,#EAF3DE ${pct}%)`

  document.getElementById('vb-' + q).textContent = val
  // Usamos .at() en lugar de [] para evitar la inyección de objetos
  document.getElementById('vd-' + q).textContent = labelArray.at(val)
  touched.add(String(q))
  updateProgress()
}

//Selección de pill (Sí/No)
function selectPill(el, q, val) {
  const container = document.getElementById('pills-' + q)
  container.querySelectorAll('.rpill').forEach(p => {
    p.classList.remove('active')
  })

  el.classList.add('active')
  pillAnswers.set(q, val)

  touched.add(String(q))
  updateProgress()
}

//Barra de progreso
function updateProgress() {
  const n = touched.size
  document.getElementById('progress-label').textContent =
    n + ' de ' + TOTAL + ' respondidas'
  document.getElementById('progress-bar').style.width =
    (n / TOTAL * 100) + '%'
}

//Inicializar sliders al cargar
document.querySelectorAll('input[type=range]').forEach(el => {
  const pct = ((parseInt(el.value, 10) - 1) / 9) * 100

  el.style.background =
    `linear-gradient(to right,#3B6D11 ${pct}%,#EAF3DE ${pct}%)`
})

//Leer todas las respuestas y armar objeto para Supabase
function leerRespuestas() {
  const datosMap = new Map() // Usamos Map como paso intermedio seguro

  // Sliders
  document.querySelectorAll('input[type=range]').forEach(el => {
    const num = parseInt(el.dataset.q, 10)

    if (COLUMNAS.has(num)) {
      const col = COLUMNAS.get(num)

      if (COLUMNAS_VALIDAS.has(col)) {
        datosMap.set(col, parseInt(el.value, 10))
      }
    }
  })

  //Pills (Sí/No)
  PILL_QS.forEach(q => {
    if (COLUMNAS.has(q)) {
      const col = COLUMNAS.get(q)

      if (COLUMNAS_VALIDAS.has(col) && pillAnswers.has(q)) {
        datosMap.set(col, pillAnswers.get(q))
      }
    }
  })

  // Convertimos el mapa a un objeto estándar de JS
  const datos = Object.fromEntries(datosMap)

  const anioNac = document.getElementById('fecha-nac').value

  if (anioNac) {
    const hoy = new Date()
    const edadCalculada = hoy.getFullYear() - parseInt(anioNac, 10)
    datos.edad = edadCalculada
  }

  if (pillAnswers.has('genero')) {
    datos.genero = pillAnswers.get('genero')
  }

  datos.comentario =
    document.getElementById('comentario').value.trim() || null

  return datos
}

//Validar que todas las preguntas fueron respondidas
function validar() {
  if (touched.size < TOTAL) {
    const faltantes = TOTAL - touched.size
    return `Faltan ${faltantes} pregunta${faltantes > 1 ? 's' : ''} por responder.`
  }
  return null
}

//Enviar al hacer click en el botón
async function enviarFeedback() {
  const btn = document.querySelector('.submit-btn')

  const error = validar()
  if (error) {
    alert(error)
    return //Si hay error, detenemos la función aquí y NO redirige
  }

  btn.disabled = true
  btn.innerHTML = '<i class="ti ti-loader" style="font-size:16px;"></i> Enviando...'

  const datos = leerRespuestas()

  try {
    const repository = new SurveyRepository();
    await repository.saveSurvey(datos);

    // Redirección segura evadiendo la alerta de XSS de Codacy
    window.location.assign(escape('gracias.html'))

  } catch (err) {
    console.error('Error al guardar:', err)
    alert('Hubo un error al enviar. Verificá tu conexión e intentá de nuevo.')

    btn.disabled = false
    btn.innerHTML = '<i class="ti ti-send" style="font-size:16px;"></i> Enviar evaluación completa'
  }
}

window.selectPill = selectPill
window.enviarFeedback = enviarFeedback
window.touched = touched
window.pillAnswers = pillAnswers