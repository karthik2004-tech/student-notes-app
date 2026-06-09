document.addEventListener('DOMContentLoaded', () => {
    let audioContext;

    // Initialize Audio Context on first user interaction
    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    const keys = document.querySelectorAll('.key');
    const attackControl = document.getElementById('attack');
    const releaseControl = document.getElementById('release');
    const volumeControl = document.getElementById('volume');
    
    // Store active oscillators to stop them on keyup
    const activeOscillators = {};

    function getWaveform() {
        return document.querySelector('input[name="waveform"]:checked').value;
    }

    function playNote(frequency, keyElement) {
        initAudio();
        
        // Stop if already playing this note
        if(activeOscillators[frequency]) return;

        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        osc.type = getWaveform();
        osc.frequency.setValueAtTime(frequency, audioContext.currentTime);

        const attack = parseFloat(attackControl.value);
        const volume = parseFloat(volumeControl.value);

        // Envelope Generator (Attack)
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + attack);

        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);

        osc.start();
        activeOscillators[frequency] = { osc, gainNode };
        
        keyElement.classList.add('active');
    }

    function stopNote(frequency, keyElement) {
        if (activeOscillators[frequency]) {
            const { osc, gainNode } = activeOscillators[frequency];
            const release = parseFloat(releaseControl.value);

            // Envelope Generator (Release)
            gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + release);

            osc.stop(audioContext.currentTime + release);
            delete activeOscillators[frequency];
        }
        
        if(keyElement) {
            keyElement.classList.remove('active');
        }
    }

    // Mouse and Touch Events
    keys.forEach(key => {
        const freq = parseFloat(key.getAttribute('data-note'));
        
        key.addEventListener('mousedown', () => playNote(freq, key));
        key.addEventListener('touchstart', (e) => { e.preventDefault(); playNote(freq, key); });

        key.addEventListener('mouseup', () => stopNote(freq, key));
        key.addEventListener('mouseleave', () => stopNote(freq, key));
        key.addEventListener('touchend', (e) => { e.preventDefault(); stopNote(freq, key); });
    });
});
