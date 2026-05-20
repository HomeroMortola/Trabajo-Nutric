const campos = ['sabor', 'presentacion', 'temperatura', 'porcion']
const etiquetas = ['Sabor', 'Presentación', 'Temperatura', 'Porción']
const colores = ['#e85d26', '#1d9e75', '#378add', '#d4537e']

let graficoBarra = null
let graficoRadar = null

async function cargarDatos() {
  const estado = document.getElementById('estado')
  estado.textContent = 'Cargando resultados...'

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
  document.getElementById('total').textContent = data.length + ' respuestas'

  if (data.length === 0) {
    estado.textContent = 'Todavía no hay respuestas.'
    return
  }

  // Calcular promedios
  const promedios = campos.map(c => {
    const vals = data.map(e => e[c]).filter(v => v != null)
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0
  })

  renderBarras(promedios)
  renderRadar(promedios)
  renderTabla(data.slice(0, 15))
}

function renderBarras(promedios) {
  const ctx = document.getElementById('grafico-barras').getContext('2d')
  if (graficoBarra) graficoBarra.destroy()
  graficoBarra = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'Promedio (1–5)',
        data: promedios,
        backgroundColor: colores,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 5, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.06)' } },
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
      labels: etiquetas,
      datasets: [{
        label: 'Promedio',
        data: promedios,
        backgroundColor: 'rgba(232, 93, 38, 0.15)',
        borderColor: '#e85d26',
        pointBackgroundColor: '#e85d26',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 5,
          ticks: { stepSize: 1, backdropColor: 'transparent' },
          grid: { color: 'rgba(0,0,0,0.08)' }
        }
      }
    }
  })
}

function renderTabla(data) {
  const tbody = document.querySelector('#tabla-respuestas tbody')
  tbody.innerHTML = ''
  data.forEach(e => {
    const fecha = new Date(e.created_at).toLocaleDateString('es-AR')
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${fecha}</td>
      <td>${e.nombre_plato}</td>
      <td>${e.sabor ?? '—'}</td>
      <td>${e.presentacion ?? '—'}</td>
      <td>${e.temperatura ?? '—'}</td>
      <td>${e.porcion ?? '—'}</td>
      <td class="comentario">${e.comentario || '—'}</td>
    `
    tbody.appendChild(tr)
  })
}

cargarDatos()
