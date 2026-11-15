// Iconos de la web (Trastero251): la puerta de un trastero con persiana, cuyas
// lamas recuerdan a las cuerdas, y una placa con el 251 (y el ii–V–I).
// Uso: node scripts/iconos.mjs  → public/favicon.png y public/iconos/*.png
import sharp from 'sharp';

const ACENTO = '#3f7a85'; // igual que --acento
const CREMA = '#f6f6f4'; // igual que --superficie
const OSCURO = '#2c5960'; // acento más oscuro: placa y hueco bajo la persiana

/** Dígitos como trazos (caja de 28 × 44), para no depender de las fuentes del sistema. */
const DIGITOS = {
  2: (x, y) => `M${x} ${y + 11} Q${x} ${y} ${x + 14} ${y} Q${x + 28} ${y} ${x + 28} ${y + 12} Q${x + 28} ${y + 22} ${x} ${y + 44} L${x + 28} ${y + 44}`,
  5: (x, y) =>
    `M${x + 27} ${y} L${x + 3} ${y} L${x + 1} ${y + 20} Q${x + 8} ${y + 16} ${x + 15} ${y + 16} Q${x + 28} ${y + 17} ${x + 28} ${y + 30} Q${x + 28} ${y + 44} ${x + 14} ${y + 44} Q${x + 3} ${y + 44} ${x} ${y + 37}`,
  1: (x, y) => `M${x + 4} ${y + 9} L${x + 14} ${y} L${x + 14} ${y + 44}`,
};

/** El dibujo, en una caja de 512 × 512 centrada. */
function dibujo() {
  const lamas = [];
  for (let y = 186; y <= 372; y += 31) lamas.push(`<line x1="132" y1="${y}" x2="380" y2="${y}" />`);
  return `
    <!-- Cajón de la persiana -->
    <rect x="100" y="110" width="312" height="50" rx="10" fill="${CREMA}" />
    <!-- Marco -->
    <rect x="116" y="160" width="18" height="250" fill="${CREMA}" />
    <rect x="378" y="160" width="18" height="250" fill="${CREMA}" />
    <!-- Persiana casi bajada: lamas como cuerdas y un hueco abajo -->
    <rect x="134" y="160" width="244" height="222" fill="${CREMA}" />
    <rect x="134" y="382" width="244" height="28" fill="${OSCURO}" />
    <g stroke="${ACENTO}" stroke-width="7" stroke-linecap="butt">${lamas.join('')}</g>
    <!-- Tirador -->
    <rect x="236" y="360" width="40" height="12" rx="6" fill="${OSCURO}" />
    <!-- Placa con el número -->
    <rect x="186" y="214" width="140" height="80" rx="12" fill="${OSCURO}" />
    <path d="${DIGITOS[2](203, 232)} ${DIGITOS[5](243, 232)} ${DIGITOS[1](283, 232)}"
      fill="none" stroke="${CREMA}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
  `;
}

/** Icono normal (cuadrado redondeado) o «maskable» (fondo entero y dibujo al 80 %, dentro de la zona segura). */
function svg({ maskable = false } = {}) {
  const fondo = maskable
    ? `<rect width="512" height="512" fill="${ACENTO}" />`
    : `<rect width="512" height="512" rx="112" fill="${ACENTO}" />`;
  const escala = maskable ? 0.8 : 1;
  const desplazamiento = (512 * (1 - escala)) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    ${fondo}
    <g transform="translate(${desplazamiento} ${desplazamiento}) scale(${escala})">${dibujo()}</g>
  </svg>`;
}

const salidas = [
  { archivo: 'public/favicon.png', lado: 48 },
  { archivo: 'public/iconos/apple-touch-icon.png', lado: 180, maskable: true }, // iOS redondea las esquinas
  { archivo: 'public/iconos/icono-192.png', lado: 192 },
  { archivo: 'public/iconos/icono-512.png', lado: 512 },
  { archivo: 'public/iconos/icono-maskable-512.png', lado: 512, maskable: true },
];

for (const s of salidas) {
  await sharp(Buffer.from(svg(s)), { density: (72 * s.lado) / 512 * 4 })
    .resize(s.lado, s.lado)
    .png({ compressionLevel: 9 })
    .toFile(s.archivo);
  console.log(s.archivo, `${s.lado}×${s.lado}`);
}
