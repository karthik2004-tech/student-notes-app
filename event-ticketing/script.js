document.addEventListener('DOMContentLoaded', () => {
    const formSection = document.getElementById('form-section');
    const ticketSection = document.getElementById('ticket-section');
    const form = document.getElementById('rsvp-form');
    const resetBtn = document.getElementById('reset-btn');

    // Display elements
    const dName = document.getElementById('display-name');
    const dEmail = document.getElementById('display-email');
    const dType = document.getElementById('display-type');
    const dId = document.getElementById('ticket-id');
    const qrContainer = document.getElementById('qrcode');

    let qrcode = null;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get values
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const type = document.getElementById('ticket-type').value;

        // Generate a random ticket ID
        const ticketId = 'TC-' + Math.floor(1000000 + Math.random() * 9000000);

        // Update UI
        dName.textContent = name;
        dEmail.textContent = email;
        dType.textContent = type;
        dId.textContent = ticketId;

        // Generate QR code data (typically a JSON or URL to verify)
        const qrData = JSON.stringify({ id: ticketId, name, type });

        // Clear old QR code if exists
        qrContainer.innerHTML = '';
        
        // Render new QR
        qrcode = new QRCode(qrContainer, {
            text: qrData,
            width: 100,
            height: 100,
            colorDark : "#1f2937",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.L
        });

        // Switch views
        formSection.classList.add('hidden');
        ticketSection.classList.remove('hidden');
    });

    resetBtn.addEventListener('click', () => {
        form.reset();
        ticketSection.classList.add('hidden');
        formSection.classList.remove('hidden');
    });
});
