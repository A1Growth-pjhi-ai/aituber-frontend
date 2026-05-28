// チャット機能
export function addMessage(sender, message, isSystem = false, chatMessagesElement) {
    // システムメッセージ（AIの返答）は表示しない
    if (isSystem) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'space-y-1';
    
    const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    messageDiv.innerHTML = `
        <p class="text-[10px] font-['JetBrains_Mono'] text-primary-container/60">${time}</p>
        <p class="font-['JetBrains_Mono'] text-sm">
            <span class="text-secondary">${sender}:</span> 
            ${message}
        </p>
    `;
    
    chatMessagesElement.appendChild(messageDiv);
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
}

export function addSuperChatMessage(username, message, amount, chatMessagesElement) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'space-y-1 bg-secondary/20 p-3 rounded border-l-4 border-secondary shadow-[0_0_15px_rgba(235,178,255,0.3)]';
    
    const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    messageDiv.innerHTML = `
        <div class="flex items-center justify-between">
            <p class="text-[10px] font-['JetBrains_Mono'] text-secondary/80">${time}</p>
            <span class="text-xs font-['JetBrains_Mono'] font-bold text-secondary">¥${amount.toLocaleString()}</span>
        </div>
        <p class="font-['JetBrains_Mono'] text-sm">
            <span class="text-secondary font-bold">${username}:</span> 
            ${message}
        </p>
    `;
    
    chatMessagesElement.appendChild(messageDiv);
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
}
