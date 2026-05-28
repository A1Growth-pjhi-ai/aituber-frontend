// js/live2d.js
// Live2D Manager for AITuber

export class Live2DManager {
    constructor(canvasId, modelPath) {
        this.canvasId = canvasId;
        this.modelPath = modelPath;
        this.app = null;
        this.model = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('Live2D 初期化開始...');
            console.log('モデルパス:', this.modelPath);

            // Pixi.js アプリケーションを作成
            this.app = new PIXI.Application({
                view: document.getElementById(this.canvasId),
                width: 1920,
                height: 1080,
                transparent: true,
                autoStart: true,
                backgroundAlpha: 0
            });

            console.log('Pixi.js アプリケーション作成完了');

            // Live2D モデルを読み込む
            this.model = await PIXI.live2d.Live2DModel.from(this.modelPath);
            console.log('Live2D モデル読み込み完了');

            // モデルをステージに追加
            this.app.stage.addChild(this.model);

            // モデルのサイズと位置を調整
            const scale = 0.4; // スケールを調整
            this.model.scale.set(scale);
            
            // 画面中央に配置
            this.model.x = this.app.screen.width / 2;
            this.model.y = this.app.screen.height - 100; // 下部に配置
            
            // アンカーポイントを設定（中央下）
            this.model.anchor.set(0.5, 1.0);

            this.isInitialized = true;
            console.log('Live2D 初期化完了');
            console.log('モデル位置:', this.model.x, this.model.y);
            console.log('モデルスケール:', this.model.scale.x);

            return true;
        } catch (error) {
            console.error('Live2D 初期化エラー:', error);
            console.error('エラー詳細:', error.stack);
            return false;
        }
    }

    // リップシンク: 口の開閉
    setMouthOpen(value) {
        if (!this.model || !this.isInitialized) return;

        try {
            // Live2D のパラメータを設定
            // パラメータ名はモデルによって異なる場合があります
            const coreModel = this.model.internalModel.coreModel;
            
            // 口の開閉パラメータ（nizima公式モデル用のパラメータを追加）
            const mouthParams = [
                'ParamMouthOpenY',
                'PARAM_MOUTH_OPEN_Y',
                'MouthOpenY',
                'Param_Mouth_Open_Y',  // nizima公式モデル用
                'ParamMouthForm',       // 一部のモデル用
                'PARAM_MOUTH_FORM'      // 一部のモデル用
            ];
            
            let success = false;
            for (const paramName of mouthParams) {
                try {
                    coreModel.setParameterValueById(paramName, value);
                    success = true;
                    break; // 成功したらループを抜ける
                } catch (e) {
                    // パラメータが存在しない場合は次を試す
                    continue;
                }
            }
            
            // デバッグ用: 一度だけパラメータ名をログ出力
            if (!this._mouthParamLogged) {
                if (success) {
                    console.log('✅ リップシンク用パラメータが見つかりました');
                } else {
                    console.warn('⚠️ リップシンク用パラメータが見つかりません。利用可能なパラメータ:');
                    // 利用可能なパラメータをリスト表示
                    const paramCount = coreModel.getParameterCount();
                    for (let i = 0; i < paramCount; i++) {
                        const paramId = coreModel.getParameterId(i);
                        if (paramId.toLowerCase().includes('mouth')) {
                            console.log(`  - ${paramId}`);
                        }
                    }
                }
                this._mouthParamLogged = true;
            }
        } catch (error) {
            // エラーは無視（パラメータが存在しない場合）
        }
    }

    // 表情変更
    setExpression(expressionName) {
        if (!this.model || !this.isInitialized) return;

        try {
            console.log('表情変更:', expressionName);
            // 表情を設定
            this.model.expression(expressionName);
        } catch (error) {
            console.log('表情変更エラー（表情が存在しない可能性）:', error.message);
        }
    }

    // 目の開閉
    setEyeOpen(value) {
        if (!this.model || !this.isInitialized) return;

        try {
            const coreModel = this.model.internalModel.coreModel;
            
            // 左目
            const leftEyeParams = ['ParamEyeLOpen', 'PARAM_EYE_L_OPEN', 'EyeLOpen'];
            for (const paramName of leftEyeParams) {
                try {
                    coreModel.setParameterValueById(paramName, value);
                    break;
                } catch (e) {
                    continue;
                }
            }
            
            // 右目
            const rightEyeParams = ['ParamEyeROpen', 'PARAM_EYE_R_OPEN', 'EyeROpen'];
            for (const paramName of rightEyeParams) {
                try {
                    coreModel.setParameterValueById(paramName, value);
                    break;
                } catch (e) {
                    continue;
                }
            }
        } catch (error) {
            // エラーは無視
        }
    }

    // モーション再生
    playMotion(motionGroup, motionIndex = 0) {
        if (!this.model || !this.isInitialized) return;

        try {
            console.log('モーション再生:', motionGroup, motionIndex);
            this.model.motion(motionGroup, motionIndex);
        } catch (error) {
            console.log('モーション再生エラー:', error.message);
        }
    }

    // マウス追従（オプション）
    enableMouseTracking() {
        if (!this.app) return;

        console.log('マウス追従を有効化');
        
        this.app.stage.interactive = true;
        this.app.stage.on('pointermove', (event) => {
            if (!this.model || !this.isInitialized) return;

            const point = event.data.global;
            
            // マウス位置を -1 〜 1 の範囲に正規化
            const x = (point.x / this.app.screen.width) * 2 - 1;
            const y = (point.y / this.app.screen.height) * 2 - 1;

            // 視線をマウスに向ける
            try {
                const coreModel = this.model.internalModel.coreModel;
                
                // 角度パラメータ
                const angleXParams = ['ParamAngleX', 'PARAM_ANGLE_X', 'AngleX'];
                const angleYParams = ['ParamAngleY', 'PARAM_ANGLE_Y', 'AngleY'];
                const bodyAngleXParams = ['ParamBodyAngleX', 'PARAM_BODY_ANGLE_X', 'BodyAngleX'];
                
                for (const paramName of angleXParams) {
                    try {
                        coreModel.setParameterValueById(paramName, x * 30);
                        break;
                    } catch (e) {
                        continue;
                    }
                }
                
                for (const paramName of angleYParams) {
                    try {
                        coreModel.setParameterValueById(paramName, y * 30);
                        break;
                    } catch (e) {
                        continue;
                    }
                }
                
                for (const paramName of bodyAngleXParams) {
                    try {
                        coreModel.setParameterValueById(paramName, x * 10);
                        break;
                    } catch (e) {
                        continue;
                    }
                }
            } catch (error) {
                // パラメータが存在しない場合は無視
            }
        });
    }

    // 自動まばたき（オプション）
    enableAutoBlinking() {
        if (!this.model || !this.isInitialized) return;

        console.log('自動まばたきを有効化');
        
        setInterval(() => {
            if (!this.isInitialized) return;
            
            // まばたきアニメーション
            this.setEyeOpen(0); // 目を閉じる
            setTimeout(() => {
                this.setEyeOpen(1); // 目を開ける
            }, 100);
        }, 3000 + Math.random() * 2000); // 3〜5秒ごと
    }

    // クリーンアップ
    destroy() {
        if (this.app) {
            this.app.destroy(true);
            this.app = null;
        }
        this.model = null;
        this.isInitialized = false;
        console.log('Live2D クリーンアップ完了');
    }
}
