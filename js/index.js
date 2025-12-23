if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service_worker.js')
            .then(registration => {
                console.log('SW登録成功:', registration.scope);
            })
            .catch(error => {
                console.log('SW登録失敗:', error);
            });
    });
}
