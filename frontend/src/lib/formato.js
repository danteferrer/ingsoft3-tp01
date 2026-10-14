export function formatearUltimoService(auto) {
  if (!auto.ultimoServicioFecha && !auto.ultimoServicioKm) return '—'
  const fecha = auto.ultimoServicioFecha
    ? new Date(auto.ultimoServicioFecha + 'T00:00:00').toLocaleDateString('es-AR')
    : '—'
  const km = auto.ultimoServicioKm != null ? `${auto.ultimoServicioKm.toLocaleString('es-AR')} km` : '—'
  return `${fecha} · ${km}`
}
