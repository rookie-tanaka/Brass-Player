const turntable = document.getElementById('turntable');
const seekDisplay = document.getElementById('seekDisplay');
const progressRing = document.getElementById('progressRing');

const AUTO_ROTATE_SPEED_PPS = 60; // 1秒間に60度回転する
const LONG_PRESS_MS = 500;

let isDragging = false;
let startAngle = 0;   // ドラッグ開始時のマウス角度
let currentRotation = 0; // 現在の円の回転角度
let initialRotation = 0; // ドラッグ開始時の円の角度
let autoRotateSpeed = 1; // 自動回転速度（度/フレーム）
let lastTime = performance.now() // 前回の時間を記録
let totalSeekDelta = 0; // ドラッグ中の合計秒数変化量
let dragStartTime = 0; // ドラッグ開始時の動画の秒数
let dragStartX = 0; // ドラッグ開始時のマウスX座標
let dragStartY = 0; // ドラッグ開始時のマウスY座標
let hasMoved = false; // ドラッグ中に動いたかどうかのフラグ
let initialPlayerState = -1;
let pressStartTime = 0;
let visualPercentage = 0; // 進行度の視覚的な値

// YouTube Iframe API関連のコード
let player; // YouTubeプレーヤーのオブジェクトを入れる箱
let isPlayerReady = false;

// 1. YouTube Iframe APIを非同期で読み込む呪文
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 2. APIの準備ができたら呼ばれる関数（名前は固定！）
function onYouTubeIframeAPIReady() {
    // HTMLの要素の取得
    const playerElement = document.getElementById('player');
    // data-video-id属性の中身を取り出す
    const videoId = playerElement.getAttribute('data-video-id');

    player = new YT.Player('player', {
        height: '180',
        width: '320',
        videoId: videoId, // 動画IDを指定
        events: { 'onReady': onPlayerReady }
    });
}

function onPlayerReady(event) {
    isPlayerReady = true;
    // 準備ができたらアニメーション開始
    animate();
}

function onPlayerStateChange(event) {
    // 動画の再生/停止に合わせて何かしたいならここに書くでやんす
}

function seekTo(seconds) {
    player.seekTo(seconds, true);
    player.playVideo();
}
function skipSeconds(seconds) {
    const currentTime = player.getCurrentTime();
    player.seekTo(currentTime + seconds, true);
}

// 感度設定：1度回すと何秒進むか（調整必須！）
const SEEK_SENSITIVITY = 0.05;


