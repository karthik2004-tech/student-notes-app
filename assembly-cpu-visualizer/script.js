/**
 * Core8 CPU Emulator & Assembly Interpreter Logic
 */

// LocalStorage Utility Standard
const StorageUtil = { 
    set(key, value) { 
        try { 
            localStorage.setItem(key, JSON.stringify(value)); 
            return true; 
        } catch (error) { 
            console.error('LocalStorage quota exceeded or unavailable:', error); 
            return false; 
        } 
    }, 
    get(key, defaultValue = null) { 
        try { 
            const item = localStorage.getItem(key); 
            return item ? JSON.parse(item) : defaultValue; 
        } catch (error) { 
            console.error('Error reading from LocalStorage:', error); 
            return defaultValue; 
        } 
    } 
};

// Demo Programs Definition
const DEMO_PROGRAMS = {
    fibonacci: `; Fibonacci Sequence Calculator
; Computes numbers and stores in RAM
MOV AX, 0    ; AX = F(n)
MOV BX, 1    ; BX = F(n-1)
MOV CX, 0    ; CX = RAM Pointer

LOOP:
MOV [CX], AX ; Save F(n) to memory address
MOV DX, AX   ; Temp = F(n)
ADD AX, BX   ; F(n+1) = F(n) + F(n-1)
MOV BX, DX   ; BX = Temp
ADD CX, 1    ; Increment RAM pointer
CMP CX, 12   ; Calculate 12 values
JNE LOOP
HALT         ; Stop execution`,

    multiplier: `; Multiplication Loop (Repeated Addition)
; Calculates AX = BX * CX (e.g. 8 * 7)
MOV AX, 0    ; Result accumulator
MOV BX, 8    ; Multiplicand
MOV CX, 7    ; Multiplier

MULT:
CMP CX, 0    ; Check if counter is 0
JE SAVE      ; If counter == 0, save result
ADD AX, BX   ; Add BX to accumulator
SUB CX, 1    ; Decrement counter
JMP MULT     ; Loop back

SAVE:
MOV [0], AX  ; Store result at RAM address 0
HALT`,

    counter: `; RAM Memory Grid Counter
; Increments address values consecutively
MOV AX, 0    ; Value counter
MOV BX, 0    ; RAM index pointer

LOOP:
ADD AX, 3    ; Increment value
MOV [BX], AX ; Save to active index
ADD BX, 1    ; Increment index pointer
CMP BX, 16   ; Fill first 16 cells
JNE LOOP
HALT`
};

// CPU State variables
let cpu = {
    AX: 0,
    BX: 0,
    CX: 0,
    DX: 0,
    PC: 0,
    ZF: 0,
    SF: 0
};

// 256-byte RAM
let ram = new Uint8Array(256);

// History Queue for Step Back support
let executionHistory = [];

// Compiler state
let compiledInstructions = []; // cleaned, parsed tokens
let labelMap = {};             // mapping labels -> instruction index
let instructionToLineMap = []; // instruction index -> original line number
let originalCodeLines = [];    // source lines
let isHalted = false;
let activeHighlightRamCell = null;
let lastHighlightedCellAction = null; // 'read' or 'write'

// Execution simulation timer
let runInterval = null;
let isRunning = false;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    buildRamGrid();
    
    // Load last program or fallback to fibonacci
    const savedCode = StorageUtil.get("assembly_editor_code", null);
    if (savedCode) {
        document.getElementById("assemblyCode").value = savedCode;
    } else {
        document.getElementById("demoSelect").value = "fibonacci";
        loadDemoProgram();
    }
    
    updateLineNumbers();
});

// Load Demo script
function loadDemoProgram() {
    const key = document.getElementById("demoSelect").value;
    if (DEMO_PROGRAMS[key]) {
        document.getElementById("assemblyCode").value = DEMO_PROGRAMS[key];
        updateLineNumbers();
        resetVisualizer();
    }
}

