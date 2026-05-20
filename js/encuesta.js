const campos = ['sabor', 'presentacion', 'temperatura', 'porcion']

// Actualizar etiquetas de sliders en tiempo real
campos.forEach(campo => {
  const slider = document.getElementById(campo)
  const label = document.getElementById(campo + '-val')
  if (slider && label) {
    slider.addEventListener('input', () => {
      label.textContent = slider.value + '/5'
    })
  }
})

// Enviar formulario
document.getElementById('form-encuesta').addEventListener('submit', async (e) => {
  e.preventDefault()

  const btn = document.getElementById('btn-enviar')
  const msg = document.getElementById('mensaje')
  btn.disabled = true
  btn.textContent = 'Enviando...'
  msg.textContent = ''
  msg.className = 'mensaje'

  const datos = {
    nombre_plato: document.getElementById('nombre_plato').value.trim(),
    sabor: Number(document.getElementById('sabor').value),
    presentacion: Number(document.getElementById('presentacion').value),
    temperatura: Number(document.getElementById('temperatura').value),
    porcion: Number(document.getElementById('porcion').value),
    comentario: document.getElementById('comentario').value.trim()
  }

  try {
    const { error } = await db.from('encuestas').insert([datos])
    if (error) throw error

    msg.textContent = '¡Encuesta enviada! Gracias por tu opinión.'
    msg.className = 'mensaje exito'
    e.target.reset()
    campos.forEach(c => {
      document.getElementById(c + '-val').textContent = '3/5'
    })
  } catch (err) {
    msg.textContent = 'Hubo un error al enviar. Intentá de nuevo.'
    msg.className = 'mensaje error'
    console.error(err)
  }

  btn.disabled = false
  btn.textContent = 'Enviar encuesta'
})
