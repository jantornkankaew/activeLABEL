// Fixed shared engine entrypoint: JSON data on stdin, never JavaScript from the model.
import {openChatGPTLabel, prepareProposal} from './engine.mjs';
let input = '';
for await (const chunk of process.stdin) {
  input += chunk;
  if (input.length > 1_000_000) { process.stderr.write('Request too large'); process.exit(1); }
}
try {
  const request = JSON.parse(input);
  const output = request.operation === 'open' ? openChatGPTLabel(request.input) :
    request.operation === 'propose' ? prepareProposal(request.input) : (() => { throw Error('Unknown operation'); })();
  process.stdout.write(JSON.stringify({ok: true, output}));
} catch (error) {
  process.stdout.write(JSON.stringify({ok: false, error: error instanceof Error ? error.message : 'Invalid request'}));
}
