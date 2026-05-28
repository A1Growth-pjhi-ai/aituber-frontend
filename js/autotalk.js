// 自動トーク機能
import { AUTO_TALK_INTERVAL, AUTO_TALK_CHECK_INTERVAL, AUTO_TALK_TOPICS } from './config.js';
import { getJapanNews, getTrivia } from './api.js';
import { processAI, getIsProcessing } from './ai.js';
import { addMessage } from './chat.js';
import { updateCharacter } from './character.js';
import { generateVoice } from './voice.js';

let autoTalkTimer = null;
let lastInteractionTime = Date.now();
let emotionTestIndex = 0;

// 感情テスト用のメッセージ
const EMOTION_TEST_MESSAGES = [
    { emotion: 'NORMAL', message: 'こんにちは！今日も配信見に来てくれてありがとう！' },
    { emotion: 'HAPPY', message: 'やったー！すごく嬉しい！みんなのおかげだよ！' },
    { emotion: 'SAD', message: 'うーん、ちょっと悲しいな...でも頑張るね。' },
    { emotion: 'ANGRY', message: 'ちょっと待って！それはないでしょ！' }
];

// Auto talk function
async function autoTalk(chatMessagesElement, statusTextElement, vtubeManager = null) {
    const timeSinceLastInteraction = Date.now() - lastInteractionTime;
    
    // ユーザーが10秒以上操作していない場合
    if (timeSinceLastInteraction >= 10000 && !getIsProcessing()) {
        // 感情テストメッセージを順番に表示
        const testMessage = EMOTION_TEST_MESSAGES[emotionTestIndex];
        emotionTestIndex = (emotionTestIndex + 1) % EMOTION_TEST_MESSAGES.length;
        
        // 感情を変更
        updateCharacter(testMessage.emotion);
        
        // VTube Studioの表情も変更
        if (vtubeManager && vtubeManager.isConnected()) {
            await vtubeManager.changeExpression(testMessage.emotion);
            
            // 感情に応じたモーションを再生
            if (testMessage.emotion === 'NORMAL' || testMessage.emotion === 'DEFAULT') {
                await vtubeManager.playRandomMotion(['00', '01', '06', '07', '08']);
            } else if (testMessage.emotion === 'HAPPY') {
                await vtubeManager.playRandomMotion(['03', '05']);
            } else if (testMessage.emotion === 'SAD') {
                await vtubeManager.playRandomMotion(['04']);
            }
        }
        
        // メッセージを表示
        addMessage('システム', `[感情テスト: ${testMessage.emotion}] ${testMessage.message}`, true, chatMessagesElement);
        
        // 音声を生成
        await generateVoice(testMessage.message);
        
        lastInteractionTime = Date.now();
    }
}

// Start auto talk timer
export function startAutoTalk(chatMessagesElement, statusTextElement, vtubeManager = null) {
    if (autoTalkTimer) clearInterval(autoTalkTimer);
    autoTalkTimer = setInterval(() => autoTalk(chatMessagesElement, statusTextElement, vtubeManager), AUTO_TALK_CHECK_INTERVAL);
}

// Reset interaction timer
export function resetInteractionTimer() {
    lastInteractionTime = Date.now();
}
