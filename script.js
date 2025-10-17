// script.js
const upiIdEl = document.getElementById('upiId');
const upiNameEl = document.getElementById('upiName');
const upiNoteEl = document.getElementById('upiNote');
const upiAmountEl = document.getElementById('upiAmount');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyPayload');
const qrPlaceholder = document.getElementById('qrPlaceholder');

const offCanvas = document.getElementById('qrCanvas2d');
const offCtx = offCanvas.getContext('2d');

// Initialize QRious instance
let qr = new QRious({
  element: offCanvas,
  size: 512,
  value: '',
  level: 'H'
});

// QR display image element for webpage
const qrDisplay = document.createElement('img');
qrDisplay.style.width = '250px';
qrDisplay.style.height = '250px';
qrDisplay.style.marginTop = '12px';
qrDisplay.style.display = 'none';
document.querySelector('.sceneWrap').prepend(qrDisplay);

// Function to build UPI URI
function buildUpiUri(vpa, name, amount, note) {
  const params = new URLSearchParams();
  params.set('pa', vpa);
  if (name) params.set('pn', name);
  if (amount) params.set('am', Number(amount).toFixed(2));
  if (note) params.set('tn', note);
  params.set('cu', 'INR');
  return 'upi://pay?' + params.toString();
}

// Convert HSL to RGB
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [r * 255, g * 255, b * 255];
}

// Apply rainbow effect to QR
function applyRainbowToCanvas() {
  const w = offCanvas.width, h = offCanvas.height;
  const img = offCtx.getImageData(0, 0, w, h);
  const data = img.data;
  for (let y = 0; y < h; y++) {
    const hue = (y / h) * 360;
    const [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const brightness = data[idx];
      const t = 1 - (brightness / 255);
      data[idx] = Math.round(255 * (1 - t) + r * t);
      data[idx + 1] = Math.round(255 * (1 - t) + g * t);
      data[idx + 2] = Math.round(255 * (1 - t) + b * t);
    }
  }
  offCtx.putImageData(img, 0, 0);
}

// Generate and download QR
function generateAndDownload() {
  const vpa = upiIdEl.value.trim();
  if (!vpa) {
    alert('Please enter a valid UPI ID');
    return;
  }

  // ✅ Clear canvas to prevent blurring
  offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);

  // ✅ Create a fresh QRious instance each time (ensures crisp QR)
  qr = new QRious({
    element: offCanvas,
    size: 512,
    value: '',
    level: 'H'
  });

  const payload = buildUpiUri(
    vpa,
    upiNameEl.value.trim(),
    upiAmountEl.value,
    upiNoteEl.value.trim()
  );

  qr.value = payload;

  setTimeout(() => {
    applyRainbowToCanvas();
    qrPlaceholder.style.display = 'none';
    qrDisplay.src = offCanvas.toDataURL('image/png');
    qrDisplay.style.display = 'block';

    // Auto-download QR as PNG
    offCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'upi-qr.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, 50);

  offCanvas.dataset.payload = payload;
}

// Event listeners
generateBtn.addEventListener('click', generateAndDownload);

copyBtn.addEventListener('click', async () => {
  const payload = offCanvas.dataset.payload || qr.value || '';
  if (!payload) {
    alert('Generate a QR first');
    return;
  }
  try {
    await navigator.clipboard.writeText(payload);
    alert('UPI link copied!');
  } catch {
    alert('Copy failed. Here is the link:\n' + payload);
  }
});

document.querySelectorAll('input').forEach(inp => {
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') generateAndDownload();
  });
});
