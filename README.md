# VTubeStudio連携 AITuberシステム

このフォルダには、VTubeStudioと連携して感情読み取り・表情切り替え・音声出力(リップシンク)を行うために必要なファイルがすべて含まれています。

## 📁 含まれるファイル

### メインファイル
- `aituber_vtube_studio.html` - VTubeStudio連携版のメインHTMLファイル
- `server.py` - Pythonサーバー（ポート8000で起動）
- `.env` - 環境変数設定ファイル（APIキーなど）

### JavaScriptファイル (js/)
- `main_vtube.js` - VTubeStudio版のメイン処理
- `vtube_studio.js` - VTubeStudio API統合
- `ai.js` - AI処理（感情読み取り）
- `voice.js` - 音声合成・リップシンク処理
- `autotalk.js` - 自動会話機能
- `chat.js` - チャット処理
- `config.js` - 設定ファイル
- その他サポートファイル

### スタイルファイル (css/)
- `style.css` - UIスタイル

### ドキュメント
- `VTubeStudio連携ガイド.md` - 詳細な設定ガイド

## 🚀 使用方法

### 必要な環境
1. **VTubeStudio** (PC版)
   - Steam版またはスタンドアロン版
   - プラグインAPIを有効化
2. **Python 3.x**
3. **音声合成API** (VOICEVOX, ElevenLabs, AVisSpeechなど)

### 起動手順

1. **VTubeStudioを起動**
   - 使用したいLive2Dモデルを読み込む
   - 設定 → プラグイン → APIを有効化
   - ポート番号を確認（デフォルト: 8001）

2. **Pythonサーバーを起動**
   ```bash
   cd C:\Users\Kuwao\OneDrive\LipSync_System
   python server.py
   ```

3. **ブラウザでHTMLを開く**
   ```
   http://localhost:8000/aituber_vtube_studio.html
   ```

4. **VTubeStudioに接続**
   - 「VTubeStudioに接続」ボタンをクリック
   - VTubeStudioで接続を許可

## ⚙️ 設定

### .env ファイル
APIキーなどの環境変数を設定します：
- `ANTHROPIC_API_KEY` - Claude APIキー
- `ELEVENLABS_API_KEY` - ElevenLabs APIキー
- その他必要なAPIキー

### config.js
システムの動作設定を変更できます。

## 📝 機能

- ✅ AIとの対話（感情読み取り）
- ✅ VTubeStudioのモデルで表情を自動変更
- ✅ 音声合成とリップシンク
- ✅ 自動会話機能
- ✅ チャット機能

## 🔗 詳細情報

詳しい設定方法は `VTubeStudio連携ガイド.md` を参照してください。

---
作成日: 2026/5/28
