# VTube Studio 連携ガイド

## 概要

AITuber Live SystemをVTube Studioと連携させて、VTube Studioのモデルを使用する方法を説明します。

---

## 🎯 できること

- ✅ VTube Studioのモデルを使用してAITuberを動かす
- ✅ AIの感情に応じて表情を自動変更
- ✅ 音声に合わせたリップシンク
- ✅ チャット機能とスーパーチャット機能
- ✅ OBSで配信可能

---

## 📋 必要なもの

1. **VTube Studio**（PC版）
   - Steam版またはスタンドアロン版
   - 無料版でも使用可能

2. **Live2Dモデル**
   - VTube Studio対応のLive2Dモデル
   - nizima LIVEモデルは**VTube Studio用に変換が必要**

3. **AITuber Live System**
   - このシステム一式

---

## 🚀 セットアップ手順

### ステップ1: VTube Studioの設定

#### 1-1. VTube Studioを起動
1. VTube Studioを起動
2. 使用したいモデルを読み込む

#### 1-2. プラグインAPIを有効化
1. VTube Studioの設定を開く（歯車アイコン）
2. **「プラグイン」** タブを選択
3. **「プラグインAPIを有効にする」** をONにする
4. ポート番号を確認（デフォルト: **8001**）

![VTube Studio設定](https://i.imgur.com/example.png)

---

### ステップ2: AITuberシステムの起動

#### 2-1. サーバーを起動
```bash
cd stitch_aituber_cyber_student_overlay
python server.py
```

#### 2-2. VTube Studio版のHTMLを開く
ブラウザで以下のURLを開く：
```
http://localhost:8000/stitch_aituber_cyber_student_overlay/aituber_vtube_studio.html
```

---

### ステップ3: VTube Studioに接続

#### 3-1. 接続設定
1. ブラウザに表示された画面で、接続設定を確認
   - デフォルト: `ws://localhost:8001`
   - ポート番号が異なる場合は変更

#### 3-2. 接続ボタンをクリック
1. **「VTube Studioに接続」** ボタンをクリック
2. VTube Studioに接続許可のダイアログが表示される
3. **「許可」** をクリック

#### 3-3. 接続成功
- 接続状態が **「接続済み」** になる
- モデル名とパラメータ数が表示される

---

## 🎭 使い方

### チャット機能
1. ユーザー名を入力（省略可）
2. メッセージを入力して送信
3. AIが応答し、VTube Studioのモデルが動く

### スーパーチャット
1. **「スパチャ」** ボタンをクリック
2. 金額を選択
3. メッセージを入力して送信
4. AIが感謝のメッセージを返す

### 表情変更
AIの感情に応じて自動的に表情が変わります：
- **DEFAULT** → neutral（通常）
- **HAPPY** → happy（嬉しい）
- **SAD** → sad（悲しい）
- **ANGRY** → angry（怒り）

---

## 🎨 OBSでの配信設定

### パターン1: VTube Studioとチャット画面を別々に表示

#### OBSソース設定
1. **VTube Studioのウィンドウキャプチャ**
   - ソース → 追加 → ウィンドウキャプチャ
   - VTube Studioのウィンドウを選択
   - 背景を透過（クロマキー不要）

2. **AITuberチャット画面**
   - ソース → 追加 → ブラウザ
   - URL: `http://localhost:8000/stitch_aituber_cyber_student_overlay/aituber_vtube_studio.html`
   - 幅: 1920、高さ: 1080
   - カスタムCSS（背景を透明化）:
     ```css
     body { background: transparent !important; }
     .fixed.inset-0.z-0 { display: none !important; }
     ```

#### レイアウト例
```
┌─────────────────────────────┐
│ チャット │   VTube Studio   │
│         │                  │
│         │                  │
└─────────────────────────────┘
```

---

### パターン2: VTube Studio全画面 + チャットオーバーレイ

#### OBSソース設定
1. VTube Studioを全画面表示
2. チャット画面を上に重ねる
3. チャット画面の位置とサイズを調整

```
┌─────────────────────────────┐
│ ┌────┐                      │
│ │Chat│  VTube Studio        │
│ └────┘                      │
└─────────────────────────────┘
```

---

## 🔧 トラブルシューティング

### 接続できない

#### 原因1: VTube Studioが起動していない
- **解決**: VTube Studioを起動してください

#### 原因2: プラグインAPIが無効
- **解決**: VTube Studio設定 → プラグイン → APIを有効化

#### 原因3: ポート番号が違う
- **解決**: VTube Studioの設定でポート番号を確認し、ブラウザ側も同じ番号に変更

#### 原因4: ファイアウォールでブロックされている
- **解決**: Windowsファイアウォールの設定を確認

---

### 表情が変わらない

#### 原因1: モデルに表情データがない
- **解決**: VTube Studioで表情ホットキーを設定してください

#### 原因2: 表情名が一致しない
- **解決**: VTube Studioのホットキー名に以下を含めてください：
  - `neutral` または `default`
  - `happy`
  - `sad`
  - `angry`

---

### リップシンクが動かない

#### 原因1: MouthOpenパラメータがない
- **解決**: モデルに `MouthOpen` パラメータがあるか確認

#### 原因2: パラメータ名が違う
- **解決**: `vtube_studio.js` の `setMouthOpen` 関数でパラメータ名を変更
  ```javascript
  async setMouthOpen(value) {
      await this.setParameterValue('ParamMouthOpenY', value); // パラメータ名を変更
  }
  ```

---

### 音声が出ない

#### 原因: 音声出力デバイスが正しくない
- **解決**: 画面下部の「出力」ドロップダウンで正しいデバイスを選択

---

## 📝 カスタマイズ

### 表情マッピングの変更

`js/vtube_studio.js` の `setEmotionExpression` 関数を編集：

```javascript
async setEmotionExpression(emotion) {
    const emotionMap = {
        'DEFAULT': 'neutral',
        'HAPPY': 'smile',      // 変更例
        'SAD': 'cry',          // 変更例
        'ANGRY': 'angry',
        'SURPRISED': 'shock'   // 追加例
    };

    const expressionName = emotionMap[emotion] || 'neutral';
    await this.setExpression(expressionName);
}
```

---

### リップシンクの調整

`js/vtube_studio.js` の `performLipSync` 関数を編集：

```javascript
const openValues = {
    'a': 1.0,   // 「あ」の開き具合
    'i': 0.4,   // 「い」の開き具合
    'u': 0.6,   // 「う」の開き具合
    'e': 0.7,   // 「え」の開き具合
    'o': 0.8,   // 「お」の開き具合
    'N': 0.2,   // 「ん」の開き具合
    'pau': 0.0, // 無音
    'cl': 0.0   // 子音
};
```

---

## 🆚 nizima LIVE版との違い

| 項目 | VTube Studio版 | nizima LIVE版 |
|------|---------------|---------------|
| モデル | VTube Studio対応モデル | nizima LIVE専用モデル |
| 接続方法 | WebSocket API | Live2D SDK |
| 表情変更 | ホットキー経由 | 直接パラメータ操作 |
| リップシンク | MouthOpenパラメータ | ParamMouthOpenY |
| 設定の簡単さ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| カスタマイズ性 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 📚 参考リンク

- [VTube Studio 公式サイト](https://denchisoft.com/)
- [VTube Studio API ドキュメント](https://github.com/DenchiSoft/VTubeStudio)
- [Live2D 公式サイト](https://www.live2d.com/)

---

## 💡 おすすめの使い方

### 初心者向け
1. VTube Studioで無料モデルを使用
2. デフォルト設定で接続
3. OBSで配信開始

### 上級者向け
1. カスタムモデルを作成
2. 表情とリップシンクを細かく調整
3. 複数のホットキーを設定して多彩な表情を実現

---

## ❓ よくある質問

### Q: nizima LIVEのモデルは使えますか？
**A**: 直接は使えません。VTube Studio用に変換するか、nizima LIVE版のHTMLを使用してください。

### Q: 無料で使えますか？
**A**: はい、VTube Studioの無料版でも使用できます。

### Q: スマホ版のVTube Studioでも使えますか？
**A**: いいえ、PC版のみ対応しています。

### Q: 複数のモデルを切り替えられますか？
**A**: VTube Studio側でモデルを切り替えれば、自動的に新しいモデルに接続されます。

---

**VTube Studioとの連携で、より簡単にAITuberを始められます！** 🎉
