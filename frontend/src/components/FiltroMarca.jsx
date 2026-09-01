function FiltroMarca({ marcas, value, onChange }) {
  return (
    <label className="filtro-marca">
      Filtrar por marca
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todas</option>
        {marcas.map((marca) => (
          <option key={marca.id} value={marca.id}>
            {marca.nombre}
          </option>
        ))}
      </select>
    </label>
  )
}

export default FiltroMarca
