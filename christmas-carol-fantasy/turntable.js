const turntable = document.getElementById('turntable');

let isDragging = false;
let startAngle = 0;   // ドラッグ開始時のマウス角度
let currentRotation = 0; // 現在の円の回転角度
let initialRotation = 0; // ドラッグ開始時の円の角度
let autoRotateSpeed = 1; // 自動回転速度（度/フレーム）
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
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: 'tI-5uv4wryI', // ここに好きな動画IDを入れるでやんす
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
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

// マウスダウン（ドラッグ開始）
turntable.addEventListener('mousedown', (e) => {
    isDragging = true;
    player.pauseVideo();
    const center = getCenter(turntable);

    // 現在のマウスの角度を保存
    startAngle = getAngle(e.clientX, e.clientY, center);

    // 現在の円の回転角度を保存（これがないと変な動きになる！）
    initialRotation = currentRotation;

    turntable.style.cursor = 'grabbing';

});

// マウスムーブ（回転中）
window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const center = getCenter(turntable);
    const mouseAngle = getAngle(e.clientX, e.clientY, center);

    // 回転量の計算（現在のマウス角度 - 開始時のマウス角度）
    let angleDifference = mouseAngle - startAngle;

    /*
    // 新しい回転角度 = 開始時の円の角度 + 差分
    // ラジアンを度数法(deg)に変換するのを忘れないように！ (rad * 180 / Math.PI)
    let newRotation = initialRotation + (angleDifference * (180 / Math.PI));

    currentRotation = newRotation;
    turntable.style.transform = `rotate(${currentRotation}deg)`;
    */

    // 境界値またぎ（-PIからPIへの急激な変化）の補正が必要でやんす！
    // これをやらないと、真横（9時方向）を跨いだ瞬間に動画が吹っ飛ぶでやんすよ！
    if (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;
    if (angleDifference < -Math.PI) angleDifference += 2 * Math.PI;

    // 角度を度数法に変換して表示更新
    let rotationDiffDeg = angleDifference * (180 / Math.PI);
    let newRotation = initialRotation + rotationDiffDeg;

    turntable.style.transform = `rotate(${newRotation}deg)`;
    currentRotation = newRotation;

    // ★ここがYouTube連携の肝でやんす！
    if (isPlayerReady) {
        // 現在の動画時間 + (回転した角度 * 感度)
        // 時計回り(プラス)なら進む、反時計回り(マイナス)なら戻る
        let seekTime = player.getCurrentTime() + (rotationDiffDeg * SEEK_SENSITIVITY);

        // seekTo(秒数, allowSeekAhead)
        // allowSeekAhead: trueにするとバッファリング中でもシークしようとする
        player.seekTo(seekTime, true);
    }

    // 次の計算のために現在の角度と回転量を更新
    // ※ここを更新しないと「差分」ではなく「絶対位置」になってしまうので注意！
    startAngle = mouseAngle;
    initialRotation = newRotation;
});

// マウスアップ（ドラッグ終了）
window.addEventListener('mouseup', () => {
    isDragging = false;
    player.playVideo();
    turntable.style.cursor = 'grab';
});

// 自動回転のアニメーションループ
function animate() {
    // ドラッグしていない、かつ動画が再生中の時だけ自動回転させる
    // YT.PlayerStat e.PLAYING は 1 でやんす
    if (!isDragging && isPlayerReady && player.getPlayerState() === 1) {
        // 動画の進行に合わせて回す演出
        // ここでは単純に一定速度で回すでやんすが、本当は動画の長さに同期させるとプロっぽい
        currentRotation += 1;
        turntable.style.transform = `rotate(${currentRotation}deg)`;

        // initialRotationも同期しておかないと、次に触った時にガクッとなる
        initialRotation = currentRotation;
    }

    requestAnimationFrame(animate);
}
//ループ
animate();