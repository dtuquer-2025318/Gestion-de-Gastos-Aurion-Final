/**
 * Utility para verificación de integridad y tipo real de archivos por Magic Bytes.
 * Previene la subida de scripts maliciosos o ejecutables camuflados como imágenes o documentos.
 */

export interface FileValidationResult {
  isValid: boolean;
  detectedType?: string;
  error?: string;
}

const ALLOWED_MAGIC_BYTES: Record<string, number[]> = {
  // JPEG / JPG: FF D8 FF
  jpg: [0xFF, 0xD8, 0xFF],
  // PNG: 89 50 4E 47
  png: [0x89, 0x50, 0x4E, 0x47],
  // PDF: 25 50 44 46 (%PDF)
  pdf: [0x25, 0x50, 0x44, 0x46],
};

/**
 * Valida los firma de bytes de un Buffer contra los tipos permitidos.
 */
export function validateFileMagicBytes(
  buffer: Buffer,
  allowedExtensions: Array<'jpg' | 'png' | 'pdf'>
): FileValidationResult {
  if (!buffer || buffer.length < 4) {
    return { isValid: false, error: 'El archivo está corrupto o se encuentra vacío.' };
  }

  for (const ext of allowedExtensions) {
    const magic = ALLOWED_MAGIC_BYTES[ext];
    if (!magic) continue;

    // Se verifica si la cabecera del buffer coincide con la firma
    const matches = magic.every((byte, index) => buffer[index] === byte);
    if (matches) {
      return { isValid: true, detectedType: ext };
    }
  }

  return {
    isValid: false,
    error: 'El contenido real del archivo no coincide con los formatos permitidos (JPG, PNG, PDF).',
  };
}