export default async function middleware(request) {
  const url = new URL(request.url);

  if (url.hostname === 'colonycounter.joelutai.com') {
    url.pathname = '/colonycounter.html';
    return fetch(new Request(url, request));
  }

  if (url.hostname === 'benchvoice.joelutai.com') {
    url.pathname = '/benchvoice.html';
    return fetch(new Request(url, request));
  }
}

export const config = {
  matcher: '/',
};
