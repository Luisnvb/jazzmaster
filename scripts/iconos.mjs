// Iconos de la web (Trastero251): la guitarra del dibujo scripts/guitarra.png (fondo
// transparente), recortada a su contorno.
// - Favicon y guitarra de la cabecera: la guitarra sola, sin fondo.
// - Iconos de la app instalada: la guitarra sobre el color de acento de la web.
// Uso: node scripts/iconos.mjs  (npm run iconos) → public/favicon.png y public/iconos/*.png
import sharp from 'sharp';

const ACENTO = '#3f7a85'; // igual que --acento
const TRANSPARENTE = { r: 0, g: 0, b: 0, alpha: 0 };

const guitarra = await sharp('scripts/guitarra.png').trim({ threshold: 20 }).toBuffer();

/** La guitarra con `alto` (0–1) del lado del icono; se centra al componerla. */
const aEscala = (lado, alto) => sharp(guitarra).resize({ height: Math.round(lado * alto) }).toBuffer();

/**
 * Icono de la app: fondo de acento y la guitarra encima.
 * Normal: cuadrado redondeado y guitarra al 80 % del alto.
 * «maskable» (y el de iOS, que redondea él las esquinas): fondo entero y guitarra al
 * 72 %, dentro de la zona segura (el círculo del 80 % central).
 */
async function icono(archivo, lado, maskable) {
  const radio = maskable ? 0 : Math.round(lado * 0.22);
  const fondo = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}"><rect width="${lado}" height="${lado}" rx="${radio}" fill="${ACENTO}"/></svg>`,
  );
  await sharp(fondo)
    .composite([{ input: await aEscala(lado, maskable ? 0.72 : 0.8), gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(archivo);
  console.log(archivo, `${lado}×${lado}`);
}

await icono('public/iconos/apple-touch-icon.png', 180, true); // iOS redondea las esquinas
await icono('public/iconos/icono-192.png', 192, false);
await icono('public/iconos/icono-512.png', 512, false);
await icono('public/iconos/icono-maskable-512.png', 512, true);

// Favicon: la guitarra sola, centrada en un cuadrado transparente.
await sharp(guitarra).resize(64, 64, { fit: 'contain', background: TRANSPARENTE }).png({ compressionLevel: 9 }).toFile('public/favicon.png');
console.log('public/favicon.png', '64×64');
// Cabecera: 2,4rem de alto en pantalla; el triple para pantallas de alta densidad.
await sharp(guitarra).resize({ height: 120 }).png({ compressionLevel: 9 }).toFile('public/iconos/guitarra.png');
console.log('public/iconos/guitarra.png', 'alto 120');
