// Main initialization and event handlers
import { 
    USE_GEMINI, 
    GEMINI_API_KEY, 
    GEMINI_MODEL,
    OLLAMA_URL,
    MODEL_NAME,
    VOICEVOX_URL,
    SPEAKER_ID,
    VOICE_SPEED,
    BGM_FILE,
    BGM_VOLUME,
    CHARACTER_IMAGES,
    MAX_HISTORY_LENGTH,
    AUTO_TALK_INTERVAL,
    ACKNOWLEDGMENT_PHRASES,
    QUICK_RESPONSES,
    AUTO_TALK_TOPICS
} from './config.js';

//import { getWeather, getJapanNews, getTrivia, detectCity } from './api.js';
import { generateVoice, playVoiceQueue, initBGM as voiceInitBGM, setBGMVolume as voiceSetBGMVolume, getAudioOutputDevices, setAudioOutputDevice } from './voice.js';
import { updateCharacter, initCharacter, getCurrentEmotion } from './character.js';
import { processAI } from './ai.js';
import { checkQuickResponse, playAcknowledgment } from './responses.js';
import { addMessage } from './chat.js';
import { startAutoTalk, resetInteractionTimer } from './autotalk.js';
import { Live2DManager } from './live2d.js';

// Global state
export let currentEmotion = 'DEFAULT';
export let isProcessing = false;
export let isStreamActive = true;
export let voiceQueue = [];
export let isPlayingVoice = false;
export let currentAudio = null;
export let bgmAudio = null;
export let lastInteractionTime = Date.now();
export let autoTalkTimer = null;

// Live2D Manager
export let live2dManager = null;

// User conversation history
export const userConversations = new Map();

// DOM Elements
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const statusText = document.getElementById('statusText');
const characterImage = document.getElementById('characterImage');
const emotionStatus = document.getElementById('emotionStatus');
const toggleStreamBtn = document.getElementById('toggleStreamBtn');
const liveIndicator = document.getElementById('liveIndicator');
const liveStatus = document.getElementById('liveStatus');
const superChatBtn = document.getElementById('superChatBtn');
const superChatModal = document.getElementById('superChatModal');
const closeSuperChatModal = document.getElementById('closeSuperChatModal');
const sendSuperChat = document.getElementById('sendSuperChat');
const superChatMessage = document.getElementById('superChatMessage');
const bgmVolumeSlider = document.getElementById('bgmVolumeSlider');
const bgmVolumeText = document.getElementById('bgmVolumeText');

// Update time
function updateTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = 
        now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '_JST';
}


// Handle form submission
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!isStreamActive) {
        statusText.textContent = '配信が停止中です';
        return;
    }
    
    const message = chatInput.value.trim();
    const username = document.getElementById('usernameInput').value.trim() || 'ゲスト';
    
    if (!message) return;
    
    resetInteractionTimer();
    addMessage(username, message, false, chatMessages);
    chatInput.value = '';
    
    const quickResponse = checkQuickResponse(message);
    
    if (quickResponse) {
        updateCharacter('HAPPY');
        generateVoice(quickResponse);
        statusText.textContent = '';
    } else {
        // 相づちなしで直接AI処理、応答を音声出力
        processAI(message, username, false, 0, statusText).then(aiResponse => {
            if (aiResponse) {
                console.log('[Main] AI応答を音声出力:', aiResponse);
                generateVoice(aiResponse, getCurrentEmotion());
            }
        });
    }
});

// Toggle stream button
toggleStreamBtn.addEventListener('click', () => {
    isStreamActive = !isStreamActive;
    
    if (isStreamActive) {
        toggleStreamBtn.textContent = '配信停止';
        toggleStreamBtn.classList.remove('bg-primary-container/20', 'border-primary-container/40', 'text-primary-container');
        toggleStreamBtn.classList.add('bg-error/20', 'border-error/40', 'text-error');
        liveIndicator.classList.add('animate-pulse');
        liveStatus.textContent = 'LIVE';
        
        // startAutoTalk(chatMessages, statusText); // 自動トークを無効化
        
        if (bgmAudio && bgmAudio.paused) {
            bgmAudio.play();
        }
        
        addMessage('システム', '配信を再開しました。', true, chatMessages);
    } else {
        toggleStreamBtn.textContent = '配信再開';
        toggleStreamBtn.classList.remove('bg-error/20', 'border-error/40', 'text-error');
        toggleStreamBtn.classList.add('bg-primary-container/20', 'border-primary-container/40', 'text-primary-container');
        liveIndicator.classList.remove('animate-pulse');
        liveStatus.textContent = 'OFFLINE';
        
        if (autoTalkTimer) {
            clearInterval(autoTalkTimer);
            autoTalkTimer = null;
        }
        
        if (bgmAudio && !bgmAudio.paused) {
            bgmAudio.pause();
        }
        
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        
        voiceQueue = [];
        isPlayingVoice = false;
        
        addMessage('システム', '配信を停止しました。', true, chatMessages);
    }
});

// Super Chat functionality
let selectedAmount = 0;

superChatBtn.addEventListener('click', () => {
    superChatModal.classList.remove('hidden');
    superChatModal.classList.add('flex');
    selectedAmount = 0;
});

closeSuperChatModal.addEventListener('click', () => {
    superChatModal.classList.add('hidden');
    superChatModal.classList.remove('flex');
});

