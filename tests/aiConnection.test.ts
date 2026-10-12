import test from 'node:test';
import assert from 'node:assert/strict';
import {connectionURL} from '../src/aiConnection';

test('hosted frontend requires trusted HTTPS for either provider', () => {
  for (const provider of ['api', 'codex'] as const) {
    assert.throws(() => connectionURL(provider, 'http://localhost:28172', 'https:'), /HTTPS/);
    assert.equal(connectionURL(provider, 'https://localhost:28172/', 'https:'), 'https://localhost:28172');
  }
});
test('ChatGPT credentials only connect to a local connector; API can be hosted', () => {
  assert.throws(() => connectionURL('codex', 'https://remote.example', 'https:'), /เครื่องนี้/);
  assert.equal(connectionURL('api', 'https://remote.example/ai/', 'https:'), 'https://remote.example/ai');
  assert.equal(connectionURL('codex', 'https://[::1]:28172', 'https:'), 'https://[::1]:28172');
  assert.equal(connectionURL('codex', 'http://127.0.0.1:28172', 'http:'), 'http://127.0.0.1:28172');
});
test('server URLs reject credentials, query tokens and executable schemes', () => {
  for (const url of ['https://user:pass@localhost', 'https://localhost?token=abc', 'https://localhost#token', 'javascript:alert(1)', 'not a URL']) {
    assert.throws(() => connectionURL('api', url, 'https:'));
  }
});
