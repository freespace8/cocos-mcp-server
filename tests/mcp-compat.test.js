const assert = require('node:assert/strict');
const test = require('node:test');

const { MCPServer } = require('../dist/mcp-server.js');

function createSettings() {
  return {
    port: 0,
    autoStart: false,
    enableDebugLog: false,
    allowedOrigins: [],
    maxConnections: 8,
  };
}

async function startServer(t) {
  const server = new MCPServer(createSettings());
  await server.start();
  t.after(() => {
    server.stop();
  });

  const address = server.httpServer?.address();
  assert.ok(address && typeof address !== 'string');

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

async function readJson(response) {
  const bodyText = await response.text();
  return {
    bodyText,
    json: bodyText.length > 0 ? JSON.parse(bodyText) : null,
  };
}

async function postJson(baseUrl, payload) {
  const response = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const { bodyText, json } = await readJson(response);
  return { response, bodyText, json };
}

test('GET /mcp returns 405 when SSE is not offered', async (t) => {
  const { baseUrl } = await startServer(t);

  const response = await fetch(`${baseUrl}/mcp`, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
    },
  });

  assert.equal(response.status, 405);
});

test('initialize negotiates the requested protocol version', async (t) => {
  const { baseUrl } = await startServer(t);

  const { response, json } = await postJson(baseUrl, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: {
        name: 'codex-test',
        version: '0.1.0',
      },
    },
  });

  assert.equal(response.status, 200);
  assert.equal(json.result.protocolVersion, '2025-06-18');
  assert.equal(json.result.serverInfo.name, 'cocos-mcp-server');
  assert.deepEqual(json.result.capabilities, {
    tools: {},
    resources: {},
    prompts: {},
  });
});

test('notifications/initialized is accepted as a notification', async (t) => {
  const { baseUrl } = await startServer(t);

  await postJson(baseUrl, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: {
        name: 'codex-test',
        version: '0.1.0',
      },
    },
  });

  const response = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {},
    }),
  });

  const bodyText = await response.text();
  assert.equal(response.status, 202);
  assert.equal(bodyText, '');
});

test('resources/list and prompts/list degrade to empty results', async (t) => {
  const { baseUrl } = await startServer(t);

  const resources = await postJson(baseUrl, {
    jsonrpc: '2.0',
    id: 2,
    method: 'resources/list',
    params: {},
  });
  const prompts = await postJson(baseUrl, {
    jsonrpc: '2.0',
    id: 3,
    method: 'prompts/list',
    params: {},
  });
  const resourceTemplates = await postJson(baseUrl, {
    jsonrpc: '2.0',
    id: 4,
    method: 'resources/templates/list',
    params: {},
  });

  assert.deepEqual(resources.json.result, { resources: [] });
  assert.deepEqual(prompts.json.result, { prompts: [] });
  assert.deepEqual(resourceTemplates.json.result, { resourceTemplates: [] });
});
