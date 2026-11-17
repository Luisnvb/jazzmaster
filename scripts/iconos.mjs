// Iconos de la web (JazzMaster): la guitarra del dibujo scripts/guitarra.png (fondo
// transparente), recortada a su contorno.
// Todos son la guitarra sobre el color de acento de la web: los de la app instalada,
// el favicon y el que va delante del título en la cabecera.
// La guitarra va cortada por arriba (solo se ve el principio del mástil, que se sale
// del icono) para que el cuerpo salga mucho más grande.
// Uso: node scripts/iconos.mjs  (npm run iconos) → public/favicon.png y public/iconos/*.png
import sharp from 'sharp';

const ACENTO = '#3f7a85'; // igual que --acento

const guitarra = await sharp('scripts/guitarra.png').trim({ threshold: 20 }).toBuffer();

/**
 * Icono: fondo de acento y la guitarra encima, apoyada abajo y cortada por arriba.
 * `alto`: alto de la guitarra entera, en lados del icono (>1: se sale por arriba);
 * `margen`: hueco bajo la guitarra, en fracción del lado;
 * `redondo`: esquinas redondeadas (no en el «maskable» ni en el de iOS, que ya
 * recortan ellos).
 */
async function icono(archivo, lado, { alto = 1.58, margen = 0.05, redondo = true } = {}) {
  const radio = redondo ? Math.round(lado * 0.22) : 0;
  const svg = (relleno) => Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}"><rect width="${lado}" height="${lado}" rx="${radio}" fill="${relleno}"/></svg>`,
  );
  const dentro = Math.round(lado * (1 - margen)); // alto de guitarra que entra
  const grande = await sharp(guitarra).resize({ height: Math.round(lado * alto) }).toBuffer({ resolveWithObject: true });
  const { width: ancho, height } = grande.info;
  const corte = await sharp(grande.data).extract({ left: 0, top: height - dentro, width: ancho, height: dentro }).toBuffer();
  const compuesto = await sharp(svg(ACENTO))
    .composite([{ input: corte, left: Math.round((lado - ancho) / 2), top: 0 }])
    .png()
    .toBuffer();
  // La guitarra no debe salirse de las esquinas redondeadas.
  await sharp(compuesto)
    .composite([{ input: svg('#fff'), blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toFile(archivo);
  console.log(archivo, `${lado}×${lado}`);
}

// App instalada.
await icono('public/iconos/apple-touch-icon.png', 180, { redondo: false }); // iOS redondea las esquinas
await icono('public/iconos/icono-192.png', 192);
await icono('public/iconos/icono-512.png', 512);
// «maskable»: el cuerpo, dentro de la zona segura (el círculo del 80 % central).
await icono('public/iconos/icono-maskable-512.png', 512, { alto: 1.3, margen: 0.14, redondo: false });

// Favicon y cabecera (la cabecera lo muestra a 2,4rem: el triple de píxeles).
await icono('public/favicon.png', 64);
await icono('public/iconos/guitarra.png', 120);
