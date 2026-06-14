/* global SurveyRepository, Chart */
/* exported cargarDatos */
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

let graficoBarra   = null
let graficoRadar   = null
let graficoEdad    = null
let graficoGenero  = null
let datosGlobales = [];

async function cargarDatos() {
  const estado = document.getElementById('estado');
  const total  = document.getElementById('total');
  estado.textContent = 'Cargando resultados...';
  total.textContent  = '';

  let data;
  try {
    const repository = new SurveyRepository();
    data = await repository.getAllSurveys();
  } catch (error) {
    estado.textContent = 'Error al cargar los datos.';
    console.error(error);
    return;
  }
  // Guardamos todo en la variable global
  datosGlobales = data; 
  
  // Llamamos a los filtros (que a su vez dibujan los gráficos)
  aplicarFiltros(); 
}

function aplicarFiltros() {
  // 1. Vemos qué casillas están tildadas
  const generosSeleccionados = Array.from(document.querySelectorAll('.filtro-genero:checked')).map(cb => cb.value);
  const edadesSeleccionadas = Array.from(document.querySelectorAll('.filtro-edad:checked')).map(cb => cb.value);

  // 2. Filtramos la base de datos completa
  const datosFiltrados = datosGlobales.filter(e => {
    
    // --- Lógica Género ---
    let generoMatch = false;
    if (e.genero && generosSeleccionados.includes(e.genero)) {
      generoMatch = true;
    } else if (!e.genero && generosSeleccionados.includes('Sin dato')) {
      generoMatch = true;
    }

    // --- Lógica Edad ---
    let edadGrupo = null;
    if (e.edad != null && typeof e.edad === 'number') {
      if (e.edad < 20)      edadGrupo = '< 20';
      else if (e.edad < 30) edadGrupo = '20–29';
      else if (e.edad < 40) edadGrupo = '30–39';
      else if (e.edad < 50) edadGrupo = '40–49';
      else if (e.edad < 60) edadGrupo = '50–59';
      else                  edadGrupo = '60+';
    }

    let edadMatch = false;
    if (edadGrupo && edadesSeleccionadas.includes(edadGrupo)) {
      edadMatch = true;
    } else if (!edadGrupo && edadesSeleccionadas.includes('Sin dato')) {
      edadMatch = true;
    }

    // El registro debe cumplir con AMBOS filtros (Género y Edad)
    return generoMatch && edadMatch;
  });

  // 3. Actualizamos los textos de arriba
  const estado = document.getElementById('estado');
  const total = document.getElementById('total');

  total.textContent = datosFiltrados.length + ' respuesta' + (datosFiltrados.length !== 1 ? 's' : '');

  if (datosFiltrados.length === 0) {
    estado.textContent = 'No hay encuestas que coincidan con estos filtros.';
  } else {
    estado.textContent = '';
  }

  // 4. Mandamos a renderizar todo nuevamente con la info ya recortada
  const promediosPorSeccion = calcularPromediosPorSeccion(datosFiltrados);
  const seccionesConDetalle = calcularDetallePorPregunta(datosFiltrados);

  renderBarras(promediosPorSeccion);
  renderRadar(promediosPorSeccion);
  renderDetalle(seccionesConDetalle);
  renderTabla(datosFiltrados.slice(0, 20));
  renderEdad(datosFiltrados);
  renderGenero(datosFiltrados);
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
    const sliders = s.columnas.filter(c => c.tipo === 'slider')
    const todos = sliders.flatMap(({ col }) => data.map(e => e[col]))
    return promedio(todos)
  })
}

