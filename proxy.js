import { NextResponse } from 'next/server';

export default function proxy(request) {
  const pathname = request.nextUrl.pathname;
  if (pathname.includes('/ProjectProducts')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace('/ProjectProducts', '/projectproducts');
    return NextResponse.redirect(url, 307);
  }
  if (pathname.includes('/ProjectStores')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace('/ProjectStores', '/projectstores');
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/projectplanogram/:path*'],
};
