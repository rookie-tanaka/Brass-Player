const turntable = document.getElementById('turntable');

let isDragging = false;
let startAngle = 0;   // ドラッグ開始時のマウス角度
let currentRotation = 0; // 現在の円の回転角度
let initialRotation = 0; // ドラッグ開始時の円の角度
let autoRotateSpeed = 1; // 自動回転速度（度/フレーム）

// 自動回転のアニメーションループ
function animate() {
    if (!isDragging) {
        currentRotation += autoRotateSpeed;

        // 360度
        if (currentRotation >= 360) {
            currentRotation -= 360;
        }

        turntable.style.transform = `rotate(${currentRotation}deg)`;
    }

    requestAnimationFrame(animate);
}
//ループ
animate();

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
    const angleDifference = mouseAngle - startAngle;

    // 新しい回転角度 = 開始時の円の角度 + 差分
    // ラジアンを度数法(deg)に変換するのを忘れないように！ (rad * 180 / Math.PI)
    let newRotation = initialRotation + (angleDifference * (180 / Math.PI));

    currentRotation = newRotation;
    turntable.style.transform = `rotate(${currentRotation}deg)`;
});

// マウスアップ（ドラッグ終了）
window.addEventListener('mouseup', () => {
    isDragging = false;
    turntable.style.cursor = 'grab';
});