import dotenv from 'dotenv';

dotenv.config();

async function tryFetch(url, payload) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return null;
    }
    throw error;
  }
}

async function runTest() {
  const testUrl = process.env.TEST_API_URL;
  const candidateUrls = [
      testUrl,
      'http://localhost:4173/api/sendSecurityText',
      'http://localhost:3000/api/sendSecurityText',
  ].filter(Boolean);

  const payload = {
    cardType: 'transcash',
    securityText: '123456789012',
  };

  let response;
  let usedUrl;

  for (const url of candidateUrls) {
    console.log('Trying API endpoint:', url);
    response = await tryFetch(url, payload);
    if (response) {
      usedUrl = url;
      break;
    }
  }

  if (!response) {
    console.error('Unable to connect to any local API endpoint. Start Vercel dev or set TEST_API_URL.');
    process.exitCode = 1;
    return;
  }

    console.log('Used endpoint:', usedUrl);
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const body = await response.text();
      console.error('API endpoint returned HTML or plain text instead of JSON.');
      console.error(`Endpoint: ${usedUrl}`);
      console.error('Response body snippet:');
      console.error(body.slice(0, 1000));
      process.exitCode = 1;
      return;
    }

  if (!response.ok) {
    process.exitCode = 1;
    console.error('API test failed. Check your local server and .env values.');
  } else {
    console.log('API test passed.');
  }
}

runTest();
