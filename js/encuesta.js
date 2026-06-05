// Mapa de pregunta número → nombre de columna en Supabase
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

const TOTAL = 12
const touched = new Set()

// Respuestas de pills (Sí/No)
const pillAnswers = {}

// Actualiza visual del slider
function updateSlider(el) {
  const q = el.dataset.q
  const val = parseInt(el.value)
  const pct = ((val - 1) / 9) * 100
  el.style.background = `linear-gradient(to right,#3B6D11 ${pct}%,#EAF3DE ${pct}%)`
  document.getElementById('vb-' + q).textContent = val
  document.getElementById('vd-' + q).textContent = LABELS[val]
  touched.add(String(q))
  updateProgress()
}

// Selección de pill (Sí/No)
function selectPill(el, q, val) {
  const container = document.getElementById('pills-' + q)
  container.querySelectorAll('.rpill').forEach(p => p.classList.remove('active'))
  el.classList.add('active')
  pillAnswers[q] = val
  touched.add(String(q))
  updateProgress()
}

// Barra de progreso
function updateProgress() {
  const n = touched.size
  document.getElementById('progress-label').textContent = n + ' de ' + TOTAL + ' respondidas'
  document.getElementById('progress-bar').style.width = (n / TOTAL * 100) + '%'
}

// Inicializar sliders al cargar
document.querySelectorAll('input[type=range]').forEach(el => {
  const pct = ((parseInt(el.value) - 1) / 9) * 100
  el.style.background = `linear-gradient(to right,#3B6D11 ${pct}%,#EAF3DE ${pct}%)`
})

// Leer todas las respuestas y armar objeto para Supabase
function leerRespuestas() {
  const datos = {}

  // Sliders
  document.querySelectorAll('input[type=range]').forEach(el => {
    const num = parseInt(el.dataset.q)
    const col = COLUMNAS[num]
    if (col) datos[col] = parseInt(el.value)
  })

  // Pills (Sí/No)
  PILL_QS.forEach(q => {
    const col = COLUMNAS[q]
    if (col && pillAnswers[q]) datos[col] = pillAnswers[q]
  })

  const fechaNac = document.getElementById('fecha-nac').value;
  if (fechaNac) {
    // Calculamos la edad a partir de la fecha
    const fn = new Date(fechaNac);
    const hoy = new Date();
    let edadCalculada = hoy.getFullYear() - fn.getFullYear();
    const mes = hoy.getMonth() - fn.getMonth();
    
    // Si todavía no cumplió años este año, le restamos 1
    if (mes < 0 || (mes === 0 && hoy.getDate() < fn.getDate())) {
      edadCalculada--;
    }
    
    datos.edad = edadCalculada; // Guardamos el número en Supabase
  }

  if (pillAnswers['genero']) {
    datos.genero = pillAnswers['genero'];
  }
  if (pillAnswers['genero']) {
    datos.genero = pillAnswers['genero'];
  }

  datos.comentario = document.getElementById('comentario').value.trim() || null
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
  const successBox = document.getElementById('success')

  const error = validar()
  if (error) {
    alert(error)
    return
  }

  btn.disabled = true
  btn.innerHTML = '<i class="ti ti-loader" style="font-size:16px;"></i> Enviando...'

  const datos = leerRespuestas()

  try {
    const { error: sbError } = await db.from('encuestas').insert([datos])
    if (sbError) throw sbError

    successBox.style.display = 'block'
    successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    btn.style.display = 'none'

    setTimeout(() => {
      // Resetear sliders
      document.querySelectorAll('input[type=range]').forEach(el => {
        el.value = 1
        updateSlider(el)
      })
      // Resetear pills
      document.querySelectorAll('.rpill').forEach(p => p.classList.remove('active'))
      Object.keys(pillAnswers).forEach(k => delete pillAnswers[k])

      document.getElementById('fecha-nac').value = '';
      document.getElementById('fecha-error').style.display = 'none';
      document.getElementById('comentario').value = ''
      touched.clear()
      updateProgress()
      successBox.style.display = 'none'
      btn.style.display = 'flex'
      btn.disabled = false
      btn.innerHTML = '<i class="ti ti-send" style="font-size:16px;"></i> Enviar evaluación completa'
    }, 3000)

  } catch (err) {
    console.error('Error al guardar:', err)
    alert('Hubo un error al enviar. Verificá tu conexión e intentá de nuevo.')
    btn.disabled = false
    btn.innerHTML = '<i class="ti ti-send" style="font-size:16px;"></i> Enviar evaluación completa'
  }
}