// キャッシュ名をバージョン管理する
const CACHE_NAME = 'bp-caches-v1';

// キャッシュするファイルのリスト
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './js/index.js',
    './manifest.json',
    './img/favicon.ico',
    './img/logo-icon.webp',
    './img/logo-text-black.svg',
    './img/bg.png',
    // 他のページやアセットも必要に応じて追加
    './christmas-carol-fantasy/index.html',
    './christmas-carol-fantasy/turntable.html',
    './christmas-carol-fantasy/turntable.css',
    './christmas-carol-fantasy/turntable.js',
    './img/turntable-bg.webp',
    './img/turntable-logo.webp'
];

// Service Worker のインストール処理
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache opened');
                // 指定されたファイルをすべてキャッシュに追加する
                return cache.addAll(urlsToCache);
            })
    );
});

// Service Worker の有効化処理
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // ホワイトリストに含まれていないキャッシュは削除する
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// リソースフェッチ時の処理 (キャッシュファースト戦略)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // キャッシュにヒットすれば、それを返す
                if (response) {
                    return response;
                }
                // キャッシュになければ、ネットワークからフェッチして返す
                return fetch(event.request);
            })
    );
});
