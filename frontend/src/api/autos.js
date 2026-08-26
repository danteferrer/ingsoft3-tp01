export async function listarAutos(marcaId) {
  const url = marcaId ? `/api/autos?marcaId=${marcaId}` : '/api/autos';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al obtener autos');
  return res.json();
}
