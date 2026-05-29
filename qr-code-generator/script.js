const qrInput = document.getElementById('qrText');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const qrContainer = document.getElementById('qrCode');

let qrInstance = null;

function clearPreview(message = 'QR preview appears here') {
  qrContainer.innerHTML = `<span>${message}</span>`;
  downloadBtn.disabled = true;
}

function renderQrCode() {
  const value = qrInput.value.trim();

  if (!value) {
    clearPreview('Please enter a URL or text first');
    return;
  }

  qrContainer.innerHTML = '';
  qrInstance = new QRCode(qrContainer, {
    text: value,
    width: 260,
    height: 260,
    colorDark: '#0f172a',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  downloadBtn.disabled = false;
}

function downloadQrCode() {
  const canvas = qrContainer.querySelector('canvas');
  if (!canvas) {
    return;
  }

  const link = document.createElement('a');
  link.download = 'qr-code.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

generateBtn.addEventListener('click', renderQrCode);
downloadBtn.addEventListener('click', downloadQrCode);

qrInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.ctrlKey) {
    renderQrCode();
  }
});

clearPreview();