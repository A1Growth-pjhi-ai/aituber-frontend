// VTube Studio API Integration
// VTube Studio API Documentation: https://github.com/DenchiSoft/VTubeStudio

export class VTubeStudioAPI {
    constructor(url = 'ws://localhost:8001') {
        this.url = url;
        this.ws = null;
        this.connected = false;
        this.authenticated = false;
        this.authToken = null;
        this.pluginName = 'AITuber Live System';
        this.pluginDeveloper = 'AITuber';
        this.messageId = 0;
        this.callbacks = new Map();
        this.currentModel = null;
        this.availableParameters = [];
    }

    // WebSocket接続
    connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);
                
                this.ws.onopen = () => {
                    console.log('VTube Studio WebSocket接続成功');
                    this.connected = true;
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
                
                this.ws.onerror = (error) => {
                    console.error('VTube Studio WebSocket エラー:', error);
                    this.connected = false;
                    reject(error);
                };
                
                this.ws.onclose = () => {
                    console.log('VTube Studio WebSocket接続終了');
                    this.connected = false;
                    this.authenticated = false;
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    // メッセージ送信
    sendMessage(messageType, data = {}) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(new Error('VTube Studioに接続されていません'));
                return;
            }

            const messageId = `msg_${this.messageId++}`;
            const message = {
                apiName: 'VTubeStudioPublicAPI',
                apiVersion: '1.0',
                requestID: messageId,
                messageType: messageType,
                data: data
            };

            this.callbacks.set(messageId, { resolve, reject });
            this.ws.send(JSON.stringify(message));

            // タイムアウト設定（10秒）
            setTimeout(() => {
                if (this.callbacks.has(messageId)) {
                    this.callbacks.delete(messageId);
                    reject(new Error('リクエストタイムアウト'));
                }
            }, 10000);
        });
    }

    // メッセージ受信処理
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            const requestID = message.requestID;

            if (this.callbacks.has(requestID)) {
                const { resolve, reject } = this.callbacks.get(requestID);
                this.callbacks.delete(requestID);

                if (message.data && message.data.errorID) {
                    reject(new Error(message.data.message || 'Unknown error'));
                } else {
                    resolve(message.data);
                }
            }
        } catch (error) {
            console.error('メッセージ解析エラー:', error);
        }
    }

    // 認証トークン取得
    async requestAuthToken() {
        try {
            const response = await this.sendMessage('AuthenticationTokenRequest', {
                pluginName: this.pluginName,
                pluginDeveloper: this.pluginDeveloper
            });

            this.authToken = response.authenticationToken;
            localStorage.setItem('vtubeStudioAuthToken', this.authToken);
            console.log('認証トークン取得成功');
            return this.authToken;
        } catch (error) {
            console.error('認証トークン取得エラー:', error);
            throw error;
        }
    }

    // 認証
    async authenticate() {
        try {
            // ローカルストレージから既存のトークンを取得
            const savedToken = localStorage.getItem('vtubeStudioAuthToken');
            if (savedToken) {
                this.authToken = savedToken;
            }

            // トークンがない場合は新規取得
            if (!this.authToken) {
                await this.requestAuthToken();
            }

            // 認証実行
            const response = await this.sendMessage('AuthenticationRequest', {
                pluginName: this.pluginName,
                pluginDeveloper: this.pluginDeveloper,
                authenticationToken: this.authToken
            });

            this.authenticated = response.authenticated;
            
            if (!this.authenticated) {
                // 認証失敗時は新しいトークンを取得
                await this.requestAuthToken();
                return await this.authenticate();
            }

            console.log('VTube Studio認証成功');
            return true;
        } catch (error) {
            console.error('認証エラー:', error);
            throw error;
        }
    }

    // 現在のモデル情報取得
    async getCurrentModel() {
        try {
            const response = await this.sendMessage('CurrentModelRequest');
            this.currentModel = response;
            return response;
        } catch (error) {
            console.error('モデル情報取得エラー:', error);
            throw error;
        }
    }

    // 利用可能なパラメータ一覧取得
    async getAvailableParameters() {
        try {
            const response = await this.sendMessage('InputParameterListRequest');
            this.availableParameters = response.defaultParameters || [];
            return this.availableParameters;
        } catch (error) {
            console.error('パラメータ一覧取得エラー:', error);
            throw error;
        }
    }

    // パラメータ値を設定
    async setParameterValue(parameterId, value, weight = 1.0) {
        try {
            await this.sendMessage('InjectParameterDataRequest', {
                parameterValues: [{
                    id: parameterId,
                    value: value,
                    weight: weight
                }]
            });
        } catch (error) {
            console.error('パラメータ設定エラー:', error);
            throw error;
        }
    }

    // 複数のパラメータを一度に設定
    async setMultipleParameters(parameters) {
        try {
            const parameterValues = parameters.map(param => ({
                id: param.id,
                value: param.value,
                weight: param.weight || 1.0
            }));

            await this.sendMessage('InjectParameterDataRequest', {
                parameterValues: parameterValues
            });
        } catch (error) {
            console.error('複数パラメータ設定エラー:', error);
            throw error;
        }
    }

    // 口の開閉（リップシンク）
    async setMouthOpen(value) {
        // value: 0.0 (閉じる) ~ 1.0 (開く)
        try {
            await this.setParameterValue('MouthOpen', value);
        } catch (error) {
            console.error('口の開閉エラー:', error);
        }
    }

    // 表情変更（ホットキー使用）
    async triggerHotkey(hotkeyID) {
        try {
            await this.sendMessage('HotkeyTriggerRequest', {
                hotkeyID: hotkeyID
            });
        } catch (error) {
            console.error('ホットキートリガーエラー:', error);
            throw error;
        }
    }

    // 利用可能なホットキー一覧取得
    async getAvailableHotkeys() {
        try {
            const response = await this.sendMessage('HotkeysInCurrentModelRequest');
            return response.availableHotkeys || [];
        } catch (error) {
            console.error('ホットキー一覧取得エラー:', error);
            throw error;
        }
    }

    // 表情変更（表情名で指定）
    async setExpression(expressionName) {
        try {
            const hotkeys = await this.getAvailableHotkeys();
            const expressionHotkey = hotkeys.find(hk => 
                hk.name.toLowerCase().includes(expressionName.toLowerCase())
            );

            if (expressionHotkey) {
                await this.triggerHotkey(expressionHotkey.hotkeyID);
            } else {
                console.warn(`表情 "${expressionName}" が見つかりません`);
            }
        } catch (error) {
            console.error('表情変更エラー:', error);
        }
    }

    // 感情に基づいた表情設定
    async setEmotionExpression(emotion) {
        const emotionMap = {
            'NORMAL': 'normal',
            'DEFAULT': 'normal',
            'HAPPY': 'happy',
            'SAD': 'sad',
            'ANGRY': 'angry',
            'SURPRISED': 'surprised'
        };

        const expressionName = emotionMap[emotion] || 'normal';
        await this.setExpression(expressionName);
    }

    // ランダムモーション再生
    async playRandomMotion(motionNames) {
        try {
            console.log('ランダムモーション再生開始:', motionNames);
            const hotkeys = await this.getAvailableHotkeys();
            console.log('利用可能なホットキー:', hotkeys.map(hk => hk.name));
            
            const motionHotkeys = hotkeys.filter(hk => 
                motionNames.some(name => hk.name.toLowerCase().includes(name.toLowerCase()))
            );
            console.log('マッチしたホットキー:', motionHotkeys.map(hk => hk.name));

            if (motionHotkeys.length > 0) {
                const randomHotkey = motionHotkeys[Math.floor(Math.random() * motionHotkeys.length)];
                console.log(`ランダムモーション再生: ${randomHotkey.name}`);
                await this.triggerHotkey(randomHotkey.hotkeyID);
            } else {
                console.warn('指定されたモーションが見つかりません:', motionNames);
            }
        } catch (error) {
            console.error('ランダムモーション再生エラー:', error);
        }
    }

    // リップシンク実行
    async performLipSync(lipData, voiceSpeed = 1.0) {
        try {
            for (const segment of lipData) {
                const vowel = segment.vowel;
                const duration = segment.duration / voiceSpeed;
                
                // 母音に応じて口の開き具合を調整
                const openValues = {
                    'a': 1.0,
                    'i': 0.4,
                    'u': 0.6,
                    'e': 0.7,
                    'o': 0.8,
                    'N': 0.2,
                    'pau': 0.0,
                    'cl': 0.0
                };
                
                const openValue = openValues[vowel] || 0.0;
                await this.setMouthOpen(openValue);
                
                await new Promise(resolve => setTimeout(resolve, duration * 1000));
            }
            
            // 最後に口を閉じる
            await this.setMouthOpen(0.0);
        } catch (error) {
            console.error('リップシンクエラー:', error);
        }
    }

    // 接続解除
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.connected = false;
            this.authenticated = false;
        }
    }

    // 接続状態確認
    isConnected() {
        return this.connected && this.authenticated;
    }
}

