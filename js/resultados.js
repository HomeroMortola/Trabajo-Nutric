const SECCIONES = [
  {
    label: 'Vista',
    color: '#378add',
    columnas: [
      { col: 'q1_apariencia_general',     label: 'Apariencia general' },
      { col: 'q2_intensidad_color',        label: 'Intensidad del color' },
      { col: 'q3_uniformidad_forma',       label: 'Uniformidad de forma' },
      { col: 'q4_atractivo_emplatado',     label: 'Atractivo emplatado' },
      { col: 'q5_aspecto_masa',            label: 'Aspecto masa integral' },
      { col: 'q6_distincion_ingredientes', label: 'Distinción ingredientes' },
    ]
  },
  {
    label: 'Olfato',
    color: '#1d9e75',
    columnas: [
      { col: 'q7_intensidad_olor',         label: 'Intensidad olor' },
      { col: 'q8_primera_impresion_olfat', label: 'Primera impresión olfativa' },
      { col: 'q9_olor_verduras',           label: 'Olor verduras' },
      { col: 'q10_olor_legumbres',         label: 'Olor legumbres' },
      { col: 'q11_aroma_masa_integral',    label: 'Aroma masa integral' },
    ]
  },
  {
    label: 'Tacto y oído',
    color: '#d4537e',
    columnas: [
      { col: 'q12_temperatura_muestra', label: 'Temperatura muestra' },
      { col: 'q13_crocancia',           label: 'Crocancia' },
      { col: 'q14_consistencia_masa',   label: 'Consistencia masa' },
    ]
  },
  {
    label: 'Gusto y boca',
    color: '#e85d26',
    columnas: [
      { col: 'q15_intensidad_salado',   label: 'Intensidad salado' },
      { col: 'q16_sabor_amargo',        label: 'Sabor amargo' },
      { col: 'q17_sabor_picante',       label: 'Sabor picante' },
      { col: 'q18_integracion_sabores', label: 'Integración sabores' },
      { col: 'q19_textura_relleno',     label: 'Textura relleno' },
      { col: 'q20_textura_poroto',      label: 'Textura poroto' },
      { col: 'q21_humedad_bocado',      label: 'Humedad bocado' },
    ]
  },
  {
    label: 'Sabor post-ingesta',
    color: '#ba7517',
    columnas: [
      { col: 'q22_sabor_general',          label: 'Sabor general' },
      { col: 'q23_identificacion_sabores', label: 'Identificación sabores' },
      { col: 'q24_persistencia_sabor',     label: 'Persistencia del sabor' },
    ]
  }
]

let graficoBarra = null
let graficoRadar  = null

async function cargarDatos() {
  const estado = document.getElementById('estado')
  const total  = document.getElementById('total')
  estado.textContent = 'Cargando resultados...'
  total.textContent  = ''

  const { data, error } = await db
    .from('encuestas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    estado.textContent = 'Error al cargar los datos.'
    console.error(error)
    return
  }

  estado.textContent = ''
  total.textContent  = data.length + ' respuesta' + (data.length !== 1 ? 's' : '')

  if (data.length === 0) {
    estado.textContent = 'Todavía no hay respuestas.'
    return
  }

  const promediosPorSeccion  = calcularPromediosPorSeccion(data)
  const seccionesConDetalle  = calcularDetallePorPregunta(data)

  renderBarras(promediosPorSeccion)
  renderRadar(promediosPorSeccion)
  renderDetalle(seccionesConDetalle)
  renderTabla(data.slice(0, 20))
}

function promedio(vals) {
  const limpios = vals.filter(v => v != null)
  return limpios.length ? +(limpios.reduce((a, b) => a + b, 0) / limpios.length).toFixed(1) : 0
}

function calcularPromediosPorSeccion(data) {
  return SECCIONES.map(s => {
    const todos = s.columnas.flatMap(({ col }) => data.map(e => e[col]))
    return promedio(todos)
  })
}

function calcularDetallePorPregunta(data) {
  return SECCIONES.map(s => ({
    ...s,
    promedios: s.columnas.map(({ col }) => promedio(data.map(e => e[col])))
  }))
}

function renderBarras(promedios) {
  const ctx = document.getElementById('grafico-barras').getContext('2d')
  if (graficoBarra) graficoBarra.destroy()
  graficoBarra = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: SECCIONES.map(s => s.label),
      datasets: [{
        label: 'Promedio (1–10)',
        data: promedios,
        backgroundColor: SECCIONES.map(s => s.color + '22'),
        borderColor: SECCIONES.map(s => s.color),
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 10, ticks: { stepSize: 2 }, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } }
      }
    }
  })
}

function renderRadar(promedios) {
  const ctx = document.getElementById('grafico-radar').getContext('2d')
  if (graficoRadar) graficoRadar.destroy()
  graficoRadar = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: SECCIONES.map(s => s.label),
      datasets: [{
        label: 'Promedio',
        data: promedios,
        backgroundColor: 'rgba(232,93,38,0.12)',
        borderColor: '#e85d26',
        pointBackgroundColor: '#e85d26',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 10,
          ticks: { stepSize: 2, backdropColor: 'transparent' },
          grid: { color: 'rgba(0,0,0,0.07)' }
        }
      }
    }
  })
}

function renderDetalle(secciones) {
  const contenedor = document.getElementById('detalle-secciones')
  contenedor.innerHTML = ''
  secciones.forEach(s => {
    const div = document.createElement('div')
    div.className = 'tarjeta detalle-seccion'
    div.innerHTML = `
      <h2 style="color:${s.color};border-left:3px solid ${s.color};padding-left:8px;">${s.label}</h2>
      <div class="detalle-lista">
        ${s.columnas.map((c, i) => `
          <div class="detalle-fila">
            <span class="detalle-label">${c.label}</span>
            <div class="detalle-barra-wrap">
              <div class="detalle-barra" style="width:${s.promedios[i] * 10}%;background:${s.color}22;border-right:2px solid ${s.color}"></div>
            </div>
            <span class="detalle-val">${s.promedios[i]}</span>
          </div>
        `).join('')}
      </div>
    `
    contenedor.appendChild(div)
  })
}

function badgeClass(val) {
  if (val <= 4)  return 'low'
  if (val <= 7)  return 'mid'
  return 'high'
}

function renderTabla(data) {
  const tbody = document.querySelector('#tabla-respuestas tbody')
  tbody.innerHTML = ''
  data.forEach(e => {
    const fecha = new Date(e.created_at).toLocaleDateString('es-AR')
    const promediosFila = SECCIONES.map(s => {
      const vals = s.columnas.map(({ col }) => e[col]).filter(v => v != null)
      return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—'
    })
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${fecha}</td>
      ${promediosFila.map(p => `<td><span class="badge badge-${badgeClass(parseFloat(p))}">${p}</span></td>`).join('')}
      <td class="comentario" title="${e.comentario || ''}">${e.comentario || '—'}</td>
    `
    tbody.appendChild(tr)
  })
}

cargarDatos()
