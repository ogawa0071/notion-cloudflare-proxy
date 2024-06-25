export interface Env {
  NOTION_DOMAIN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const _url = new URL(url);
    _url.hostname = env.NOTION_DOMAIN;

    if (request.method === 'POST' && url.pathname === '/api/v3/getPublicPageData') {
      const requestBody = await request.json<Record<string, any>>();
      requestBody.requestedOnExternalDomain = false;
      requestBody.spaceDomain = env.NOTION_DOMAIN.replace('.notion.site', '');

      const _request = new Request(request, {
        body: JSON.stringify(requestBody),
      });

      const response = await fetch(_url, _request);
      const responseBody = await response.json<Record<string, any>>();
      responseBody.publicDomainName = url.hostname;

      return new Response(JSON.stringify(responseBody), response);
    }

    if (request.method === 'POST' && url.pathname === '/api/v3/syncRecordValues') {
      const response = await fetch(_url, request);
      const responseBody = await response.json<{ recordMap: { site: Record<string, any>; public_domain: Record<string, any> } }>();

      try {
        responseBody.recordMap.site = Object.fromEntries(
          Object.entries(responseBody.recordMap.site).map(([key, value]) => {
            value.value.value.header.hideWatermark = true;
            return [key, value];
          })
        );
      } catch {}

      try {
        responseBody.recordMap.public_domain = Object.fromEntries(
          Object.entries(responseBody.recordMap.public_domain).map(([key, value]) => {
            if (value.value.value.domain_name === env.NOTION_DOMAIN.replace('.notion.site', '')) {
              value.value.value.domain_name = url.hostname;
              value.value.value.domain_type = 'custom';
            }
            return [key, value];
          })
        );
      } catch {}

      return new Response(JSON.stringify(responseBody), response);
    }

    const response = await fetch(_url, request);
    return response;
  },
};