// Keep editor line numbers in sync
function updateLineNumbers() {
    const code = document.getElementById("assemblyCode").value;
    const linesCount = code.split("\n").length;
    const lineNumbersDiv = document.getElementById("lineNumbers");
    
    let html = "";
    for (let i = 1; i <= linesCount; i++) {
        html += `<div id="line-num-${i}">${i}</div>`;
    }
    lineNumbersDiv.innerHTML = html;
    StorageUtil.set("assembly_editor_code", code);
}

function syncEditorScroll() {
    const editor = document.getElementById("assemblyCode");
    const numbers = document.getElementById("lineNumbers");
    numbers.scrollTop = editor.scrollTop;
}

// Build 256-cell RAM layout grid
function buildRamGrid() {
    const grid = document.getElementById("ramGrid");
    grid.innerHTML = "";
    
    for (let i = 0; i < 256; i++) {
        const cell = document.createElement("div");
        cell.className = "ram-cell";
        cell.id = `ram-cell-${i}`;
        
        const addr = document.createElement("span");
        addr.className = "ram-cell-addr";
        addr.textContent = i.toString(16).toUpperCase().padStart(2, '0');
        
        const val = document.createElement("span");
        val.className = "ram-cell-val";
        val.textContent = "00";
        
        cell.appendChild(addr);
        cell.appendChild(val);
        grid.appendChild(cell);
    }
}

// Highlights registers when altered
function triggerRegisterGlow(regName) {
    const regEl = document.getElementById(`reg${regName}`);
    if (regEl) {
        regEl.classList.add("updated");
        setTimeout(() => regEl.classList.remove("updated"), 400);
    }
}

// Formats number to HEX display
function formatHex(val, padding = 4) {
    // Keep 16-bit bounds representation
    const unsignedVal = (val < 0 ? (0xFFFF + val + 1) : val) & 0xFFFF;
    return unsignedVal.toString(16).toUpperCase().padStart(padding, '0');
}

// Formats number to binary string
function formatBinary(val) {
    const unsignedVal = (val < 0 ? (0xFFFF + val + 1) : val) & 0xFFFF;
    return unsignedVal.toString(2).padStart(16, '0');
}

// Render dynamic state updates in Dashboard
function updateCpuDisplay() {
    // Values
    document.getElementById("valAX").textContent = formatHex(cpu.AX);
    document.getElementById("binAX").textContent = formatBinary(cpu.AX);
    
    document.getElementById("valBX").textContent = formatHex(cpu.BX);
    document.getElementById("binBX").textContent = formatBinary(cpu.BX);
    
    document.getElementById("valCX").textContent = formatHex(cpu.CX);
    document.getElementById("binCX").textContent = formatBinary(cpu.CX);
    
    document.getElementById("valDX").textContent = formatHex(cpu.DX);
    document.getElementById("binDX").textContent = formatBinary(cpu.DX);
    
    document.getElementById("valPC").textContent = cpu.PC;
    
    // Flags
    const flagZF = document.getElementById("flagZF");
    flagZF.className = cpu.ZF ? "flag-item active" : "flag-item";
    flagZF.querySelector(".flag-val").textContent = cpu.ZF;

    const flagSF = document.getElementById("flagSF");
    flagSF.className = cpu.SF ? "flag-item active" : "flag-item";
    flagSF.querySelector(".flag-val").textContent = cpu.SF;
    
    // Line highlight
    document.querySelectorAll(".line-numbers div").forEach(el => el.classList.remove("active"));
    
    if (cpu.PC < compiledInstructions.length && !isHalted) {
        const currentLineNum = instructionToLineMap[cpu.PC];
        const activeLineEl = document.getElementById(`line-num-${currentLineNum}`);
        if (activeLineEl) activeLineEl.classList.add("active");
    }
}

// Render active RAM value arrays
function updateRamDisplay() {
    const isHex = document.querySelector('input[name="ramFormat"]:checked').value === "hex";
    
    for (let i = 0; i < 256; i++) {
        const cell = document.getElementById(`ram-cell-${i}`);
        const valSpan = cell.querySelector(".ram-cell-val");
        
        if (isHex) {
            valSpan.textContent = ram[i].toString(16).toUpperCase().padStart(2, '0');
        } else {
            valSpan.textContent = ram[i].toString();
        }
    }
}

