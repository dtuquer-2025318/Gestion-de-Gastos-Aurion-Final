export const PARAMETROS_FISCALES = {
  // IGSS Laboral
  igssTrabajador: 0.0483, // 4.83% sobre salarios brutos

  // Rentas del Trabajo (ISR Salario Anual - Ley de Actualización Tributaria SAT)
  deduccionPersonalIsrAnual: 48000.0, // Q48,000 deducción fija personal
  tramoIsrBajo: 300000.0, // Hasta Q300,000 imponible
  tasaIsrBaja: 0.05, // 5%
  tasaIsrAlta: 0.07, // 7% para excedente de Q300,000
  cuotaFijaIsrAlto: 15000.0, // Q15,000 para el tramo alto

  // Rentas de Lucro (Servicios Profesionales / Honorarios)
  retencionIsrHonorarios: 0.05, // 5%
  umbralRetencionHonorarios: 2500.0, // Aplica retención si monto >= Q2,500

  // Rentas de Capital (Alquileres / Arrendamientos)
  isrAlquileres: 0.1, // 10% de ISR sobre la renta imponible de capital

  // IVA General (Guatemala)
  tasaIva: 0.12, // 12%
} as const;

export type ParametrosFiscales = typeof PARAMETROS_FISCALES;