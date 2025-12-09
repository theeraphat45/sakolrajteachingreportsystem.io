const CACHE_NAME = 'teaching-record-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/dashboard_admin.html',
  '/dashboard_teacher.html',
  '/dashboard_student.html',
  '/profile.html',
  '/subjects.html',
  '/report.html',
  '/history.html',
  '/users.html',
  '/reset-password.html',
  '/retrospective.html',
  '/js/app.js',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/api.js',
  '/assets/logo.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});