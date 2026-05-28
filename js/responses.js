// 相槌と定型文処理
import { ACKNOWLEDGMENT_PHRASES, QUICK_RESPONSES } from './config.js';
import { generateVoice } from './voice.js';
import { updateCharacter } from './character.js';

// Check for quick response
export function checkQuickResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    for (const [keyword, responses] of Object.entries(QUICK_RESPONSES)) {
        if (lowerMessage.includes(keyword)) {
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }
    
    return null;
}

// Play acknowledgment immediately
export async function playAcknowledgment() {
    if (ACKNOWLEDGMENT_PHRASES.length === 0) return;
    const phrase = ACKNOWLEDGMENT_PHRASES[Math.floor(Math.random() * ACKNOWLEDGMENT_PHRASES.length)];
    await generateVoice(phrase);
}

// Handle quick response
export function handleQuickResponse(message) {
    const quickResponse = checkQuickResponse(message);
    
    if (quickResponse) {
        updateCharacter('HAPPY');
        generateVoice(quickResponse);
        return true;
    }
    
    return false;
}
