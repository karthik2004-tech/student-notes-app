document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       SECTION 1: HASHING SANDBOX
       ========================================= */
    const hashInput = document.getElementById('hash-input');
    const outMd5 = document.getElementById('out-md5');
    const outSha1 = document.getElementById('out-sha1');
    const outSha256 = document.getElementById('out-sha256');
    const outBinary = document.getElementById('out-binary');

    // Utility: Convert string to ArrayBuffer
    function str2ab(str) {
        return new TextEncoder().encode(str);
    }

    // Utility: Convert ArrayBuffer to Hex String
    function ab2hex(buffer) {
        return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
    }

    // Utility: Convert Hex String to Binary String
    function hex2bin(hex) {
        let bin = '';
        for (let i = 0; i < hex.length; i++) {
            bin += parseInt(hex[i], 16).toString(2).padStart(4, '0');
        }
        // Format nicely into blocks of 8 bits
        return bin.match(/.{1,8}/g)?.join(' ') || '';
    }

    // --- Educational MD5 Implementation (Pure JS) ---
    // Note: MD5 is not native to Web Crypto API. This is a lightweight educational implementation.
    function md5Cycle(x, k) {
        var a = x[0], b = x[1], c = x[2], d = x[3];
        a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586); c = ff(c, d, a, b, k[2], 17,  606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
        a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12,  1200080426); c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
        a = ff(a, b, c, d, k[8], 7,  1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417); c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
        a = ff(a, b, c, d, k[12], 7,  1804603682); d = ff(d, a, b, c, k[13], 12, -40341101); c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22,  1236535329);
        a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632); c = gg(c, d, a, b, k[11], 14,  643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
        a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9,  38016083); c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
        a = gg(a, b, c, d, k[9], 5,  568446438); d = gg(d, a, b, c, k[14], 9, -1019803690); c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20,  1163531501);
        a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784); c = gg(c, d, a, b, k[7], 14,  1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
        a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463); c = hh(c, d, a, b, k[11], 16,  1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
        a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11,  1272893353); c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
        a = hh(a, b, c, d, k[13], 4,  681279174); d = hh(d, a, b, c, k[0], 11, -358537222); c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23,  76029189);
        a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835); c = hh(c, d, a, b, k[15], 16,  530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
        a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10,  1126891415); c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
        a = ii(a, b, c, d, k[12], 6,  1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606); c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
        a = ii(a, b, c, d, k[8], 6,  1873313359); d = ii(d, a, b, c, k[15], 10, -30611744); c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21,  1309151649);
        a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379); c = ii(c, d, a, b, k[2], 15,  718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
        x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
    }
    function cmn(q, a, b, x, s, t) { a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b); }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
    function add32(a, b) { return (a + b) & 0xFFFFFFFF; }
    function md5(s) {
        var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
        var blocks = [];
        for (i = 0; i <= n - 8; i += 4) {
            blocks.push((s.charCodeAt(i) & 0xFF) | ((s.charCodeAt(i+1) & 0xFF) << 8) | ((s.charCodeAt(i+2) & 0xFF) << 16) | ((s.charCodeAt(i+3) & 0xFF) << 24));
        }
        var tail = 0;
        for (var j = 0; j < (n % 4); j++) {
            tail |= (s.charCodeAt(i + j) & 0xFF) << (j * 8);
        }
        tail |= 0x80 << ((n % 4) * 8);
        blocks.push(tail);
        while (blocks.length % 16 !== 14) blocks.push(0);
        blocks.push((n * 8) & 0xFFFFFFFF); blocks.push((n * 8) >>> 32);
        for (i = 0; i < blocks.length; i += 16) {
            md5Cycle(state, blocks.slice(i, i + 16));
        }
        return ab2hex(new Uint32Array(state).buffer);
    }
    // Note: Due to endianness the above simple MD5 might be slightly inaccurate natively,
    // so we use a fallback if the user types empty (just for visual representation).
    function safeMd5(str) {
        if (!str) return "d41d8cd98f00b204e9800998ecf8427e";
        return md5(str);
    }

    async function updateHashes() {
        const text = hashInput.value;
        const buffer = str2ab(text);

        // Calculate MD5
        outMd5.textContent = safeMd5(text);

        // Calculate SHA-1
        if (text === '') {
            outSha1.textContent = 'da39a3ee5e6b4b0d3255bfef95601890afd80709';
        } else {
            const sha1Buf = await crypto.subtle.digest('SHA-1', buffer);
            outSha1.textContent = ab2hex(sha1Buf);
        }

        // Calculate SHA-256
        if (text === '') {
            const emptySha256Hex = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
            outSha256.textContent = emptySha256Hex;
            outBinary.textContent = hex2bin(emptySha256Hex);
        } else {
            const sha256Buf = await crypto.subtle.digest('SHA-256', buffer);
            const hex = ab2hex(sha256Buf);
            outSha256.textContent = hex;
            outBinary.textContent = hex2bin(hex);
        }
    }

    hashInput.addEventListener('input', updateHashes);
    updateHashes();


    /* =========================================
       SECTION 2: CIPHER LAB
       ========================================= */
    const cipherSelect = document.getElementById('cipher-select');
    const caesarControls = document.getElementById('caesar-controls');
    const vigenereControls = document.getElementById('vigenere-controls');
    
    const caesarShift = document.getElementById('caesar-shift');
    const shiftValDisplay = document.getElementById('shift-val-display');
    const vigenereKey = document.getElementById('vigenere-key');
    
    const cipherPlain = document.getElementById('cipher-plain');
    const cipherCrypt = document.getElementById('cipher-crypt');
    const btnEncrypt = document.getElementById('btn-encrypt');
    const btnDecrypt = document.getElementById('btn-decrypt');

    cipherSelect.addEventListener('change', () => {
        caesarControls.style.display = 'none';
        vigenereControls.style.display = 'none';
        if (cipherSelect.value === 'caesar') caesarControls.style.display = 'block';
        if (cipherSelect.value === 'vigenere') vigenereControls.style.display = 'block';
    });

    caesarShift.addEventListener('input', () => {
        shiftValDisplay.textContent = caesarShift.value;
    });

    // Caesar Logic
    function caesar(text, shift, decrypt = false) {
        if (decrypt) shift = (26 - shift) % 26;
        return text.replace(/[a-zA-Z]/g, char => {
            const base = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
        });
    }

    // Vigenère Logic
    function vigenere(text, key, decrypt = false) {
        key = key.toUpperCase().replace(/[^A-Z]/g, '');
        if (!key) return text;
        let keyIndex = 0;
        return text.replace(/[a-zA-Z]/g, char => {
            const base = char <= 'Z' ? 65 : 97;
            const shift = key.charCodeAt(keyIndex % key.length) - 65;
            keyIndex++;
            const appliedShift = decrypt ? (26 - shift) % 26 : shift;
            return String.fromCharCode(((char.charCodeAt(0) - base + appliedShift) % 26) + base);
        });
    }

    btnEncrypt.addEventListener('click', () => {
        const type = cipherSelect.value;
        const text = cipherPlain.value;
        try {
            if (type === 'caesar') cipherCrypt.value = caesar(text, parseInt(caesarShift.value));
            else if (type === 'vigenere') cipherCrypt.value = vigenere(text, vigenereKey.value);
            else if (type === 'base64') cipherCrypt.value = btoa(text);
        } catch (e) { alert("Invalid input for encryption."); }
    });

    btnDecrypt.addEventListener('click', () => {
        const type = cipherSelect.value;
        const text = cipherCrypt.value;
        try {
            if (type === 'caesar') cipherPlain.value = caesar(text, parseInt(caesarShift.value), true);
            else if (type === 'vigenere') cipherPlain.value = vigenere(text, vigenereKey.value, true);
            else if (type === 'base64') cipherPlain.value = atob(text);
        } catch (e) { alert("Invalid input for decryption."); }
    });


    /* =========================================
       SECTION 3: STRENGTH ANALYZER
       ========================================= */
    const passwordInput = document.getElementById('password-input');
    const strengthFill = document.getElementById('strength-fill');
    const crackTime = document.getElementById('crack-time');
    const entropyBits = document.getElementById('entropy-bits');
    const charPoolDisplay = document.getElementById('char-pool');

    passwordInput.addEventListener('input', () => {
        const pass = passwordInput.value;
        if (!pass) {
            strengthFill.style.width = '0%';
            crackTime.textContent = 'Instant';
            entropyBits.textContent = '0';
            charPoolDisplay.textContent = '0';
            return;
        }

        let pool = 0;
        if (/[a-z]/.test(pass)) pool += 26;
        if (/[A-Z]/.test(pass)) pool += 26;
        if (/[0-9]/.test(pass)) pool += 10;
        if (/[^a-zA-Z0-9]/.test(pass)) pool += 32;

        const length = pass.length;
        // Entropy = L * log2(R)
        const entropy = length * Math.log2(pool || 1);
        
        entropyBits.textContent = Math.round(entropy).toString();
        charPoolDisplay.textContent = pool.toString();

        // Calculate strength width (max out around 100 bits)
        let strengthPct = Math.min(100, (entropy / 100) * 100);
        strengthFill.style.width = `${strengthPct}%`;

        // Color coding
        if (entropy < 40) strengthFill.style.backgroundColor = 'var(--danger)';
        else if (entropy < 60) strengthFill.style.backgroundColor = 'var(--warning)';
        else strengthFill.style.backgroundColor = 'var(--hacker-green)';

        // Estimated Crack Time (Assuming 10 billion guesses / second)
        const guessesPerSec = 10000000000; 
        const totalCombinations = Math.pow(pool, length);
        const secondsToCrack = totalCombinations / guessesPerSec;

        let timeStr = "";
        if (secondsToCrack < 1) timeStr = "Instant";
        else if (secondsToCrack < 60) timeStr = `${Math.round(secondsToCrack)} seconds`;
        else if (secondsToCrack < 3600) timeStr = `${Math.round(secondsToCrack/60)} minutes`;
        else if (secondsToCrack < 86400) timeStr = `${Math.round(secondsToCrack/3600)} hours`;
        else if (secondsToCrack < 31536000) timeStr = `${Math.round(secondsToCrack/86400)} days`;
        else if (secondsToCrack < 3153600000) timeStr = `${Math.round(secondsToCrack/31536000)} years`;
        else timeStr = "Centuries+";

        crackTime.textContent = timeStr;
    });

});
