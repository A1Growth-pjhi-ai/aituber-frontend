// AI処理（Gemini/Ollama連携）
import { USE_GEMINI, GEMINI_API_KEY, GEMINI_MODEL, OLLAMA_URL, MODEL_NAME, MAX_HISTORY_LENGTH } from './config.js';
import { getWeather, detectCity } from './api.js';
import { updateCharacter, getCurrentEmotion } from './character.js';
import { addToVoiceQueue, playVoiceQueue } from './voice.js';

// User conversation history
const userConversations = new Map();
let isProcessing = false;

// Gemini API処理（JSON形式の応答用）
async function processGeminiAI(prompt, statusTextElement) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 200
            }
        })
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            try {
                const json = JSON.parse(line);
                if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
                    const text = json.candidates[0].content.parts[0].text;
                    accumulatedText += text;
                }
            } catch (e) {
                // Skip invalid JSON
            }
        }
    }
    
    return accumulatedText;
}

// Process AI response
export async function processAI(userInput, username = null, isSuperChat = false, amount = 0, statusTextElement) {
    if (isProcessing) return;
    isProcessing = true;
    
    if (statusTextElement) {
        statusTextElement.textContent = '考え中...';
    }
    updateCharacter('DEFAULT');
    
    let prompt = '';
    
    if (isSuperChat) {
        // スーパーチャット用のプロンプト
        prompt = `あなたは人気のライブ配信者です。視聴者との交流を大切にし、明るく親しみやすい話し方をします。
${username}さんから¥${amount.toLocaleString()}のスーパーチャットをいただきました！
コメント内容: "${userInput}"

以下のルールで感謝の気持ちを込めて返信してください：
1. まず「${username}さん、ありがとうございます！」と名前を呼んで感謝を伝える
2. 金額に応じた驚きや喜びを表現
3. コメント内容に対して具体的に反応
4. 短く、1〜2文で自然な配信者らしい言葉遣いで
5. 返答内容だけを出力してください。JSON形式や「emotion」「message」などの文字は含めないでください。`;
    } else if (username) {
        // ユーザーの会話履歴を取得
        if (!userConversations.has(username)) {
            userConversations.set(username, []);
        }
        const history = userConversations.get(username);
        
        // 履歴を文字列化
        let historyText = '';
        if (history.length > 0) {
            historyText = '\n\n過去の会話履歴:\n' + history.map(h => `${h.user}: ${h.message}\nあなた: ${h.response}`).join('\n');
        }
        
        // 天気に関する質問かチェック
        const weatherKeywords = ['天気', '気温', '暑い', '寒い', '雨', '晴れ', '曇り', 'weather', 'temperature'];
        const isWeatherQuestion = weatherKeywords.some(keyword => userInput.includes(keyword));
        
        let weatherInfo = '';
        if (isWeatherQuestion) {
            const city = detectCity(userInput) || 'Yokohama';
            const weather = await getWeather(city);
            if (weather) {
                weatherInfo = `\n\n現在の天気情報（${weather.city}）:\n気温: ${weather.temp}°C\n天気: ${weather.description}\n湿度: ${weather.humidity}%`;
            }
        }
        
        // 通常コメント用のプロンプト
        prompt = `あなたは人気のライブ配信者です。視聴者との交流を大切にし、明るく親しみやすい話し方をします。
${username}さんからコメントが来ました: "${userInput}"${historyText}${weatherInfo}

以下のルールで返信してください：
1. 過去の会話を覚えていて、文脈を理解した返答をする
2. 天気情報が提供されている場合は、その情報を使って具体的に答える
3. コメントが質問、応援、感謝、挨拶など、個人的な内容の場合は「${username}さん、」と名前を呼んでから返答
4. 一般的な話題や雑談の場合は、名前を呼ばずに自然に返答
5. コメント内容に対して具体的に反応
6. 配信者らしく、視聴者を楽しませる雰囲気で
7. 短く、1〜2文で自然に
8. 返答は以下のJSON形式で出力してください：
{"emotion": "DEFAULT/HAPPY/SAD/ANGRY", "message": "返答内容"}

感情の選び方：
- DEFAULT: 通常の会話、質問への回答
- HAPPY: 嬉しい、楽しい、感謝、褒められた
- SAD: 悲しい、残念、心配
- ANGRY: 怒り、不満、驚き（悪い意味で）`;
    } else {
        // 自動トーク用のプロンプト
        prompt = `あなたは人気のライブ配信者です。視聴者との交流を大切にし、明るく親しみやすい話し方をします。
配信中の雑談として、以下のトピックについて話してください: "${userInput}"

配信者らしく、視聴者に語りかけるように話してください。
短く、1〜2文で自然に。
返答内容だけを出力してください。JSON形式や「emotion」「message」などの文字は含めないでください。`;
    }

    try {
        let accumulatedText = '';
        
        // Gemini APIを使用する場合
        if (USE_GEMINI) {
            accumulatedText = await processGeminiAI(prompt, statusTextElement);
        } else {
            // Ollama を使用する場合
            const response = await fetch(OLLAMA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    prompt: prompt,
                    stream: true
                })
            });
        
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
        
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
            
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
            
                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        if (json.response) {
                            accumulatedText += json.response;
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
        
        // Extract JSON from accumulated text
        const jsonMatch = accumulatedText.match(/\{.*\}/s);
        console.log('[AI] 累積テキスト:', accumulatedText);
        console.log('[AI] JSON抽出結果:', jsonMatch ? jsonMatch[0] : 'なし');
        
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                const message = parsed.message || 'ごめん、ちょっとうまく聞き取れなかったかも。';
                const emotion = parsed.emotion || 'DEFAULT';
                
                console.log('[AI] パース成功 - 感情:', emotion, 'メッセージ:', message);
                
                updateCharacter(emotion);
                if (statusTextElement) {
                    statusTextElement.textContent = '';
                }
                
                // 会話履歴を保存
                if (username && !isSuperChat) {
                    const history = userConversations.get(username);
                    history.push({
                        user: username,
                        message: userInput,
                        response: message
                    });
                    
                    if (history.length > MAX_HISTORY_LENGTH) {
                        history.shift();
                    }
                }
                
                return message;
            } catch (jsonError) {
                console.error('[AI] JSONパースエラー:', jsonError);
                console.error('[AI] パース対象:', jsonMatch[0]);
                
                // JSONパースに失敗した場合
                const messageMatch = accumulatedText.match(/"message"\s*:\s*"([^"]+)"/);
                if (messageMatch) {
                    console.log('[AI] 正規表現でメッセージ抽出:', messageMatch[1]);
                    return messageMatch[1];
                }
                console.log('[AI] JSON形式なし、生テキスト返却');
                return accumulatedText.replace(/[{}]/g, '');
            }
        } else {
            console.log('[AI] JSON形式が見つかりません、生テキスト返却');
        }
        
        return accumulatedText;
        
    } catch (error) {
        console.error('AI processing error:', error);
        if (statusTextElement) {
            statusTextElement.textContent = 'エラー: ' + error.message;
        }
        throw error;
    } finally {
        isProcessing = false;
    }
}

export function getIsProcessing() {
    return isProcessing;
}
