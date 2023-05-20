export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const _url = new URL('https://www.notion.so' + url.pathname + url.search);

    const response = await fetch(_url, request);

    if (_url.pathname === '/api/v3/getPublicPageData') {
      const json = await response.json<{ [key: string]: any }>();
      delete json.requireInterstitial;
      return new Response(JSON.stringify(json), response);
    }

    const _body = new HTMLRewriter().on('body', new ElementHandler(url.hostname)).transform(response).body;
    return new Response(_body, {
      ...response,
      status: response.status === 404 && response.headers.get('content-type')?.includes('text/html') ? 200 : response.status,
    });
  },
};

class ElementHandler {
  publicDomainName: string;

  constructor(publicDomainName: string) {
    this.publicDomainName = publicDomainName;
  }

  element(element: Element) {
    element.append(`<script>window.CONFIG.publicDomainName = '${this.publicDomainName}';</script>`, {
      html: true,
    });
  }
}
