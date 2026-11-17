// Iconos de la web (JazzMaster): la guitarra del dibujo scripts/guitarra.png (fondo
// transparente), recortada a su contorno.
// Todos son la guitarra sobre el color de acento de la web: los de la app instalada,
// el favicon y el que va delante del título en la cabecera.
// Uso: node scripts/iconos.mjs  (npm run iconos) → public/favicon.png y public/iconos/*.png
import sharp from 'sharp';

const ACENTO = '#3f7a85'; // igual que --acento

const guitarra = await sharp('scripts/guitarra.png').trim({ threshold: 20 }).toBuffer();

/** La guitarra con `alto` (0–1) del lado del icono; se centra al componerla. */
const aEscala = (lado, alto) => sharp(guitarra).resize({ height: Math.round(lado * alto) }).toBuffer();

/**
 * Icono de la app: fondo de acento y la guitarra encima.
 * Normal: cuadrado redondeado y guitarra al 80 % del alto.
 * «maskable» (y el de iOS, que redondea él las esquinas): fondo entero y guitarra al
 * 72 %, dentro de la zona segura (el círculo del 80 % central).
 */
async function icono(archivo, lado, maskable, alto = maskable ? 0.72 : 0.8) {
  const radio = maskable ? 0 : Math.round(lado * 0.22);
  const fondo = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}"><rect width="${lado}" height="${lado}" rx="${radio}" fill="${ACENTO}"/></svg>`,
  );
  await sharp(fondo)
    .composite([{ input: await aEscala(lado, alto), gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(archivo);
  console.log(archivo, `${lado}×${lado}`);
}

await icono('public/iconos/apple-touch-icon.png', 180, true); // iOS redondea las esquinas
await icono('public/iconos/icono-192.png', 192, false);
await icono('public/iconos/icono-512.png', 512, false);
await icono('public/iconos/icono-maskable-512.png', 512, true);

// Favicon y cabecera: la guitarra cortada por arriba (solo se ve el principio del
// mástil, que se sale del icono) para que el cuerpo salga mucho más grande y se lea
// en pequeño. La cabecera lo muestra a 2,4rem: el triple de píxeles.
/**
 * `visible`: fracción de la guitarra (desde abajo) que entra en el icono;
 * `margen`: hueco bajo la guitarra, en fracción del lado.
 */
async function iconoRecortado(archivo, lado, visible = 0.6, margen = 0.05) {
  const radio = Math.round(lado * 0.22);
  const svg = (relleno) => Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}"><rect width="${lado}" height="${lado}" rx="${radio}" fill="${relleno}"/></svg>`,
  );
  const alto = Math.round((lado * (1 - margen)) / visible);
  const dentro = Math.round(lado * (1 - margen)); // alto de guitarra que entra
  const { data: corte, info } = await sharp(guitarra)
    .resize({ height: alto })
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) =>
      sharp(data).extract({ left: 0, top: info.height - dentro, width: info.width, height: dentro }).toBuffer({ resolveWithObject: true }),
    );
  const ancho = info.width;
  const compuesto = await sharp(svg(ACENTO))
    .composite([{ input: corte, left: Math.round((lado - ancho) / 2), top: 0 }])
    .png()
    .toBuffer();
  // La guitarra no debe salirse de las esquinas redondeadas.
  await sharp(compuesto)
    .composite([{ input: svg('#fff'), blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toFile(archivo);
  console.log(archivo, `${lado}×${lado}`, '(recortado)');
}

await iconoRecortado('public/favicon.png', 64);
await iconoRecortado('public/iconos/guitarra.png', 120);
