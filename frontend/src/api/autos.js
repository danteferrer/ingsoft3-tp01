export async function listarAutos(marcaId) {
  const url = marcaId ? `/api/autos?marcaId=${marcaId}` : '/api/autos';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al obtener autos');
  return res.json();
}

export async function crearAuto(auto) {
  const res = await fetch('/api/autos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(auto),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear auto');
  return data;
}

export async function actualizarAuto(id, auto) {
  const res = await fetch(`/api/autos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(auto),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar auto');
  return data;
}

export async function eliminarAuto(id) {
  const res = await fetch(`/api/autos/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al eliminar auto');
  }
}
