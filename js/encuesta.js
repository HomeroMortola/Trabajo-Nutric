// Mapa de pregunta número → nombre de columna en Supabase

/* global SurveyRepository */
/* exported updateSlider, selectPill, enviarFeedback */

const COLUMNAS = {
  1:  'q1_apariencia_general',
  2:  'q2_intensidad_color',
  3:  'q3_distincion_ingredientes',  // "Sí" / "No"
  4:  'q4_intensidad_olor',
  5:  'q5_olor_verduras',            // "Sí" / "No"
  6:  'q6_temperatura',
  7:  'q7_crocancia',
  8:  'q8_integracion_sabores',
  9:  'q9_sabor_general',
  10: 'q10_permanencia_sabor'
}
const COLUMNAS_VALIDAS = new Set(Object.values(COLUMNAS))

// Preguntas que son Sí/No (pills), no sliders
const PILL_QS = new Set([3, 5])

// Labels hedónicos para sliders
const LABELS = {
  1:  'me disgusta muchísimo',
  2:  'me disgusta mucho',
  3:  'me disgusta moderadamente',
  4:  'me disgusta levemente',
  5:  'ni me gusta ni me disgusta',
  6:  'me gusta levemente',
  7:  'me gusta moderadamente',
  8:  'me gusta mucho',
  9:  'me gusta muchísimo',
  10: 'me gusta extremadamente'
}

const LABELS_2 = {
  1:  'muy baja intensidad',
  2:  'baja intensidad',
  3:  'baja-moderada',
  4:  'moderada-baja',
  5:  'intensidad moderada',
  6:  'moderada-alta',
  7:  'alta-moderada',
  8:  'alta intensidad',
  9:  'muy alta intensidad',
  10: 'extremadamente alta'
}
const LABELS_3 = {
  1:  'muy poco tiempo',
  2:  'poco tiempo',
  3:  'poco-moderado',
  4:  'moderado-poco',
  5:  'tiempo moderado',
  6:  'moderado-largo',
  7:  'largo-moderado',
  8:  'tiempo prolongado',
  9:  'muy prolongado',
  10: 'extremadamente largo'
}

const LABELS_4 = {
  1:  'extremadamente bajo',
  2:  'muy bajo',
  3:  'bajo',
  4:  'moderadamente bajo',
  5:  'moderado',
  6:  'moderadamente alto',
  7:  'bastante alto',
  8:  'alto',
  9:  'muy alto',
  10: 'extremadamente alto'
}

const LABELS_5 = {
  1:  'extremadamente mal',
  2:  'muy mal',
  3:  'mal',
  4:  'moderadamente mal',
  5:  'moderado',
  6:  'moderadamente bien',
  7:  'bastante bien',
  8:  'bien',
  9:  'muy bien',
  10: 'extremadamente bien'
}



const TOTAL = 12
const touched = new Set()

// Respuestas de pills (Sí/No)
const pillAnswers = new Map()

// Actualiza visual del slider
function updateSlider(el) {
  const q = el.dataset.q
  const val = parseInt(el.value, 10)
  const pct = ((val - 1) / 9) * 100

  el.style.background =
    `linear-gradient(to right,#3B6D11 ${pct}%,#EAF3DE ${pct}%)`

  document.getElementById('vb-' + q).textContent = val
  document.getElementById('vd-' + q).textContent = LABELS[val]
  touched.add(String(q))
  updateProgress()
}

function updateSlider_2(el) {
  const q = el.dataset.q
  const val = parseInt(el.value, 10)
  const pct = ((val - 1) / 9) * 100

  el.style.background =
    `linear-gradient(to right,#3B6D11 ${pct}%,#EAF3DE ${pct}%)`

  document.getElementById('vb-' + q).textContent = val
  document.getElementById('vd-' + q).textContent = LABELS_2[val]
  touched.add(String(q))
  updateProgress()
}

function updateSlider_3(el) {
  const q = el.dataset.q
  const val = parseInt(el.value, 10)
  const pct = ((val - 1) / 9) * 100

  el.style.background =
    `linear-gradient(to right,#3B6D11 ${pct}%,#EAF3DE ${pct}%)`

  document.getElementById('vb-' + q).textContent = val
  document.getElementById('vd-' + q).textContent = LABELS_3[val]
  touched.add(String(q))
  updateProgress()
}

function updateSlider_4(el) {
  const q = el.dataset.q
  const val = parseInt(el.value, 10)
  const pct = ((val - 1) / 9) * 100

  el.style.background =
    `linear-gradient(to right,#3B6D11 ${pct}%,#EAF3DE ${pct}%)`

  document.getElementById('vb-' + q).textContent = val
  document.getElementById('vd-' + q).textContent = LABELS_4[val]
  touched.add(String(q))
  updateProgress()
}


function updateSlider_5(el) {
  const q = el.dataset.q
  const val = parseInt(el.value, 10)
  const pct = ((val - 1) / 9) * 100

  el.style.background =
    `linear-gradient(to right,#3B6D11 ${pct}%,#EAF3DE ${pct}%)`

  document.getElementById('vb-' + q).textContent = val
  document.getElementById('vd-' + q).textContent = LABELS_5[val]
  touched.add(String(q))
  updateProgress()
}


// Selección de pill (Sí/No)
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

// Barra de progreso
function updateProgress() {
  const n = touched.size
  document.getElementById('progress-label').textContent =
    n + ' de ' + TOTAL + ' respondidas'
  document.getElementById('progress-bar').style.width =
    (n / TOTAL * 100) + '%'
}

// Inicializar sliders al cargar
document.querySelectorAll('input[type=range]').forEach(el => {
  const pct = ((parseInt(el.value, 10) - 1) / 9) * 100

  el.style.background =
    `linear-gradient(to right,#3B6D11 ${pct}%,#EAF3DE ${pct}%)`
})

// Leer todas las respuestas y armar objeto para Supabase
function leerRespuestas() {
  const datos = {}

  // Sliders
  document.querySelectorAll('input[type=range]').forEach(el => {
    const num = parseInt(el.dataset.q, 10)

    if (Object.hasOwn(COLUMNAS, num)) {
      const col = COLUMNAS[num]

      if (COLUMNAS_VALIDAS.has(col)) {
        datos[col] = parseInt(el.value, 10)
      }
    }
  })

  // Pills (Sí/No)
  PILL_QS.forEach(q => {
    if (Object.hasOwn(COLUMNAS, q)) {
      const col = COLUMNAS[q]

      if (
        COLUMNAS_VALIDAS.has(col) &&
        pillAnswers.has(q)
      ) {
        datos[col] = pillAnswers.get(q)
      }
    }
  })

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

// Validar que todas las preguntas fueron respondidas
function validar() {
  if (touched.size < TOTAL) {
    const faltantes = TOTAL - touched.size
    return `Faltan ${faltantes} pregunta${faltantes > 1 ? 's' : ''} por responder.`
  }
  return null
}

// Enviar al hacer click en el botón
async function enviarFeedback() {
  const btn = document.querySelector('.submit-btn')

  const error = validar()
  if (error) {
    alert(error)
    return // Si hay error, detenemos la función aquí y NO redirige
  }

  btn.disabled = true
  btn.innerHTML = '<i class="ti ti-loader" style="font-size:16px;"></i> Enviando...'

  const datos = leerRespuestas()

  try {
    const repository = new SurveyRepository();
    await repository.saveSurvey(datos);

    
    window.location.href = 'gracias.html'

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