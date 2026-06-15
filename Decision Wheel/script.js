const input = document.getElementById("optionInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("optionsList");
const resetBtn = document.getElementById("resetBtn");
const spinBtn = document.getElementById("spinBtn");
const winner = document.getElementById("winnerText");
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

let options = [];
let rotation = 0;
let isSpinning = false;

// Curated modern pastel-neon high-contrast colors
const colors = [
    "#FF3366", "#33CCFF", "#FF9933", "#33FF99", 
    "#CC33FF", "#FF33CC", "#33FFCC", "#FFFF33", 
    "#FF6633", "#9933FF"
];

function renderOptions() {
    list.innerHTML = "";
    options.forEach((opt, index) => {
        const div = document.createElement("div");
        div.className = "option-item";
        
        const textSpan = document.createElement("span");
        textSpan.textContent = opt;
        
        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "×";
        deleteBtn.setAttribute("aria-label", `Remove ${opt}`);
        deleteBtn.onclick = () => removeOption(index);
        
        div.appendChild(textSpan);
        div.appendChild(deleteBtn);
        list.appendChild(div);
    });

    drawWheel();
    updateSpinButtonState();
}

function removeOption(index) {
    if (isSpinning) return;
    options.splice(index, 1);
    renderOptions();
}

function updateSpinButtonState() {
    if (options.length < 2 || isSpinning) {
        spinBtn.disabled = true;
    } else {
        spinBtn.disabled = false;
    }
}

input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        addBtn.click();
    }
});

addBtn.onclick = () => {
    if (isSpinning) return;
    const value = input.value.trim();
    if (!value) return;
    options.push(value);
    input.value = "";
    renderOptions();
    input.focus();
};

resetBtn.onclick = () => {
    if (isSpinning) return;
    options = [];
    winner.textContent = "Add options first";
    renderOptions();
};

function drawWheel() {
    ctx.clearRect(0, 0, 400, 400);

    const center = 200;
    const radius = 180;

    if (options.length === 0) {
        // Draw a clean placeholder wheel if no options exist
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw centered hint text
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.font = "16px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Enter choices to populate", center, center);
        return;
    }

    const slice = (2 * Math.PI) / options.length;

    options.forEach((opt, i) => {
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, i * slice, (i + 1) * slice);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = "rgba(15, 15, 21, 0.4)";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw radial text pointing from center outwards, centered vertically and horizontally inside slice
        ctx.save();
        ctx.translate(center, center);
        
        // Rotate to the center of the slice
        ctx.rotate(i * slice + slice / 2);
        
        // Use high contrast text styling
        ctx.fillStyle = "#0f0f15";
        ctx.font = "bold 17px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Truncate option name if it's too long
        let displayText = opt;
        if (displayText.length > 10) {
            displayText = displayText.substring(0, 8) + "...";
        }
        
        // Place text at 55% of the radius to keep it centered inside the slice area
        ctx.fillText(displayText, radius * 0.55, 0);
        ctx.restore();
    });

    // Draw inner small aesthetic center circle
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f0f15";
    ctx.fill();
    ctx.strokeStyle = "#00ff87";
    ctx.lineWidth = 4;
    ctx.stroke();
}

spinBtn.onclick = () => {
    if (options.length < 2 || isSpinning) return;

    isSpinning = true;
    updateSpinButtonState();
    winner.textContent = "Spinning...";

    // Calculate rotation degree. We spin at least 5 times (1800 deg) + random angle
    const extra = 1800 + Math.random() * 360;
    rotation += extra;

    canvas.style.transition = "transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)";
    canvas.style.transform = `rotate(${rotation}deg)`;

    setTimeout(() => {
        isSpinning = false;
        updateSpinButtonState();

        // Calculate index pointing at the top arrow.
        const degrees = rotation % 360;
        const sliceAngle = 360 / options.length;
        const targetAngle = (270 - degrees + 360) % 360;
        const index = Math.floor(targetAngle / sliceAngle) % options.length;

        winner.textContent = `Winner: ${options[index]}`;
    }, 4000);
};

// Initial setup
renderOptions();
// Refactor: Abstract canvas drawing algorithms into static renderer helpers
const WheelCanvasDraw = {
    clear(ctx, w, h) { ctx.clearRect(0, 0, w, h); }
};
