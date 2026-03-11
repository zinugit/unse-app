// sw.js (최소 기능 서비스 워커)
const CACHE_NAME = 'unse-v1';
self.addEventListener('install', (e) => {
    console.log('UNSE 서비스 워커 설치됨');
});
self.addEventListener('fetch', (e) => {
    // 앱 실행을 위해 최소한의 응답 로직 유지
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
