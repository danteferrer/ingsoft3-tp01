export async function listarMarcas() {
  const res = await fetch('/api/marcas');
  if (!res.ok) throw new Error('Error al obtener marcas');
  return res.json();
}