document.querySelectorAll('.superchat-amount').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.superchat-amount').forEach(b => {
            b.classList.remove('bg-secondary/40', 'border-secondary');
            b.classList.add('bg-surface-container', 'border-secondary/30');
        });
        
        btn.classList.remove('bg-surface-container', 'border-secondary/30');
        btn.classList.add('bg-secondary/40', 'border-secondary');
        
        selectedAmount = parseInt(btn.dataset.amount);
    });
});

sendSuperChat.addEventListener('click', async () => {
    if (selectedAmount === 0) {
        alert('金額を選択してください');
        return;
    }

    const message = superChatMessage.value.trim();
    const username = document.getElementById('usernameInput').value.trim() || 'ゲスト';
    
    if (!message) {
        alert('メッセージを入力してください');
        return;
    }

    isProcessing = false;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'space-y-1 bg-secondary/20 p-3 rounded border-l-4 border-secondary shadow-[0_0_15px_rgba(235,178,255,0.3)]';
    
    const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    messageDiv.innerHTML = `
        <div class="flex items-center justify-between">
            <p class="text-[10px] font-['JetBrains_Mono'] text-secondary/80">${time}</p>
            <span class="text-xs font-['JetBrains_Mono'] font-bold text-secondary">¥${selectedAmount.toLocaleString()}</span>
        </div>
        <p class="font-['JetBrains_Mono'] text-sm">
            <span class="text-secondary font-bold">${username}:</span> 
            ${message}
        </p>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    updateCharacter('HAPPY');
    const thankYouMessage = `${username}さん、ありがとうございます！`;
    await generateVoice(thankYouMessage);

    const aiResponse = await processAI(message, username, true, selectedAmount, statusText);
    if (aiResponse) {
        console.log('[Main] スーパーチャットAI応答を音声出力:', aiResponse);
        await generateVoice(aiResponse, getCurrentEmotion());
    }

    superChatModal.classList.add('hidden');
    superChatModal.classList.remove('flex');
    superChatMessage.value = '';
    selectedAmount = 0;
    
    document.querySelectorAll('.superchat-amount').forEach(b => {
        b.classList.remove('bg-secondary/40', 'border-secondary');
        b.classList.add('bg-surface-container', 'border-secondary/30');
    });
});

// BGM Volume Slider
bgmVolumeSlider.addEventListener('input', (e) => {
    const volume = parseInt(e.target.value) / 100;
    voiceSetBGMVolume(volume);
    bgmVolumeText.textContent = `${e.target.value}%`;
});

// Audio Output Device Selection
async function initAudioOutputDevices() {
    const audioOutputSelect = document.getElementById('audioOutputSelect');
    
    try {
        const devices = await getAudioOutputDevices();
        
        // デバイスリストをクリア
        audioOutputSelect.innerHTML = '<option value="">デフォルト</option>';
        
        // VB-Audioデバイスを探して追加
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `デバイス ${device.deviceId.substring(0, 8)}`;
            audioOutputSelect.appendChild(option);
            
            // VB-Audioデバイスを自動選択
            if (device.label && (device.label.includes('VB-Audio') || device.label.includes('CABLE'))) {
                option.selected = true;
                setAudioOutputDevice(device.deviceId);
                console.log('VB-Audioデバイスを自動選択:', device.label);
            }
        });
        
        // デバイス変更イベント
        audioOutputSelect.addEventListener('change', (e) => {
            const deviceId = e.target.value;
            setAudioOutputDevice(deviceId);
            console.log('音声出力デバイスを変更:', deviceId || 'デフォルト');
        });
        
    } catch (error) {
        console.error('オーディオデバイス初期化エラー:', error);
    }
}

// Initialize Live2D
async function initLive2D() {
    try {
        console.log('Live2D 初期化を開始します...');
        
        live2dManager = new Live2DManager(
            'live2dCanvas',
            'models/kazuya/kazuya.model3.json'
        );
        
        const success = await live2dManager.init();
        
        if (success) {
            console.log('✅ Live2D 初期化成功');
            addMessage('システム', 'Live2D モデルを読み込みました。', true, chatMessages);
            
            // マウス追従を有効化
            live2dManager.enableMouseTracking();
            
            // 自動まばたきを有効化
            live2dManager.enableAutoBlinking();
            
            // アイドルモーションを再生
            setTimeout(() => {
                live2dManager.playMotion('mtn/001_Idle.motion3.json', 0);
            }, 1000);
            
            // グローバルに公開
            window.live2dManager = live2dManager;
        } else {
            console.error('❌ Live2D 初期化失敗');
            addMessage('システム', 'Live2D モデルの読み込みに失敗しました。', true, chatMessages);
        }
    } catch (error) {
        console.error('Live2D 初期化エラー:', error);
        addMessage('システム', 'Live2D エラー: ' + error.message, true, chatMessages);
    }
}

// Initialize
initCharacter();
// voiceInitBGM(BGM_FILE); // BGMを無効化
initLive2D(); // Live2D を初期化
initAudioOutputDevices(); // オーディオ出力デバイスを初期化

setInterval(updateTime, 1000);
updateTime();

addMessage('システム', 'AITuberシステムが起動しました。メッセージを入力してください。', true, chatMessages);
// addMessage('システム', '30秒間入力がない場合、自動的に話し始めます。', true, chatMessages);
// addMessage('システム', 'BGMを再生するには画面をクリックしてください。', true, chatMessages);

// startAutoTalk(chatMessages, statusText); // 自動トークを無効化

// Export for other modules
export { 
    statusText, 
    chatMessages
};
