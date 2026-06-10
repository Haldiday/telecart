const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const privateHostPatterns = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
  /^\[?::1\]?$/i,
];

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300',
  },
  body: JSON.stringify(body),
});

const isSafePublicUrl = (value) => {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    return !privateHostPatterns.some((pattern) => pattern.test(url.hostname));
  } catch {
    return false;
  }
};

const parseFrameAncestors = (csp) => {
  if (!csp) return null;
  const directive = csp
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith('frame-ancestors'));

  if (!directive) return null;
  return directive.split(/\s+/).slice(1);
};

const sourceAllowsOrigin = (source, appOrigin, targetOrigin) => {
  const value = source.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  if (!value) return false;
  if (value === '*') return true;
  if (value === 'none') return false;
  if (value === 'self') return appOrigin === targetOrigin;
  if (value === 'https:') return appOrigin.startsWith('https:');
  if (value === 'http:') return appOrigin.startsWith('http:');

  try {
    if (value.startsWith('*.')) {
      const appHost = new URL(appOrigin).hostname;
      return appHost === value.slice(2) || appHost.endsWith(value.slice(1));
    }

    const sourceUrl = new URL(value.includes('://') ? value : `https://${value}`);
    const appUrl = new URL(appOrigin);
    return sourceUrl.protocol === appUrl.protocol && sourceUrl.hostname === appUrl.hostname;
  } catch {
    return false;
  }
};

const getBlockedReason = (headers, appOrigin, finalUrl) => {
  const targetOrigin = new URL(finalUrl).origin;
  const xFrameOptions = headers.get('x-frame-options');
  if (xFrameOptions) {
    const normalized = xFrameOptions.toLowerCase();
    if (normalized.includes('deny')) return 'Blocked by X-Frame-Options: DENY.';
    if (normalized.includes('sameorigin') && appOrigin !== targetOrigin) {
      return 'Blocked by X-Frame-Options: SAMEORIGIN.';
    }
  }

  const frameAncestors = parseFrameAncestors(headers.get('content-security-policy'));
  if (frameAncestors) {
    if (frameAncestors.some((source) => source.replace(/^'|'$/g, '') === 'none')) {
      return 'Blocked by Content-Security-Policy frame-ancestors.';
    }

    const allowed = frameAncestors.some((source) => sourceAllowsOrigin(source, appOrigin, targetOrigin));
    if (!allowed) return 'Blocked by Content-Security-Policy frame-ancestors.';
  }

  return null;
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  const targetUrl = event.queryStringParameters && event.queryStringParameters.url;
  if (!targetUrl || !isSafePublicUrl(targetUrl)) {
    return json(400, {
      status: 'blocked',
      reason: 'Invalid or unsupported external URL.',
      embedUrl: targetUrl || '',
    });
  }

  const appOrigin =
    event.headers.origin ||
    (event.headers.referer ? new URL(event.headers.referer).origin : '') ||
    `https://${event.headers.host}`;

  try {
    let response = await fetch(targetUrl, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Telecart Embed Checker',
        Accept: 'text/html,application/pdf,*/*',
      },
    });

    if (response.status === 405 || response.status === 403) {
      response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Telecart Embed Checker',
          Accept: 'text/html,application/pdf,*/*',
          Range: 'bytes=0-1024',
        },
      });
    }

    const finalUrl = response.url || targetUrl;
    const reason = getBlockedReason(response.headers, appOrigin, finalUrl);

    if (reason) {
      return json(200, {
        status: 'blocked',
        reason,
        embedUrl: targetUrl,
        finalUrl,
      });
    }

    return json(200, {
      status: 'allowed',
      embedUrl: finalUrl,
      finalUrl,
    });
  } catch (error) {
    return json(200, {
      status: 'unknown',
      reason: 'Could not verify embed headers before loading.',
      embedUrl: targetUrl,
    });
  }
};

