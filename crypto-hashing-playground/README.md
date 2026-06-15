# Cryptography & Hashing Playground 🔐

An interactive, educational utility built purely in JavaScript that helps students visualize and understand foundational cybersecurity concepts, including hashing algorithms, ciphers, and password entropy.

## 🌟 Features

1. **Live Hashing Sandbox**: Type in plain text and watch the playground simultaneously calculate and output the **MD5**, **SHA-1**, and **SHA-256** hashes.
2. **Binary Bit Array Visualizer**: See the raw binary representation of the hash. It illustrates how even a single character change alters the entire hash completely (The Avalanche Effect).
3. **Interactive Cipher Lab**: Compare classic encryption strategies! Use sliders and inputs to dynamically encode and decode text using the **Caesar Cipher**, **Vigenère Cipher**, and **Base64** encoding.
4. **Security Strength Analyzer**: Type a password and watch the script calculate its entropy in real-time, estimating how long it would take a hacker to crack via brute force.

## 🚀 Usage

1. Open the app to view the **Hashing Sandbox**. Start typing in the "Cleartext Input" area and observe how the hashes below update dynamically. Notice how the SHA-256 binary matrix shifts dramatically even if you change just one letter.
2. Scroll down to the **Cipher Tools**. Select "Caesar Cipher", set a Shift value of `3`, enter `abc`, and see the output `def`.
3. Try the **Security Strength Analyzer** at the bottom. Enter combinations of lowercase, uppercase, numbers, and symbols to see the estimated crack time increase from milliseconds to centuries!
