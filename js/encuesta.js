// Mapa de pregunta número → nombre de columna en Supabase
const COLUMNAS = {
  1:  'q1_apariencia_general',
  2:  'q2_intensidad_color',
  3:  'q3_uniformidad_forma',
  4:  'q4_atractivo_emplatado',
  5:  'q5_aspecto_masa',
  6:  'q6_distincion_ingredientes',
  7:  'q7_intensidad_olor',
  8:  'q8_primera_impresion_olfat',
  9:  'q9_olor_verduras',
  10: 'q10_olor_legumbres',
  11: 'q11_aroma_masa_integral',
  12: 'q12_temperatura_muestra',
  13: 'q13_crocancia',
  14: 'q14_consistencia_masa',
  15: 'q15_intensidad_salado',
  16: 'q16_sabor_amargo',
  17: 'q17_sabor_picante',
  18: 'q18_integracion_sabores',
  19: 'q19_textura_relleno',
  20: 'q20_textura_poroto',
  21: 'q21_humedad_bocado',
  22: 'q22_sabor_general',
  23: 'q23_identificacion_sabores',
  24: 'q24_persistencia_sabor'
}

// Labels hedónicos para actualizar el slider en tiempo real
const LABELS = {
  1: 'me disgusta muchísimo',
  2: 'me disgusta mucho',
  3: 'me disgusta moderadamente',
  4: 'me disgusta levemente',
  5: 'ni me gusta ni me disgusta',
  6: 'me gusta levemente',
  7: 'me gusta moderadamente',
  8: 'me gusta mucho',
  9: 'me gusta muchísimo',
  10: 'me gusta extremadamente'
}

const touched = new Set()

// Actualiza visual del slider
function updateSlider(el) {
  const q = el.dataset.q
  const val = parseInt(el.value)
  const pct = ((val - 1) / 9) * 100
  el.style.background = `linear-gradient(to right,#3B6D11 ${pct}%,#EAF3DE ${pct}%)`
  document.getElementById('vb-' + q).textContent = val
  document.getElementById('vd-' + q).textContent = LABELS[val]
  touched.add(q)
  updateProgress()
}

// Barra de progreso
function updateProgress() {
  const n = touched.size
  document.getElementById('progress-label').textContent = n + ' de 24 respondidas'
  document.getElementById('progress-bar').style.width = (n / 24 * 100) + '%'
}

// Inicializar sliders al cargar
document.querySelectorAll('input[type=range]').forEach(el => {
  const pct = ((parseInt(el.value) - 1) / 9) * 100
  el.style.background = `linear-gradient(to right,#3B6D11 ${pct}%,#EAF3DE ${pct}%)`
})

// Leer todos los sliders y armar el objeto para Supabase
function leerRespuestas() {
  const datos = {}
  document.querySelectorAll('input[type=range]').forEach(el => {
    const num = parseInt(el.dataset.q)
    const col = COLUMNAS[num]
    if (col) datos[col] = parseInt(el.value)
  })
  datos.comentario = document.getElementById('comentario').value.trim() || null
  return datos
}

// Validar que todas las preguntas fueron tocadas
function validar() {
  if (touched.size < 24) {
    const faltantes = 24 - touched.size
    return `Faltan ${faltantes} pregunta${faltantes > 1 ? 's' : ''} por responder.`
  }
  return null
}

// Enviar al hacer click en el botón
async function enviarFeedback() {
  const btn = document.querySelector('.submit-btn')
  const successBox = document.getElementById('success')

  // Validación
  const error = validar()
  if (error) {
    alert(error)
    return
  }

  // Estado de carga
  btn.disabled = true
  btn.innerHTML = '<i class="ti ti-loader" style="font-size:16px;"></i> Enviando...'

  const datos = leerRespuestas()

  try {
    const { error: sbError } = await db.from('encuestas').insert([datos])
    if (sbError) throw sbError

    // Éxito
    successBox.style.display = 'block'
    successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    btn.style.display = 'none'

    // Resetear sliders después de 2 segundos
    setTimeout(() => {
      document.querySelectorAll('input[type=range]').forEach(el => {
        el.value = 5
        updateSlider(el)
      })
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