// Triggers highlighted alerts on specific RAM cells
function highlightRamCell(addr, action) {
    if (activeHighlightRamCell !== null) {
        const oldCell = document.getElementById(`ram-cell-${activeHighlightRamCell}`);
        if (oldCell) oldCell.className = "ram-cell";
    }
    
    activeHighlightRamCell = addr;
    lastHighlightedCellAction = action;
    
    const newCell = document.getElementById(`ram-cell-${addr}`);
    if (newCell) {
        newCell.className = `ram-cell highlight-${action}`;
        // Scroll RAM grid into view if necessary
        newCell.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Terminal display console logger
function logConsole(message, type = "info") {
    const consoleLogs = document.getElementById("consoleLogs");
    const line = document.createElement("div");
    line.className = `log-${type}`;
    line.innerHTML = `&gt; ${message}`;
    consoleLogs.appendChild(line);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

function clearConsole() {
    document.getElementById("consoleLogs").innerHTML = "";
}

// Resets visualizer to initial default boot states
function resetVisualizer() {
    stopRun();
    cpu = { AX: 0, BX: 0, CX: 0, DX: 0, PC: 0, ZF: 0, SF: 0 };
    ram.fill(0);
    executionHistory = [];
    isHalted = false;
    
    if (activeHighlightRamCell !== null) {
        const cell = document.getElementById(`ram-cell-${activeHighlightRamCell}`);
        if (cell) cell.className = "ram-cell";
        activeHighlightRamCell = null;
    }
    
    updateCpuDisplay();
    updateRamDisplay();
    
    document.getElementById("btnStep").disabled = compiledInstructions.length === 0;
    document.getElementById("btnRun").disabled = compiledInstructions.length === 0;
    document.getElementById("btnStepBack").disabled = true;
    
    logConsole("CPU and registers reset. Click Compile to parse program.", "info");
}

// Compiler / Assembler Engine
function assembleCode() {
    const code = document.getElementById("assemblyCode").value;
    originalCodeLines = code.split("\n");
    
    compiledInstructions = [];
    labelMap = {};
    instructionToLineMap = [];
    
    let instructionIndex = 0;
    
    logConsole("Assembling code...", "info");
    
    // First Pass: Clean code and map labels
    for (let i = 0; i < originalCodeLines.length; i++) {
        let line = originalCodeLines[i].trim();
        
        // Strip comments
        const commentIdx = line.indexOf(";");
        if (commentIdx !== -1) {
            line = line.substring(0, commentIdx).trim();
        }
        
        if (!line) continue; // Skip empty lines
        
        // Detect Label (e.g. LOOP:)
        if (line.endsWith(":")) {
            const labelName = line.substring(0, line.length - 1).trim().toUpperCase();
            labelMap[labelName] = instructionIndex;
            continue; // Labels themselves are metadata, not instructions
        }
        
        // Push instruction and map it to original line number
        compiledInstructions.push(line);
        instructionToLineMap.push(i + 1);
        instructionIndex++;
    }
    
    if (compiledInstructions.length === 0) {
        logConsole("Compile error: No instructions found.", "error");
        return;
    }
    
    logConsole(`Assembly completed successfully. ${compiledInstructions.length} instructions loaded.`, "success");
    resetVisualizer();
    
    document.getElementById("btnStep").disabled = false;
    document.getElementById("btnRun").disabled = false;
}

// Save Current State Snapshot to History Queue
function pushHistorySnapshot() {
    executionHistory.push({
        cpu: { ...cpu },
        ram: new Uint8Array(ram),
        isHalted,
        activeHighlightRamCell,
        lastHighlightedCellAction
    });
    
    document.getElementById("btnStepBack").disabled = false;
}

// Step Backward
function stepBackward() {
    if (executionHistory.length === 0) return;
    
    const prev = executionHistory.pop();
    cpu = prev.cpu;
    ram = prev.ram;
    isHalted = prev.isHalted;
    
    if (activeHighlightRamCell !== null) {
        const cell = document.getElementById(`ram-cell-${activeHighlightRamCell}`);
        if (cell) cell.className = "ram-cell";
    }
    
    activeHighlightRamCell = prev.activeHighlightRamCell;
    lastHighlightedCellAction = prev.lastHighlightedCellAction;
    
    if (activeHighlightRamCell !== null && lastHighlightedCellAction) {
        const cell = document.getElementById(`ram-cell-${activeHighlightRamCell}`);
        if (cell) cell.className = `ram-cell highlight-${lastHighlightedCellAction}`;
    }
    
    updateCpuDisplay();
    updateRamDisplay();
    
    document.getElementById("btnStep").disabled = false;
    document.getElementById("btnRun").disabled = false;
    
    if (executionHistory.length === 0) {
        document.getElementById("btnStepBack").disabled = true;
    }
    
    logConsole(`Stepped back to Program Counter PC = ${cpu.PC}.`, "warning");
}

// Helper: Get Operand Value
function getOperandValue(op) {
    op = op.trim().toUpperCase();
    
    // Is CPU Register?
    if (op === "AX") return cpu.AX;
    if (op === "BX") return cpu.BX;
    if (op === "CX") return cpu.CX;
    if (op === "DX") return cpu.DX;
    
    // Is Memory Address Direct ref? (e.g. [10])
    if (op.startsWith("[") && op.endsWith("]")) {
        const inner = op.substring(1, op.length - 1).trim();
        // Indirect register address? e.g. [BX]
        if (inner === "AX" || inner === "BX" || inner === "CX" || inner === "DX") {
            const val = getOperandValue(inner);
            highlightRamCell(val, "read");
            return ram[val];
        }
        
        // Direct absolute offset
        const addr = parseInt(inner);
        if (!isNaN(addr) && addr >= 0 && addr < 256) {
            highlightRamCell(addr, "read");
            return ram[addr];
        }
        throw new Error(`Invalid RAM address format: ${op}`);
    }
    
    // Literal integer immediate
    const val = parseInt(op);
    if (!isNaN(val)) return val;
    
    throw new Error(`Unknown operand label: ${op}`);
}

// Helper: Set Operand Value
function setOperandValue(dest, val) {
    dest = dest.trim().toUpperCase();
    val = val & 0xFFFF; // Restrict 16-bit register limits
    
    if (dest === "AX") { cpu.AX = val; triggerRegisterGlow("AX"); return; }
    if (dest === "BX") { cpu.BX = val; triggerRegisterGlow("BX"); return; }
    if (dest === "CX") { cpu.CX = val; triggerRegisterGlow("CX"); return; }
    if (dest === "DX") { cpu.DX = val; triggerRegisterGlow("DX"); return; }
    
    if (dest.startsWith("[") && dest.endsWith("]")) {
        const inner = dest.substring(1, dest.length - 1).trim();
        let addr;
        
        if (inner === "AX" || inner === "BX" || inner === "CX" || inner === "DX") {
            addr = getOperandValue(inner);
        } else {
            addr = parseInt(inner);
        }
        
        if (!isNaN(addr) && addr >= 0 && addr < 256) {
            ram[addr] = val & 0xFF; // RAM values mapped strictly to unsigned 8-bit limits
            highlightRamCell(addr, "write");
            updateRamDisplay();
            return;
        }
        throw new Error(`RAM segment out of bounds: ${addr}`);
    }
    
    throw new Error(`Invalid write target: ${dest}`);
}

// Executes single Instruction line at Program Counter
function stepForward() {
    if (cpu.PC >= compiledInstructions.length) {
        logConsole("Program completed (reached end of instructions).", "success");
        isHalted = true;
        stopRun();
        return;
    }
    
    pushHistorySnapshot();
    
    const instrStr = compiledInstructions[cpu.PC];
    logConsole(`Executing: <span class="text-mono" style="color:var(--text-color); font-weight:600;">${instrStr}</span>`, "info");
    
    try {
        // Parse basic operands
        // Handle instructions separated by space and comma
        let spaceIdx = instrStr.indexOf(" ");
        let cmd = instrStr;
        let args = "";
        
        if (spaceIdx !== -1) {
            cmd = instrStr.substring(0, spaceIdx).trim().toUpperCase();
            args = instrStr.substring(spaceIdx + 1).trim();
        } else {
            cmd = instrStr.toUpperCase();
        }
        
        const ops = args ? args.split(",").map(o => o.trim()) : [];
        
        let shouldIncrementPC = true;
        
        switch (cmd) {
            case "MOV":
                if (ops.length !== 2) throw new Error("MOV requires 2 operands.");
                setOperandValue(ops[0], getOperandValue(ops[1]));
                break;
                
            case "ADD":
                if (ops.length !== 2) throw new Error("ADD requires 2 operands.");
                setOperandValue(ops[0], getOperandValue(ops[0]) + getOperandValue(ops[1]));
                break;
                
            case "SUB":
                if (ops.length !== 2) throw new Error("SUB requires 2 operands.");
                setOperandValue(ops[0], getOperandValue(ops[0]) - getOperandValue(ops[1]));
                break;
                
            case "CMP":
                if (ops.length !== 2) throw new Error("CMP requires 2 operands.");
                const diff = getOperandValue(ops[0]) - getOperandValue(ops[1]);
                cpu.ZF = diff === 0 ? 1 : 0;
                cpu.SF = diff < 0 ? 1 : 0;
                break;
                
            case "JMP":
                if (ops.length !== 1) throw new Error("JMP requires a label target.");
                const target = ops[0].toUpperCase();
                if (labelMap[target] === undefined) throw new Error(`Undefined label target: ${target}`);
                cpu.PC = labelMap[target];
                shouldIncrementPC = false;
                break;
                
            case "JE":
                if (ops.length !== 1) throw new Error("JE requires a label target.");
                if (cpu.ZF === 1) {
                    const jeTarget = ops[0].toUpperCase();
                    if (labelMap[jeTarget] === undefined) throw new Error(`Undefined label: ${jeTarget}`);
                    cpu.PC = labelMap[jeTarget];
                    shouldIncrementPC = false;
                }
                break;
                
            case "JNE":
                if (ops.length !== 1) throw new Error("JNE requires a label target.");
                if (cpu.ZF === 0) {
                    const jneTarget = ops[0].toUpperCase();
                    if (labelMap[jneTarget] === undefined) throw new Error(`Undefined label: ${jneTarget}`);
                    cpu.PC = labelMap[jneTarget];
                    shouldIncrementPC = false;
                }
                break;
                
            case "HALT":
                isHalted = true;
                stopRun();
                logConsole("Halt instruction encountered. CPU stopped.", "success");
                break;
                
            default:
                throw new Error(`Unsupported instruction: ${cmd}`);
        }
        
        if (shouldIncrementPC) {
            cpu.PC++;
        }
        
        updateCpuDisplay();
        
        if (cpu.PC >= compiledInstructions.length && !isHalted) {
            logConsole("Program end reached.", "success");
            isHalted = true;
            stopRun();
        }
        
    } catch (e) {
        logConsole(`Execution Error: ${e.message}`, "error");
        stopRun();
    }
}

// Toggle program execution loop
function toggleRun() {
    if (isRunning) {
        stopRun();
    } else {
        startRun();
    }
}

function startRun() {
    if (isHalted || cpu.PC >= compiledInstructions.length) {
        resetVisualizer();
        assembleCode();
    }
    
    isRunning = true;
    document.getElementById("runText").textContent = "Pause";
    document.getElementById("runIcon").className = "fas fa-pause";
    
    runInterval = setInterval(() => {
        if (!isHalted) {
            stepForward();
        } else {
            stopRun();
        }
    }, 450); // Clock Cycle speed duration
}

function stopRun() {
    isRunning = false;
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
    }
    const runText = document.getElementById("runText");
    const runIcon = document.getElementById("runIcon");
    if (runText && runIcon) {
        runText.textContent = "Run";
        runIcon.className = "fas fa-play";
    }
}