function calcularDetallePorPregunta(data) {
  return SECCIONES.map(s => ({
    ...s,
    resultados: s.columnas.map(c => {
      if (c.tipo === 'sinon') { return { tipo: 'sinon', pct: pctSi(data.map(e => e[c.col])) } }
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
  contenedor.replaceChildren() // Método seguro y moderno para limpiar el contenedor
  
  secciones.forEach(s => {
    const div = document.createElement('div')
    div.className = 'tarjeta detalle-seccion'
    
    const h2 = document.createElement('h2')
    h2.style.color = s.color
    h2.style.borderLeft = `3px solid ${s.color}`
    h2.style.paddingLeft = '8px'
    h2.textContent = s.label
    div.appendChild(h2)

    const lista = document.createElement('div')
    lista.className = 'detalle-lista'

    s.columnas.forEach((c, i) => {
      /* eslint-disable-next-line security/detect-object-injection */
      const r = s.resultados[i]
      
      const fila = document.createElement('div')
      fila.className = 'detalle-fila'
      
      const lblSpan = document.createElement('span')
      lblSpan.className = 'detalle-label'
      lblSpan.textContent = c.label
      fila.appendChild(lblSpan)

      const wrapBarra = document.createElement('div')
      wrapBarra.className = 'detalle-barra-wrap'
      
      const barra = document.createElement('div')
      barra.className = 'detalle-barra'
      barra.style.background = `${s.color}22`
      barra.style.borderRight = `2px solid ${s.color}`
      
      const valSpan = document.createElement('span')
      valSpan.className = 'detalle-val'

      if (r.tipo === 'sinon') {
        barra.style.width = `${r.pct ?? 0}%`
        valSpan.style.fontSize = '0.78rem'
        valSpan.style.minWidth = '90px'
        valSpan.textContent = r.pct !== null ? `${r.pct}% dijeron Sí` : '—'
      } else {
        barra.style.width = `${r.val * 10}%`
        valSpan.textContent = r.val
      }

      wrapBarra.appendChild(barra)
      fila.appendChild(wrapBarra)
      fila.appendChild(valSpan)
      
      lista.appendChild(fila)
    })
    
    div.appendChild(lista)
    contenedor.appendChild(div)
  })
}

function badgeClass(val) {
  if (val <= 4) return 'low'
  if (val <= 7) return 'mid'
  return 'high'
}

// Reescrito para evitar innerHTML y vulnerabilidad XSS
function renderTabla(data) {
  const tbody = document.querySelector('#tabla-respuestas tbody')
  tbody.replaceChildren() 
  
  data.forEach(e => {
    const tr = document.createElement('tr')
    
    const tdFecha = document.createElement('td')
    tdFecha.textContent = new Date(e.created_at).toLocaleDateString('es-AR')
    tr.appendChild(tdFecha)
    
    const tdEdad = document.createElement('td')
    tdEdad.textContent = e.edad ? e.edad : '-'
    tr.appendChild(tdEdad)
    
    const tdGenero = document.createElement('td')
    tdGenero.textContent = e.genero ? e.genero : '-'
    tr.appendChild(tdGenero)

    SECCIONES.forEach(s => {
      const sliders = s.columnas.filter(c => c.tipo === 'slider')
      /* eslint-disable-next-line security/detect-object-injection */
      const vals = sliders.map(({ col }) => e[col]).filter(v => v != null && typeof v === 'number')
      const promedioCol = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—'
      
      const tdPromo = document.createElement('td')
      const badge = document.createElement('span')
      const classNum = parseFloat(promedioCol)
      badge.className = `badge badge-${isNaN(classNum) ? 'low' : badgeClass(classNum)}`
      badge.textContent = promedioCol
      tdPromo.appendChild(badge)
      tr.appendChild(tdPromo)
    })

    const tdCom = document.createElement('td')
    tdCom.className = 'comentario'
    tdCom.title = e.comentario || ''
    tdCom.textContent = e.comentario || '—'
    tr.appendChild(tdCom)
    
    tbody.appendChild(tr)
  })
}

function renderEdad(data) {
  const grupos = {
    '< 20': 0, '20–29': 0, '30–39': 0,
    '40–49': 0, '50–59': 0, '60+': 0
  }
  data.forEach(e => {
    const edad = e.edad
    if (edad == null || typeof edad !== 'number') return
    if (edad < 20)       grupos['< 20']++
    else if (edad < 30)  grupos['20–29']++
    else if (edad < 40)  grupos['30–39']++
    else if (edad < 50)  grupos['40–49']++
    else if (edad < 60)  grupos['50–59']++
    else                 grupos['60+']++
  })

  const ctx = document.getElementById('grafico-edad').getContext('2d')
  if (graficoEdad) graficoEdad.destroy()
  graficoEdad = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(grupos),
      datasets: [{
        label: 'Respuestas',
        data: Object.values(grupos),
        backgroundColor: '#3B6D1122',
        borderColor: '#3B6D11',
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0 },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: { grid: { display: false } }
      }
    }
  })
}

function renderGenero(data) {
  // Usamos Map para proteger la inyección
  const conteo = new Map()
  data.forEach(e => {
    const g = e.genero
    if (!g) return
    conteo.set(g, (conteo.get(g) || 0) + 1)
  })

  const colores = new Map([
    ['Masculino', '#378add'],
    ['Femenino', '#d4537e'],
    ['Otro', '#ba7517']
  ])

  const labels = Array.from(conteo.keys())
  const valores = labels.map(l => conteo.get(l))
  const bgColors = labels.map(l => colores.get(l) || '#999')

  const ctx = document.getElementById('grafico-genero').getContext('2d')
  if (graficoGenero) graficoGenero.destroy()
  graficoGenero = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: bgColors.map(c => c + '99'),
        borderColor: bgColors,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 13 }, padding: 16 }
        }
      }
    }
  })
}

cargarDatos()