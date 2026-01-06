// middleware.js
import { NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // 1. Пропускаем статические файлы
  if (PUBLIC_FILE.test(pathname)) return;

  // 2. Если в URL есть /en — убираем его (делаем редирект на чистый адрес)
  if (pathname.startsWith('/en')) {
    const cleanPath = pathname.replace(/^\/en/, '') || '/';
    return NextResponse.redirect(new URL(cleanPath, req.url));
  }

  // 3. Авто-редирект на /ru только для главной страницы и только если нет куки выбора
  if (pathname === '/') {
    const cookieLang = req.cookies.get('app_lang')?.value;
    
    if (!cookieLang) {
      const acceptLang = req.headers.get('accept-language') || '';
      if (acceptLang.startsWith('ru')) {
        return NextResponse.redirect(new URL('/ru', req.url));
      }
    }
  }

  return NextResponse.next();
}