// 円の中心座標を取得する関数
function getCenter(element) {
    const rect = element.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

// マウス座標から角度(ラジアン)を計算する関数
function getAngle(x, y, center) {
    const deltaX = x - center.x;
    const deltaY = y - center.y;
    // Math.atan2(y, x) は -PI から PI の値を返す
    return Math.atan2(deltaY, deltaX);
}

// ドラッグ開始
function handleStart(clientX, clientY) {
    isDragging = true;

    pressStartTime = performance.now();

    // タップ判定用に開始座標を保存
    dragStartX = clientX;
    dragStartY = clientY;
    hasMoved = false; // 動いたかどうかのフラグをリセット

    const center = getCenter(turntable);

    // 現在の角度を保存
    startAngle = getAngle(clientX, clientY, center);

    // 現在の円の回転角度を保存（これがないと変な動きになる！）
    initialRotation = currentRotation;

    totalSeekDelta = 0; // 合計変化量をリセット
    seekDisplay.innerText = "0.0s"; // 表示をリセット
    turntable.classList.add('dragging'); // CSSで表示させるクラスを付与
    turntable.style.cursor = 'grabbing';

    // ★重要！ドラッグ開始時点の動画時間を「基準」としてロックするでやんす
    if (isPlayerReady) {
        initialPlayerState = player.getPlayerState();
        dragStartTime = player.getCurrentTime();

        if (initialPlayerState === 1) {
            player.pauseVideo();
        }

    }
}

// 回転中
function handleMove(clientX, clientY) {
    if (!isDragging) return;

    if(!hasMoved) {
        const moveX = Math.abs(clientX - dragStartX);
        const moveY = Math.abs(clientY - dragStartY);
        // 5ピクセル以上動いたら「動いた」と判定
        if(moveX > 5 || moveY > 5) {
            hasMoved = true;

            if(isPlayerReady) {
                player.pauseVideo();
            }
        } else {
            return; // まだ動いていないので処理を中断
        }
    }

    const center = getCenter(turntable);
    const mouseAngle = getAngle(clientX, clientY, center);

    // 回転量の計算（現在の角度 - 開始時の角度）
    let angleDifference = mouseAngle - startAngle;

    // 境界値またぎ（-PIからPIへの急激な変化）の補正が必要でやんす！
    // これをやらないと、真横（9時方向）を跨いだ瞬間に動画が吹っ飛ぶでやんすよ！
    if (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;
    if (angleDifference < -Math.PI) angleDifference += 2 * Math.PI;

    // 角度を度数法に変換して表示更新
    let rotationDiffDeg = angleDifference * (180 / Math.PI);
    let newRotation = initialRotation + rotationDiffDeg;

    turntable.style.transform = `rotate(${newRotation}deg)`;
    currentRotation = newRotation;

    // シーク時間の計算
    let frameSeekSeconds = rotationDiffDeg * SEEK_SENSITIVITY;

    // 合計変化量の更新
    totalSeekDelta += frameSeekSeconds;

    // ★ここがYouTube連携の肝でやんす！
    if (isPlayerReady) {
        // 「固定した基準時間 + 手の動きの合計」でターゲットを決める
        let targetTime = dragStartTime + totalSeekDelta;

        // 動画の範囲外に行かないようにガードする優しさが必要でやんす
        let duration = player.getDuration();
        if (targetTime < 0) targetTime = 0;
        if (targetTime > duration) targetTime = duration;

        // seekTo(秒数, allowSeekAhead)
        // allowSeekAhead: trueにするとバッファリング中でもシークしようとする
        player.seekTo(targetTime, true);

        // ★合計変化量に足し込む
        totalSeekDelta += frameSeekSeconds;

        // ★画面に表示（プラス記号をつけると親切でやんす）
        // toFixed(1) で小数点第1位までにするのが見やすさのコツ
        let sign = totalSeekDelta > 0 ? "+" : "";
        seekDisplay.innerText = `${sign}${totalSeekDelta.toFixed(1)}s`;

        // 色を変える演出もアリ（戻る時は赤、進む時は青とか）
        seekDisplay.style.color = totalSeekDelta < 0 ? '#ff4757' :'#2ed573';
    }

    // 次の計算のために現在の角度と回転量を更新
    // ※ここを更新しないと「差分」ではなく「絶対位置」になってしまうので注意！
    startAngle = mouseAngle;
    initialRotation = newRotation;
}

// ドラッグ終了
function handleEnd() {
    if (!isDragging) return;

    isDragging = false;
    turntable.style.cursor = 'grab';
    turntable.classList.remove('dragging');

    const pressDuration = performance.now() - pressStartTime;

    const isLongPress = pressDuration > LONG_PRESS_MS;

    // 手を離したら再生再開
    if (isPlayerReady) {
        if(hasMoved || isLongPress) {
            player.playVideo();
        } else {
            if(initialPlayerState === 1) {

                turntable.style.transform = `rotate(${state.angle}deg)`;
                setTimeout(() => {
                    turntable.style.transform = `rotate(${state.angle}deg)`;
                }, 100);
            } else {
                player.playVideo();
            }
        }

    }
}

// 自動回転のアニメーションループ
function animate(currentTime) {
// 初回呼び出し時は currentTime が undefined の場合があるので補正
    if (!currentTime) currentTime = performance.now();

    // 前回のフレームからの経過時間（ミリ秒）を計算
    const deltaTime = currentTime - lastTime;

    // 次回のために「現在」を「前回」として保存
    lastTime = currentTime;

    // ドラッグしていない、かつ動画が再生中の時だけ自動回転
    if (!isDragging && isPlayerReady && player.getPlayerState() === 1) {

        // ★ここが修正のキモでやんす！★
        // (経過ミリ秒 / 1000) で「経過秒数」にし、それに「1秒あたりの速度」を掛ける
        // これでどんなHzのモニタでも同じ速度になるでやんす！
        const rotationAmount = AUTO_ROTATE_SPEED_PPS * (deltaTime / 1000);

        currentRotation += rotationAmount;
        turntable.style.transform = `rotate(${currentRotation}deg)`;

        initialRotation = currentRotation;
    }

    if (isPlayerReady) {
        // 現在の進行度（%）を計算
        const duration = player.getDuration();
        const current = player.getCurrentTime();
        const state = player.getPlayerState();

        let targetPercentage = 0;
        if (state === 0) {
            targetPercentage = 100;
        } else if (duration > 0) {
            targetPercentage = (current / duration) * 100;

            if (targetPercentage > 100) targetPercentage = 100;
        }

        visualPercentage += (targetPercentage - visualPercentage) * 0.1;

        if (Math.abs(targetPercentage - visualPercentage) < 0.01) {
            visualPercentage = targetPercentage;
        }


        // CSS変数を更新して、グラデーションを動かす
        // progressRingがnullじゃないか確認してから実行する優しさが必要でやんす
        if (progressRing) {
            progressRing.style.setProperty('--progress', `${visualPercentage.toFixed(2)}%`);
        }
    }

    requestAnimationFrame(animate);
}
//ループ
animate();

// --- イベントリスナー登録（ここがスマホ対応のキモ！） ---

// マウス用
turntable.addEventListener('mousedown', (e) => {
    handleStart(e.clientX, e.clientY);
});
window.addEventListener('mousemove', (e) => {
    handleMove(e.clientX, e.clientY);
});
window.addEventListener('mouseup', handleEnd);


// スマホ（タッチ）用
turntable.addEventListener('touchstart', (e) => {
    // スクロール防止（これをしないと画面ごと動いちゃうでやんす！）
    e.preventDefault();
    // タッチは複数指の可能性があるから、1本目(touches[0])を使う
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false }); // preventDefaultを使うための呪文

window.addEventListener('touchmove', (e) => {
    // ここでもpreventDefaultしないと、スクラッチ中に画面がスクロールしちゃうでやんす
    e.preventDefault();
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

window.addEventListener('touchend', handleEnd);