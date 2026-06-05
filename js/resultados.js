const SECCIONES = [
  {
    label: 'Vista',
    color: '#378add',
    columnas: [
      { col: 'q1_apariencia_general',      label: 'Apariencia general',        tipo: 'slider' },
      { col: 'q2_intensidad_color',         label: 'Intensidad del color',       tipo: 'slider' },
      { col: 'q3_distincion_ingredientes',  label: 'Distinción ingredientes',    tipo: 'sinon'  },
    ]
  },
  {
    label: 'Olfato',
    color: '#1d9e75',
    columnas: [
      { col: 'q4_intensidad_olor',  label: 'Intensidad olor',    tipo: 'slider' },
      { col: 'q5_olor_verduras',    label: 'Olor a verduras',    tipo: 'sinon'  },
    ]
  },
  {
    label: 'Tacto y oído',
    color: '#d4537e',
    columnas: [
      { col: 'q6_temperatura', label: 'Temperatura muestra', tipo: 'slider' },
      { col: 'q7_crocancia',   label: 'Crocancia',           tipo: 'slider' },
    ]
  },
  {
    label: 'Gusto y boca',
    color: '#e85d26',
    columnas: [
      { col: 'q8_integracion_sabores', label: 'Integración de sabores', tipo: 'slider' },
    ]
  },
  {
    label: 'Sabor',
    color: '#ba7517',
    columnas: [
      { col: 'q9_sabor_general',      label: 'Sabor general',          tipo: 'slider' },
      { col: 'q10_permanencia_sabor', label: 'Permanencia del sabor',  tipo: 'slider' },
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

  const promediosPorSeccion = calcularPromediosPorSeccion(data)
  const seccionesConDetalle = calcularDetallePorPregunta(data)

  renderBarras(promediosPorSeccion)
  renderRadar(promediosPorSeccion)
  renderDetalle(seccionesConDetalle)
  renderTabla(data.slice(0, 20))
}

// Para sliders: promedio numérico. Para Sí/No: ignorar en el promedio de sección (usar solo sliders)
function promedio(vals) {
  const limpios = vals.filter(v => v != null && typeof v === 'number')
  return limpios.length ? +(limpios.reduce((a, b) => a + b, 0) / limpios.length).toFixed(1) : 0
}

function pctSi(vals) {
  const limpios = vals.filter(v => v != null)
  if (!limpios.length) return null
  const si = limpios.filter(v => v === 'Sí').length
  return Math.round((si / limpios.length) * 100)
}

function calcularPromediosPorSeccion(data) {
  return SECCIONES.map(s => {
    // Solo columnas tipo slider para el gráfico de barras/radar
    const sliders = s.columnas.filter(c => c.tipo === 'slider')
    const todos = sliders.flatMap(({ col }) => data.map(e => e[col]))
    return promedio(todos)
  })
}

function calcularDetallePorPregunta(data) {
  return SECCIONES.map(s => ({
    ...s,
    resultados: s.columnas.map(c => {
      if (c.tipo === 'sinon') {
        return { tipo: 'sinon', pct: pctSi(data.map(e => e[c.col])) }
      }
      return { tipo: 'slider', val: promedio(data.map(e => e[c.col])) }
    })
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
        ${s.columnas.map((c, i) => {
          const r = s.resultados[i]
          if (r.tipo === 'sinon') {
            const pct = r.pct !== null ? r.pct + '% dijeron Sí' : '—'
            return `
              <div class="detalle-fila">
                <span class="detalle-label">${c.label}</span>
                <div class="detalle-barra-wrap">
                  <div class="detalle-barra" style="width:${r.pct ?? 0}%;background:${s.color}22;border-right:2px solid ${s.color}"></div>
                </div>
                <span class="detalle-val" style="font-size:0.78rem;min-width:90px;">${pct}</span>
              </div>`
          }
          return `
            <div class="detalle-fila">
              <span class="detalle-label">${c.label}</span>
              <div class="detalle-barra-wrap">
                <div class="detalle-barra" style="width:${r.val * 10}%;background:${s.color}22;border-right:2px solid ${s.color}"></div>
              </div>
              <span class="detalle-val">${r.val}</span>
            </div>`
        }).join('')}
      </div>
    `
    contenedor.appendChild(div)
  })
}

function badgeClass(val) {
  if (val <= 4) return 'low'
  if (val <= 7) return 'mid'
  return 'high'
}

function renderTabla(data) {
  const tbody = document.querySelector('#tabla-respuestas tbody')
  tbody.innerHTML = ''
  data.forEach(e => {
    const fecha = new Date(e.created_at).toLocaleDateString('es-AR')
    const promediosFila = SECCIONES.map(s => {
      const sliders = s.columnas.filter(c => c.tipo === 'slider')
      const vals = sliders.map(({ col }) => e[col]).filter(v => v != null && typeof v === 'number')
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