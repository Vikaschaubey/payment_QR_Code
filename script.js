const urlInput = document.getElementById('url');
const sizeSelect = document.getElementById('size');
const generateBtn = document.getElementById('generate');
const downloadBtn = document.getElementById('download');
const resetBtn = document.getElementById('reset');
const copyBtn = document.getElementById('copy-url');
const canvas = document.getElementById('qr-canvas');
const ctx = canvas.getContext('2d');

// Copy URL button
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(urlInput.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy URL', 1200);
  } catch {
    copyBtn.textContent = 'Failed';
    setTimeout(() => copyBtn.textContent = 'Copy URL', 1200);
  }
});

// Reset button
resetBtn.addEventListener('click', () => {
  urlInput.value = 'https://example.com';
  sizeSelect.value = '400';
  drawBlank();
});

generateBtn.addEventListener('click', generateAndDraw);
downloadBtn.addEventListener('click', downloadImage);

drawBlank();

function drawBlank() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '600 20px Inter, system-ui';
  ctx.fillStyle = '#3b4a66';
  ctx.textAlign = 'center';
  ctx.fillText('QR will appear here', canvas.width / 2, canvas.height / 2 - 6);
}

async function generateAndDraw() {
  const text = urlInput.value.trim();
  if (!text) { alert('Please enter a URL.'); return; }

  const size = parseInt(sizeSelect.value, 10);
  const apiURL = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&qzone=1`;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = apiURL;

  generateBtn.textContent = 'Generating...';
  generateBtn.disabled = true;

  img.onload = () => {
    generateBtn.textContent = 'Generate QR';
    generateBtn.disabled = false;

    const target = 720;
    canvas.width = target;
    canvas.height = target;
    ctx.clearRect(0, 0, target, target);

    // Draw white background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, target, target);

    // Draw QR code
    const padding = Math.round(target * 0.08);
    const inner = target - padding * 2;
    ctx.drawImage(img, padding, padding, inner, inner);

    // Apply rainbow gradient
    const imageData = ctx.getImageData(padding, padding, inner, inner);
    const data = imageData.data;
    for (let y = 0; y < inner; y++) {
      const hue = (y / inner) * 360;
      const [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
      for (let x = 0; x < inner; x++) {
        const i = (y * inner + x) * 4;
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (avg < 128) {
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }
      }
    }
    ctx.putImageData(imageData, padding, padding);
  };

  img.onerror = () => {
    alert('Failed to load QR code.');
    generateBtn.textContent = 'Generate QR';
    generateBtn.disabled = false;
  };
}

// Convert HSL to RGB
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) r = g = b = l;
  else {
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

// Download QR
function downloadImage() {
  const link = document.createElement('a');
  link.download = 'rainbow-qr.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
