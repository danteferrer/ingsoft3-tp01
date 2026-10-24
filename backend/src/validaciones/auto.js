const PATENTE_VIEJA = /^[A-Z]{3}\d{3}$/;
const PATENTE_NUEVA = /^[A-Z]{2}\d{3}[A-Z]{2}$/;

function validarPatente(patente) {
  const valor = (patente || '').toUpperCase();
  if (PATENTE_VIEJA.test(valor) || PATENTE_NUEVA.test(valor)) {
    return { valida: true };
  }
  return { valida: false, error: 'Patente inválida. Formato esperado: AAA999 o AA999AA.' };
}

function validarAnio(anio) {
  const actual = new Date().getFullYear();
  if (anio >= 1900 && anio <= actual + 1) {
    return { valida: true };
  }
  return { valida: false, error: `Año inválido. Debe estar entre 1900 y ${actual + 1}.` };
}

function validarKilometraje(km) {
  if (km >= 0) {
    return { valida: true };
  }
  return { valida: false, error: 'El kilometraje no puede ser negativo.' };
}

function validarCamposAuto(datos) {
  const errores = [];
  if (datos.patente !== undefined) {
    const r = validarPatente(datos.patente);
    if (!r.valida) errores.push(r.error);
    else datos.patente = datos.patente.toUpperCase();
  }
  if (datos.anio !== undefined) {
    const r = validarAnio(datos.anio);
    if (!r.valida) errores.push(r.error);
  }
  if (datos.kilometraje !== undefined) {
    const r = validarKilometraje(datos.kilometraje);
    if (!r.valida) errores.push(r.error);
  }
  return errores;
}

function clasificarEstado(auto) {
  if (auto.kilometraje > 150000) {
    return 'para revisar';
  }
  if (auto.anio < new Date().getFullYear() - 10) {
    return 'antiguo';
  }
  if (auto.kilometraje < 10000) {
    return 'como nuevo';
  }
  return 'usado';
}

function kilometrosHastaProximoService(auto) {
  const INTERVALO = 10000;
  if (auto.ultimoServicioKm == null) {
    return INTERVALO - (auto.kilometraje % INTERVALO);
  }
  const recorridos = auto.kilometraje - auto.ultimoServicioKm;
  if (recorridos < 0) {
    return INTERVALO;
  }
  if (recorridos === 0) {
    return INTERVALO;
  }
  const faltan = INTERVALO - (recorridos % INTERVALO);
  if (faltan <= 500) {
    return 0;
  }
  return faltan;
}

module.exports = {
  validarPatente,
  validarAnio,
  validarKilometraje,
  validarCamposAuto,
  clasificarEstado,
  kilometrosHastaProximoService,
};
