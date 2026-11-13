/**
 * Clasificación funcional respecto al bastidor, no respecto a la pieza vecina.
 * Los 20 estudios interpretativos aún carecen de juntas cinemáticas validadas.
 */
export function classifyPart(part, key) {
  const verified = ['A', 'B', 'C'].includes(key);
  const group = (part.group || '').toLowerCase();
  const name = (part.name || '').toLowerCase();
  const drive = part.drive || 'fixed';
  if (verified) {
    const moving = drive !== 'fixed' && drive !== 'stationary';
    return {
      category: moving ? 'moving' : 'fixed',
      basis: moving ? 'Gira o se desplaza con el grupo cinemático definido.' : 'No tiene movimiento impuesto respecto al bastidor.',
      confidence: key === 'A' ? 'interpretativa' : 'modelo cinemático',
    };
  }
  // Las reglas siguientes son *didácticas*, no una verificación de juntas.
  const stationary = /carcasa|cárter|bastidor|estator|alojamiento|soporte|base|tapa de apoyo|columna tubular/.test(name)
    || /^(carcasa|bastidor|estator|apoyos|tapas)$/.test(group);
  const moving = /aro interior|aro exterior|bola|rodillo|jaula|eje|árbol|husillo|rueda|engranaje|piñón|polea|rotor|pistón|pasador de eslabón|cadena|eslabón|separador|disco|placa de presión|semipolea|sinfín/.test(name)
    || /^(cadena |eje |árbol|husillo|rotor|ruedas|variador|etapa )/.test(group);
  // El aro exterior se considera fijo en los apoyos interpretativos.
  if (/aro exterior/.test(name)) return {category:'fixed',basis:'Aro exterior supuesto inmovilizado en su alojamiento.',confidence:'interpretativa'};
  if (/aro interior/.test(name)) return {category:'moving',basis:'Aro interior supuesto solidario con el eje.',confidence:'interpretativa'};
  if (stationary) return {category:'fixed',basis:'Elementos de soporte y envolvente; fijación inferida por su función.',confidence:'interpretativa'};
  if (moving) return {category:'moving',basis:'Elemento de transmisión o guiado con movimiento funcional esperado.',confidence:'interpretativa'};
  // Hardware puede pertenecer a ambos sistemas: se marca como hipótesis visible.
  return {category:'fixed',basis:'Asignación provisional: comprobar a qué cuerpo está unido.',confidence:'por verificar'};
}

export function subgroupFor(part) {
  if (part.subassembly) return part.subassembly;
  if (/^(Rodamiento |Bearings$)/i.test(part.group || '')) return part.group;
  return null;
}
export function bearingPartKind(part) {
  if (part.subPart) return part.subPart;
  const id=String(part.id);
  if (/-inner$|-int$/.test(id)) return 'inner';
  if (/-outer$|-ext$/.test(id)) return 'outer';
  if (/-cage$/.test(id)) return 'cage';
  if (/-ball-\d+$|-r\d+$/.test(id)) return 'rolling';
  return null;
}
export function studyNotice(key) {
 return ['A','B','C'].includes(key)
   ? 'Clasificación respecto al bastidor según las juntas del modelo; no implica comprobación de fabricación.'
   : 'Clasificación funcional estimada: la cinemática real de esta lámina aún debe verificarse.';
}
