// キャラクター制御
import { CHARACTER_IMAGES } from './config.js';

let currentEmotion = 'DEFAULT';
let characterImage = null;
let emotionStatus = null;

// Initialize character elements
export function initCharacter() {
    characterImage = document.getElementById('characterImage');
    emotionStatus = document.getElementById('emotionStatus');
}

// Update character image
export function updateCharacter(emotion, isOpen = false) {
    currentEmotion = emotion.toUpperCase();
    const imageKey = isOpen ? `${currentEmotion}_OPEN` : currentEmotion;
    const imagePath = CHARACTER_IMAGES[imageKey] || CHARACTER_IMAGES['DEFAULT'];
    
    // デバッグログ追加
    console.log(`[Character] 感情更新: ${currentEmotion}, isOpen: ${isOpen}`);
    
    // 画像の更新（非表示なので実質無効）
    if (characterImage) {
        characterImage.src = imagePath;
    }
    if (emotionStatus) {
        emotionStatus.textContent = currentEmotion;
        console.log(`[Character] 感情ステータス表示更新: ${currentEmotion}`);
    } else {
        console.warn('[Character] emotionStatus要素が見つかりません');
    }
    
    // Live2Dの表情変更
    if (window.live2dManager && window.live2dManager.isInitialized) {
        // 表情に応じたモーション再生
        const emotionMotionMap = {
            'HAPPY': 'mtn/002_Happy.motion3.json',
            'SAD': 'mtn/003_Sad.motion3.json',
            'ANGRY': 'mtn/004_Angry.motion3.json',
            'DEFAULT': 'mtn/001_Idle.motion3.json'
        };
        
        const motionFile = emotionMotionMap[currentEmotion] || emotionMotionMap['DEFAULT'];
        console.log(`[Character] Live2Dモーション再生: ${motionFile}`);
        
        // モーションが存在する場合のみ再生を試みる
        try {
            window.live2dManager.playMotion(motionFile, 0);
        } catch (error) {
            // モーションが存在しない場合は無視
            console.log(`モーション ${motionFile} が見つかりません（スキップ）`);
        }
    } else {
        console.log('[Character] Live2Dマネージャーが初期化されていません');
    }
}

// Get current emotion
export function getCurrentEmotion() {
    return currentEmotion;
}
