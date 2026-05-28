// 音声生成とリップシンク
import { USE_ELEVENLABS, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL_ID, VOICEVOX_URL, SPEAKER_ID, VOICE_SPEED, BGM_VOLUME } from './config.js';
import { updateCharacter } from './character.js';

let bgmAudio = null;
let voiceQueue = [];
let isPlayingVoice = false;
let audioContext = null;
let selectedAudioDevice = null;

// Lip sync animation
async function lipSync(lipData, currentEmotion) {
    for (const segment of lipData) {
        const vowel = segment.vowel;
        const duration = segment.duration / VOICE_SPEED;
        
        const isOpen = ['a', 'i', 'u', 'e', 'o'].includes(vowel);
        
        // 画像の口パク（非表示なので実質無効）
        updateCharacter(currentEmotion, isOpen);
        
        // Live2Dのリップシンク
        if (window.live2dManager && window.live2dManager.isInitialized) {
            const mouthValue = isOpen ? 1.0 : 0.0;
            window.live2dManager.setMouthOpen(mouthValue);
        }
        
        await new Promise(resolve => setTimeout(resolve, duration * 1000));
    }
    
    // 口を閉じる
    updateCharacter(currentEmotion, false);
    if (window.live2dManager && window.live2dManager.isInitialized) {
        window.live2dManager.setMouthOpen(0);
    }
}

// Initialize Audio Context and select output device
async function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Set audio output device (VB-Audio Cable)
export async function setAudioOutputDevice(deviceId) {
    selectedAudioDevice = deviceId;
    console.log('音声出力デバイスを設定:', deviceId);
}

// Get available audio output devices
export async function getAudioOutputDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        console.log('利用可能な音声出力デバイス:', audioOutputs);
        return audioOutputs;
    } catch (error) {
        console.error('デバイス一覧取得エラー:', error);
        return [];
    }
}

// ElevenLabs音声生成
async function generateVoiceElevenLabs(text, currentEmotion = 'DEFAULT') {
    if (!ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs APIキーが設定されていません');
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
            text: text,
            model_id: ELEVENLABS_MODEL_ID,
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true
            }
        })
    });

    if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
}

// VOICEVOX音声生成
async function generateVoiceVOICEVOX(text, currentEmotion = 'DEFAULT') {
    // Audio query
    const r1 = await fetch(`${VOICEVOX_URL}/audio_query?text=${encodeURIComponent(text)}&speaker=${SPEAKER_ID}`, {
        method: 'POST'
    });
    const query = await r1.json();
    query.speedScale = VOICE_SPEED;

    // Extract lip sync data
    const lipData = [];
    for (const phrase of query.accent_phrases) {
        for (const mora of phrase.moras) {
            const duration = mora.vowel_length + (mora.consonant_length || 0);
            lipData.push({ vowel: mora.vowel, duration: duration });
        }
    }

    // Synthesis
    const r2 = await fetch(`${VOICEVOX_URL}/synthesis?speaker=${SPEAKER_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
    });
    const audioBlob = await r2.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    return { audioUrl, lipData };
}

// Generate and play voice with device selection support
export async function generateVoice(text, currentEmotion = 'DEFAULT') {
    try {
        // BGM音量を下げる（ダッキング）
        const originalBGMVolume = bgmAudio ? bgmAudio.volume : BGM_VOLUME;
        if (bgmAudio && !bgmAudio.paused) {
            bgmAudio.volume = BGM_VOLUME * 0.2;
        }

        let audioUrl;
        let lipData = [];

        // 音声生成エンジンを選択
        if (USE_ELEVENLABS) {
            console.log('ElevenLabsで音声生成中...');
            audioUrl = await generateVoiceElevenLabs(text, currentEmotion);
            // ElevenLabsの場合、簡易的なリップシンクデータを生成
            const duration = text.length * 0.1; // 文字数から推定
            lipData = [{ vowel: 'a', duration: duration }];
        } else {
            console.log('VOICEVOXで音声生成中...');
            const result = await generateVoiceVOICEVOX(text, currentEmotion);
            audioUrl = result.audioUrl;
            lipData = result.lipData;
        }
        
        // Play audio with device selection
        const audio = new Audio(audioUrl);
        
        // VB-Audioデバイスが選択されている場合、そのデバイスに出力
        if (selectedAudioDevice && audio.setSinkId) {
            try {
                await audio.setSinkId(selectedAudioDevice);
                console.log('音声を指定デバイスに出力:', selectedAudioDevice);
            } catch (error) {
                console.warn('デバイス設定エラー:', error);
            }
        }
        
        // 音声再生終了時にBGM音量を戻す
        audio.addEventListener('ended', () => {
            if (bgmAudio) {
                bgmAudio.volume = originalBGMVolume;
            }
        });
        
        audio.play();
        
        // Start lip sync
        if (lipData.length > 0) {
            lipSync(lipData, currentEmotion);
        }
        
    } catch (error) {
        console.error('Voice generation error:', error);
        
        // エラー時もBGM音量を戻す
        if (bgmAudio) {
            bgmAudio.volume = BGM_VOLUME;
        }
        throw error;
    }
}

// Play voice from queue
export async function playVoiceQueue(currentEmotion) {
    if (isPlayingVoice || voiceQueue.length === 0) return;
    
    isPlayingVoice = true;
    
    while (voiceQueue.length > 0) {
        const text = voiceQueue.shift();
        await generateVoice(text, currentEmotion);
    }
    
    isPlayingVoice = false;
}

// Add to voice queue
export function addToVoiceQueue(text) {
    voiceQueue.push(text);
}

// BGM Functions
export function initBGM(bgmFile) {
    bgmAudio = new Audio(bgmFile);
    bgmAudio.loop = true;
    bgmAudio.volume = BGM_VOLUME;
    
    // ユーザーインタラクション後に自動再生
    document.addEventListener('click', function startBGM() {
        if (bgmAudio && bgmAudio.paused) {
            bgmAudio.play().catch(e => console.log('BGM再生エラー:', e));
        }
        document.removeEventListener('click', startBGM);
    }, { once: true });
}

export function toggleBGM() {
    if (!bgmAudio) return;
    if (bgmAudio.paused) {
        bgmAudio.play();
    } else {
        bgmAudio.pause();
    }
}

export function setBGMVolume(volume) {
    if (bgmAudio) {
        bgmAudio.volume = Math.max(0, Math.min(1, volume));
    }
}
