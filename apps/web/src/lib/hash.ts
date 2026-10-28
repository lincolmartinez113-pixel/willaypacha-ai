/** Huella SHA-256 en el propio cliente (crypto.subtle). 127.0.0.1 y https son
 *  contextos seguros, así que subtle está disponible en la demo local. */
export async function sha256(archivo: File): Promise<string> {
  const buffer = await archivo.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
