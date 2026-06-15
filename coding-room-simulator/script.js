document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const promptSelect = document.getElementById('prompt-select');
    const chatContainer = document.getElementById('chat-container');
    const timerDisplay = document.getElementById('timer-display');
    const timeSpan = timerDisplay.querySelector('span');
    
    const codeEditor = document.getElementById('code-editor');
    const lineNumbers = document.getElementById('line-numbers');
    const btnRun = document.getElementById('btn-run');
    
    const consoleOutput = document.getElementById('console-output');
    const testStatus = document.getElementById('test-status');

    // --- Mock Data: Prompts & Test Cases ---
    const prompts = {
        reverse: {
            title: "Reverse a String",
            funcName: "reverseString",
            initialCode: `// Write a function that reverses a string.
// For example, "hello" should return "olleh".

function reverseString(str) {
    // Write your code here...
    
}
`,
            tests: [
                { input: ["hello"], expected: "olleh" },
                { input: ["Greetings!"], expected: "!sgniteerG" },
                { input: ["12345"], expected: "54321" },
                { input: [""], expected: "" }
            ]
        },
        twosum: {
            title: "Two Sum",
            funcName: "twoSum",
            initialCode: `// Given an array of integers and a target sum,
// return the indices of the two numbers that add up to the target.
// E.g., nums=[2,7,11,15], target=9 -> returns [0,1]

function twoSum(nums, target) {
    // Write your code here...
    
}
`,
            tests: [
                { input: [[2,7,11,15], 9], expected: [0,1], isArray: true },
                { input: [[3,2,4], 6], expected: [1,2], isArray: true },
                { input: [[3,3], 6], expected: [0,1], isArray: true }
            ]
        },
        palindrome: {
            title: "Valid Palindrome",
            funcName: "isPalindrome",
            initialCode: `// Return true if the string is a palindrome, false otherwise.
// Ignore non-alphanumeric characters and case.
// E.g., "Race car" returns true.

function isPalindrome(str) {
    // Write your code here...
    
}
`,
            tests: [
                { input: ["Race car"], expected: true },
                { input: ["A man, a plan, a canal: Panama"], expected: true },
                { input: ["hello"], expected: false },
                { input: [" "], expected: true }
            ]
        }
    };

    let currentPrompt = 'reverse';
    let timerInterval = null;
    let secondsRemaining = 30 * 60; // 30 minutes

    // --- 1. Line Numbers Logic ---
    function updateLineNumbers() {
        const lines = codeEditor.value.split('\n').length;
        lineNumbers.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
    }
    codeEditor.addEventListener('input', updateLineNumbers);
    codeEditor.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeEditor.scrollTop;
    });

    // --- 2. AI Interviewer Chat Logic ---
    function appendChatMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender}`;
        
        if (sender === 'ai' || sender === 'user') {
            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            avatar.innerHTML = sender === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
            msgDiv.appendChild(avatar);
        }

        const bubble = document.createElement('div');
        if (sender === 'system') {
            bubble.textContent = text;
        } else {
            bubble.className = 'chat-bubble';
            bubble.innerHTML = text; // Allow HTML for code blocks
        }
        
        msgDiv.appendChild(bubble);
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // --- 3. Timer Logic ---
    function startTimer() {
        clearInterval(timerInterval);
        secondsRemaining = 30 * 60;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            secondsRemaining--;
            updateTimerDisplay();
            if (secondsRemaining <= 0) {
                clearInterval(timerInterval);
                appendChatMessage('system', 'Time is up! The interview session has ended.');
                codeEditor.disabled = true;
                btnRun.disabled = true;
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const m = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
        const s = (secondsRemaining % 60).toString().padStart(2, '0');
        timeSpan.textContent = `${m}:${s}`;
        if (secondsRemaining < 300) { // under 5 min
            timerDisplay.className = 'timer-display warning';
        } else {
            timerDisplay.className = 'timer-display normal';
        }
    }

    // --- 4. Initialization / Selection ---
    function loadPrompt(promptKey) {
        currentPrompt = promptKey;
        const promptData = prompts[promptKey];
        
        // Reset Editor
        codeEditor.value = promptData.initialCode;
        codeEditor.disabled = false;
        btnRun.disabled = false;
        updateLineNumbers();

        // Reset Console
        consoleOutput.innerHTML = `<div class="console-placeholder">Click 'Run Code' to execute your solution against the hidden test cases.</div>`;
        testStatus.textContent = 'Awaiting Execution';
        testStatus.className = 'test-status';

        // Reset Chat & Timer
        chatContainer.innerHTML = '';
        appendChatMessage('system', `Loaded Challenge: ${promptData.title}`);
        appendChatMessage('ai', `Hello! Thanks for joining. Let's start with the <strong>${promptData.title}</strong> problem.<br><br>You have 30 minutes. Let me know if you have any questions before you begin writing your function!`);
        startTimer();
    }

    promptSelect.addEventListener('change', (e) => loadPrompt(e.target.value));

    // --- 5. Code Execution Engine ---
    function areEqual(actual, expected, isArray) {
        if (isArray) {
            if (!Array.isArray(actual)) return false;
            if (actual.length !== expected.length) return false;
            for (let i = 0; i < actual.length; i++) {
                if (actual[i] !== expected[i]) return false;
            }
            return true;
        }
        return actual === expected;
    }

    btnRun.addEventListener('click', () => {
        const userCode = codeEditor.value;
        const promptData = prompts[currentPrompt];
        
        consoleOutput.innerHTML = '';
        let allPassed = true;
        let executionError = null;

        try {
            // Safe evaluation: We wrap the user's function inside another function
            // and then return the inner function to test it.
            // Example: "return (function reverseString(str) { ... return ... });"
            const wrap = `
                ${userCode}
                return ${promptData.funcName};
            `;
            const userFunc = new Function(wrap)();

            if (typeof userFunc !== 'function') {
                throw new Error(`Cannot find function named '${promptData.funcName}'. Make sure you didn't change the function signature!`);
            }

            // Run Tests
            promptData.tests.forEach((test, idx) => {
                let actualResult;
                let passed = false;
                
                try {
                    // Call the user function with test inputs using spread operator
                    actualResult = userFunc(...test.input);
                    passed = areEqual(actualResult, test.expected, test.isArray);
                } catch(e) {
                    actualResult = `Error: ${e.message}`;
                    passed = false;
                }

                if (!passed) allPassed = false;

                // Format inputs and outputs for display
                const inputStr = JSON.stringify(test.input).slice(1, -1); // remove [ ] from arguments array
                const expStr = JSON.stringify(test.expected);
                const actStr = actualResult !== undefined ? JSON.stringify(actualResult) : 'undefined';

                const testDiv = document.createElement('div');
                testDiv.className = `test-case ${passed ? 'pass' : 'fail'}`;
                testDiv.innerHTML = `
                    <div><strong>Test ${idx + 1}:</strong> ${promptData.funcName}(${inputStr})</div>
                    <div><strong>Expected:</strong> ${expStr}</div>
                    <div><strong>Actual:</strong> <span class="result-actual ${passed ? 'pass' : 'fail'}">${actStr}</span></div>
                `;
                consoleOutput.appendChild(testDiv);
            });

        } catch (err) {
            executionError = err;
            allPassed = false;
            consoleOutput.innerHTML = `<div style="color: var(--danger); font-weight:bold;">Syntax/Execution Error:</div><div>${err.message}</div>`;
        }

        // Update UI
        if (allPassed) {
            testStatus.textContent = 'All Tests Passed';
            testStatus.className = 'test-status passed';
            appendChatMessage('ai', `Excellent work! All test cases passed for <strong>${promptData.title}</strong>.<br><br>Can you think of a way to optimize this further, or discuss the Big O time and space complexity of your approach?`);
        } else {
            testStatus.textContent = 'Tests Failed';
            testStatus.className = 'test-status failed';
            
            if (executionError) {
                appendChatMessage('ai', `It looks like there's a syntax error preventing the code from running: <br><pre>${executionError.message}</pre><br>Take a closer look at your code structure.`);
            } else {
                appendChatMessage('ai', `Your code executed, but it didn't pass all the test cases. Check the Console Output to see where the actual results differed from the expected results. Keep trying!`);
            }
        }
    });

    // Initialize first load
    loadPrompt('reverse');
});
