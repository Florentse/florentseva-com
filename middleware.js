// middleware.js

export function middleware(req) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // 1. Пропускаем статические файлы (с точкой в названии)
  if (pathname.includes('.')) return;

  // 2. Если в URL есть /en — убираем его (редирект на корень)
  if (pathname.startsWith('/en')) {
    url.pathname = pathname.replace(/^\/en/, '') || '/';
    return Response.redirect(url);
  }

  // 3. Авто-редирект на /ru только для главной страницы
  if (pathname === '/') {
    const cookie = req.headers.get('cookie') || '';
    
    // Проверяем наличие куки выбора языка
    if (!cookie.includes('app_lang=')) {
      const acceptLang = req.headers.get('accept-language') || '';
      if (acceptLang.toLowerCase().startsWith('ru')) {
        url.pathname = '/ru';
        return Response.redirect(url);
      }
    }
  }

  // Если условий выше нет, просто продолжаем выполнение
  return;
}