document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');

    // Function to add a new message to the chat
    function addMessage(text, isUser = true) {
        if (!text.trim()) return;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'ai-message');

        let innerHTML = '';

        if (!isUser) {
            innerHTML += `<div class="msg-avatar"><i class="ph-fill ph-robot"></i></div>`;
        }

        innerHTML += `
            <div class="msg-content">
                <p>${text}</p>
            </div>
        `;

        messageDiv.innerHTML = innerHTML;
        chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Handle send button click
    sendBtn.addEventListener('click', () => {
        const text = chatInput.value;
        if (text) {
            addMessage(text, true);
            chatInput.value = '';
            
            // Simulate AI typing delay
            setTimeout(() => {
                addMessage("I'm analyzing your request. Give me a moment to gather the best study materials...", false);
            }, 1000);
        }
    });

    // Handle Enter key in input
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });

    // Handle History clicks
    const historyItems = document.querySelectorAll('.history-list li');
    historyItems.forEach(item => {
        item.addEventListener('click', () => {
            historyItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Change chat header
            const headerTitle = document.querySelector('.chat-header h2');
            headerTitle.textContent = item.textContent.trim();
        });
    });
});
