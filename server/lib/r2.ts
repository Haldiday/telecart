import crypto from 'crypto';

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer | Buffer) {
  return Buffer.from(buffer).toString('hex');
}

function sha256Hex(data: string | Uint8Array | Buffer) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmac(key: Buffer, data: string | Uint8Array | Buffer) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function getSignatureKey(secretAccessKey: string, dateStamp: string, region: string, service: string) {
  const kDate = hmac(Buffer.from(`AWS4${secretAccessKey}`, 'utf8'), dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

function encodeR2Path(path: string) {
  return path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

function normalizePublicUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

export function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error('Missing R2 configuration environment variables');
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

function getR2Endpoint(accountId: string) {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

function buildCanonicalRequest(
  method: string,
  canonicalUri: string,
  canonicalQuerystring: string,
  canonicalHeaders: string,
  signedHeaders: string,
  payloadHash: string,
) {
  return [method, canonicalUri, canonicalQuerystring, canonicalHeaders, signedHeaders, payloadHash].join('\n');
}

function buildStringToSign(algorithm: string, amzDate: string, credentialScope: string, hashedCanonicalRequest: string) {
  return [algorithm, amzDate, credentialScope, hashedCanonicalRequest].join('\n');
}

function signR2Request({
  method,
  url,
  headers,
  payloadHash,
  accessKeyId,
  secretAccessKey,
  region = 'auto',
  service = 's3',
}: {
  method: string;
  url: string;
  headers: Record<string, string>;
  payloadHash: string;
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
  service?: string;
}) {
  const u = new URL(url);
  const date = new Date();
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  headers['x-amz-date'] = amzDate;

  const canonicalUri = u.pathname;
  const canonicalQuerystring = u.searchParams.toString();
  const signedHeaders = Object.keys(headers)
    .map((name) => name.toLowerCase())
    .sort()
    .join(';');
  const canonicalHeaders = Object.keys(headers)
    .map((name) => `${name.toLowerCase()}:${headers[name].trim()}`)
    .sort()
    .join('\n') + '\n';

  const canonicalRequest = buildCanonicalRequest(
    method,
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  );

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = buildStringToSign(
    algorithm,
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  );

  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = toHex(hmac(signingKey, encoder.encode(stringToSign)));
  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { authorizationHeader, amzDate, dateStamp };
}

export async function uploadToR2(bucket: string, path: string, body: Buffer, contentType: string) {
  const config = getR2Config();
  const objectKey = path.replace(/^\/+/u, '');
  const encodedKey = encodeR2Path(objectKey);
  const url = `${getR2Endpoint(config.accountId)}/${bucket}/${encodedKey}`;
  const payloadHash = sha256Hex(body);

  const headers = {
    host: `${config.accountId}.r2.cloudflarestorage.com`,
    'content-type': contentType,
    'x-amz-content-sha256': payloadHash,
  };

  const { authorizationHeader, amzDate } = signR2Request({
    method: 'PUT',
    url,
    headers,
    payloadHash,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      ...headers,
      'x-amz-date': amzDate,
      Authorization: authorizationHeader,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`R2 upload failed: ${response.status} ${response.statusText} ${text}`);
  }

  return { key: objectKey, publicUrl: getR2PublicUrl(objectKey) };
}

export async function deleteFromR2(bucket: string, path: string) {
  const config = getR2Config();
  const objectKey = path.replace(/^\/+/u, '');
  const encodedKey = encodeR2Path(objectKey);
  const url = `${getR2Endpoint(config.accountId)}/${bucket}/${encodedKey}`;
  const payloadHash = sha256Hex('');

  const headers = {
    host: `${config.accountId}.r2.cloudflarestorage.com`,
    'x-amz-content-sha256': payloadHash,
  };

  const { authorizationHeader, amzDate } = signR2Request({
    method: 'DELETE',
    url,
    headers,
    payloadHash,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      ...headers,
      'x-amz-date': amzDate,
      Authorization: authorizationHeader,
    },
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`R2 delete failed: ${response.status} ${response.statusText} ${text}`);
  }

  return { key: objectKey };
}

export function getR2PublicUrl(path: string) {
  const baseUrl = getR2Config().publicUrl;
  const objectKey = path.replace(/^\/+/u, '');
  return `${normalizePublicUrl(baseUrl)}/${encodeR2Path(objectKey)}`;
}
