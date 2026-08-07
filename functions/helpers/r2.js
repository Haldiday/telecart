const encoder = new TextEncoder();

function toHex(buffer) {
    return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(data) {
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return toHex(buffer);
}

async function hmac(key, data) {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    return new Uint8Array(signature);
}

async function getSignatureKey(secretAccessKey, dateStamp, region, service) {
    const kDate = await hmac(encoder.encode('AWS4' + secretAccessKey), encoder.encode(dateStamp));
    const kRegion = await hmac(kDate, encoder.encode(region));
    const kService = await hmac(kRegion, encoder.encode(service));
    return await hmac(kService, encoder.encode('aws4_request'));
}

function encodeR2Path(path) {
    return path
        .split('/')
        .map((part) => encodeURIComponent(part).replace(/%2F/g, '/'))
        .join('/');
}

function normalizePublicUrl(baseUrl) {
    return baseUrl.replace(/\/+$/, '');
}

function getR2PublicUrl(env, path) {
    const baseUrl = env.R2_PUBLIC_URL;
    if (!baseUrl) {
        throw new Error('Missing R2_PUBLIC_URL environment variable');
    }
    const encodedPath = encodeR2Path(path.replace(/^\/+/, ''));
    return `${normalizePublicUrl(baseUrl)}/${encodedPath}`;
}

function getR2Config(env) {
    const accountId = env.R2_ACCOUNT_ID;
    const accessKeyId = env.R2_ACCESS_KEY_ID;
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
    const bucketName = env.R2_BUCKET_NAME;
    const publicUrl = env.R2_PUBLIC_URL;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
        throw new Error('Missing R2 configuration environment variables');
    }

    return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

function getR2Endpoint(accountId) {
    return `https://${accountId}.r2.cloudflarestorage.com`;
}

async function signR2Request({ method, url, headers, payloadHash, accessKeyId, secretAccessKey, region = 'auto', service = 's3' }) {
    const u = new URL(url);
    const date = new Date();
    const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '') + 'Z';
    const dateStamp = amzDate.slice(0, 8);

    const canonicalUri = u.pathname.split('/').map((segment) => encodeURIComponent(segment)).join('/');
    const canonicalQuerystring = u.searchParams.toString();

    const signedHeaders = Object.keys(headers)
        .map((name) => name.toLowerCase())
        .sort()
        .join(';');

    const canonicalHeaders = Object.keys(headers)
        .map((name) => `${name.toLowerCase()}:${headers[name].trim()}`)
        .sort()
        .join('\n') + '\n';

    const canonicalRequest = [
        method,
        canonicalUri,
        canonicalQuerystring,
        canonicalHeaders,
        signedHeaders,
        payloadHash,
    ].join('\n');

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
        algorithm,
        amzDate,
        credentialScope,
        await sha256(encoder.encode(canonicalRequest)),
    ].join('\n');

    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
    const signature = toHex(await hmac(signingKey, encoder.encode(stringToSign)));

    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return { authorizationHeader, amzDate, dateStamp };
}

async function uploadToR2(env, bucket, path, body, contentType) {
    const config = getR2Config(env);
    console.log('uploadToR2', { bucket, path, publicUrl: config.publicUrl });
    const objectKey = path.replace(/^\/+/, '');
    const encodedKey = encodeR2Path(objectKey);
    const url = `${getR2Endpoint(config.accountId)}/${bucket}/${encodedKey}`;
    const payloadHash = await sha256(body);

    const headers = {
        host: `${config.accountId}.r2.cloudflarestorage.com`,
        'content-type': contentType || 'application/octet-stream',
        'x-amz-content-sha256': payloadHash,
    };

    const { authorizationHeader, amzDate } = await signR2Request({
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

    const publicUrl = getR2PublicUrl(env, objectKey);
    return { key: objectKey, publicUrl };
}

async function deleteFromR2(env, bucket, path) {
    const config = getR2Config(env);
    const objectKey = path.replace(/^\/+/, '');
    const encodedKey = encodeR2Path(objectKey);
    const url = `${getR2Endpoint(config.accountId)}/${bucket}/${encodedKey}`;
    const payloadHash = await sha256(encoder.encode(''));

    const headers = {
        host: `${config.accountId}.r2.cloudflarestorage.com`,
        'x-amz-content-sha256': payloadHash,
    };

    const { authorizationHeader, amzDate } = await signR2Request({
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

export { uploadToR2, deleteFromR2, getR2PublicUrl, getR2Config };