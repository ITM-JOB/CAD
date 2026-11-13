const terms={
 'Annular hydraulic cylinder':'Cilindro hidráulico anular','Annular piston & pressure face':'Pistón anular de apriete',
 'Ball':'Bola','Bearing journal sleeve':'Casquillo del asiento de rodamiento','Bell housing':'Campana','Bolted spring cover':'Tapa portamuelles',
 'Carrier and output journal':'Portador y muñón de salida','Central input shaft':'Eje central de entrada','Clamp spring':'Muelle de apriete','Cover screw':'Tornillo de tapa',
 'Drilled stepped shaft':'Eje escalonado con conducto','Driven disc with splined centre':'Disco conducido con cubo estriado','Duplex-track chain sprocket':'Rueda para cadena de doble hilera',
 'End cover screw':'Tornillo de tapa lateral','Flywheel':'Volante de inercia','Foot-mounted housing':'Carcasa con patas','Hub retaining collar':'Collar de retención del cubo',
 'Inner race':'Aro interior','Intermediate plate':'Placa intermedia','Keyed hub and guide dogs':'Cubo con chavetero y guías','Lever pivot':'Pasador de palanca',
 'Lined friction disc':'Disco de fricción revestido','Offset journal':'Muñón desplazado','Offset member':'Rueda desplazada','Outer drum and reaction web':'Tambor exterior con alma',
 'Outer race':'Aro exterior','Parallel key':'Chaveta paralela','Pressure plate':'Plato de presión','Reaction plate':'Placa de reacción','Release bearing contact ring':'Anillo del collarín de desembrague',
 'Release lever':'Palanca de desembrague','Retaining end cover':'Tapa de retención','Return spring':'Muelle de retorno','Shaft seal':'Retén de eje',
 'Splined gearbox input shaft':'Eje de entrada estriado','Stationary oil distributor':'Distribuidor fijo de aceite','front end cover':'Tapa delantera','rear end cover':'Tapa trasera',
 Input:'Entrada',Output:'Salida',Bearings:'Rodamientos',Actuator:'Accionamiento','Disc stack':'Paquete de discos',Seals:'Obturación','Oil feed':'Alimentación de aceite',
 Stationary:'Soportes fijos','Pressure group':'Grupo de presión',Release:'Desembrague','Carrier members':'Elementos del portador'
};
export function denomination(name){
 const [,base,n]=name.match(/^(.*?)( \d+)?$/);
 return (terms[base]||base)+(n||'');
}

