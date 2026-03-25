export default async function middleware(request) {
  const url = new URL(request.url);

  if (url.hostname === 'colonycounter.joelutai.com') {
    if (url.pathname === '/app' || url.pathname === '/app/') {
      url.pathname = '/colony-counter/index.html';
      return fetch(new Request(url, request));
    }
    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = '/colonycounter.html';
      return fetch(new Request(url, request));
    }
  }

  if (url.hostname === 'benchvoice.joelutai.com') {
    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = '/benchvoice.html';
      return fetch(new Request(url, request));
    }
  }
}

export const config = {
  matcher: ['/', '/app'],
};