// VTube Studio Manager（簡易インターフェース）
export class VTubeStudioManager {
    constructor(url = 'ws://localhost:8001') {
        this.api = new VTubeStudioAPI(url);
        this.initialized = false;
    }

    // 初期化
    async initialize() {
        try {
            await this.api.connect();
            await this.api.authenticate();
            await this.api.getCurrentModel();
            await this.api.getAvailableParameters();
            this.initialized = true;
            console.log('VTube Studio Manager初期化完了');
            return true;
        } catch (error) {
            console.error('VTube Studio Manager初期化エラー:', error);
            throw error;
        }
    }

    // 表情変更
    async changeExpression(emotion) {
        if (!this.initialized) {
            console.warn('VTube Studio Managerが初期化されていません');
            return;
        }
        await this.api.setEmotionExpression(emotion);
    }

    // リップシンク
    async lipSync(lipData, voiceSpeed = 1.0) {
        if (!this.initialized) {
            console.warn('VTube Studio Managerが初期化されていません');
            return;
        }
        await this.api.performLipSync(lipData, voiceSpeed);
    }

    // ランダムモーション再生
    async playRandomMotion(motionNames) {
        if (!this.initialized) {
            console.warn('VTube Studio Managerが初期化されていません');
            return;
        }
        await this.api.playRandomMotion(motionNames);
    }

    // モデル情報取得
    getModelInfo() {
        return this.api.currentModel;
    }

    // 接続状態
    isConnected() {
        return this.api.isConnected();
    }

    // 切断
    disconnect() {
        this.api.disconnect();
        this.initialized = false;
    }
}
