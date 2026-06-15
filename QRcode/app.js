let qr;

function generateQR() {
  let text = document.getElementById("text").value;
  let size = document.getElementById("size").value;
  let dark = document.getElementById("dark").value;
  let light = document.getElementById("light").value;

  let container = document.getElementById("qrcode");
  container.innerHTML = ""; 

  if (!text) {
    alert("Please enter text or URL");
    return;
  }

  qr = new QRCode(container, {
    text: text,
    width: size,
    height: size,
    colorDark: dark,
    colorLight: light,
    correctLevel: QRCode.CorrectLevel.H
  });
}

function downloadQR() {
  let img = document.querySelector("#qrcode img");

  if (!img) {
    alert("Generate QR first!");
    return;
  }

  let link = document.createElement("a");
  link.href = img.src;
  link.download = "qrcode.png";
  link.click();
}