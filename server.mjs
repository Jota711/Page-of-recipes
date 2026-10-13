import http from 'node:http';

const notes = [];

function jsonRpc(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function error(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function toolResult(text, data = {}) {
  return { content: [{ type: 'text', text }], structuredContent: data };
}

function callTool(name, args = {}) {
  if (name === 'plan_day') {
    const tasks = Array.isArray(args.tasks) ? args.tasks : [];
    const ordered = tasks
      .map((task, index) => ({
        title: String(task.title || `Task ${index + 1}`),
        minutes: Math.max(1, Number(task.minutes) || 25),
        priority: ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium',
      }))
      .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));
    const totalMinutes = ordered.reduce((sum, task) => sum + task.minutes, 0);
    const lines = ordered.map((task, i) => `${i + 1}. [${task.priority}] ${task.title} (${task.minutes} min)`);
    return toolResult(lines.length ? `${lines.join('\n')}\nTotal: ${totalMinutes} minutes` : 'No tasks supplied.', { tasks: ordered, totalMinutes });
  }

  if (name === 'capture_note') {
    const text = String(args.text || '').trim();
    if (!text) return toolResult('A note cannot be empty.', { saved: false });
    const note = { id: notes.length + 1, text, createdAt: new Date().toISOString() };
    notes.push(note);
    return toolResult(`Saved note ${note.id}.`, { saved: true, note });
  }

  if (name === 'list_notes') {
    return toolResult(notes.length ? notes.map((note) => `${note.id}. ${note.text}`).join('\n') : 'No notes saved.', { notes });
  }

  throw new Error(`Unknown tool: ${name}`);
}

function handle(message) {
  const { id, method, params = {} } = message || {};
  if (method === 'initialize') {
    return jsonRpc(id, {
      protocolVersion: '2025-11-25',
      capabilities: { tools: {} },
      serverInfo: { name: 'alexa-focus-mcp', version: '1.0.0' },
    });
  }
  if (method === 'notifications/initialized') return null;
  if (method === 'ping') return jsonRpc(id, {});
  if (method === 'tools/list') {
    return jsonRpc(id, { tools: [
      { name: 'plan_day', description: 'Order tasks by priority and estimate the total focus time.', inputSchema: { type: 'object', properties: { tasks: { type: 'array' } }, required: ['tasks'] } },
      { name: 'capture_note', description: 'Save a short local note for the current session.', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
      { name: 'list_notes', description: 'List notes saved in the current session.', inputSchema: { type: 'object', properties: {} } },
    ] });
  }
  if (method === 'tools/call') {
    try { return jsonRpc(id, callTool(params.name, params.arguments)); }
    catch (e) { return error(id, -32602, e.message); }
  }
  return error(id, -32601, `Unknown method: ${method}`);
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<h1>Alexa Focus MCP</h1><p>POST JSON-RPC to <code>/mcp</code>.</p>');
    return;
  }
  if (req.method !== 'POST' || req.url !== '/mcp') {
    res.writeHead(404); res.end('Not found'); return;
  }
  let body = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    try {
      const reply = handle(JSON.parse(body));
      if (reply === null) { res.writeHead(202); res.end(); return; }
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(reply));
    } catch (e) {
      res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(error(null, -32700, e.message)));
    }
  });
});

function startServer(port = Number(process.env.PORT || 8787)) {
  return server.listen(port, () => console.log(`Alexa Focus MCP listening on http://localhost:${port}/mcp`));
}

if (process.env.ALEXA_FOCUS_RUN === '1') startServer();

export { handle, startServer };

