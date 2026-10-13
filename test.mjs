import assert from 'node:assert/strict';
import { handle } from './server.mjs';

const init = handle({ jsonrpc: '2.0', id: 1, method: 'initialize' });
assert.equal(init.result.protocolVersion, '2025-11-25');

const list = handle({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
assert.equal(list.result.tools.length, 3);

const plan = handle({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: {
  name: 'plan_day', arguments: { tasks: [
    { title: 'Reply to client', priority: 'low', minutes: 10 },
    { title: 'Ship demo', priority: 'high', minutes: 40 },
  ] },
} });
assert.equal(plan.result.structuredContent.tasks[0].title, 'Ship demo');
assert.equal(plan.result.structuredContent.totalMinutes, 50);

const note = handle({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'capture_note', arguments: { text: 'Test note' } } });
assert.equal(note.result.structuredContent.saved, true);

console.log('All MCP contract tests passed.');

