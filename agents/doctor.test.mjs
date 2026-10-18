import test from 'node:test';
import assert from 'node:assert/strict';
import {readTap,readBrowser,handoffFor} from './doctor.mjs';
test('Doctor treats missing evidence as unknown and real failing evidence as failed',()=>{
 assert.equal(readTap('').status,'unverified');assert.equal(readBrowser(null).status,'unverified');
 assert.equal(readTap('# tests 5\n# pass 4\n# fail 1\nnot ok 2 - sleep inference').status,'failed');
 assert.equal(readTap('# tests 5\n# pass 5\n# fail 0').status,'passed');
 assert.equal(readBrowser({stats:{expected:5,unexpected:0,flaky:1}}).status,'flaky');
});
test('Doctor gives a bounded owner and reproducer rather than inventing automatic repairs',()=>{
 const tasks=handoffFor(['offline bottle edit failed','sleep note not counted','demo reset touched real history']);
 assert.equal(tasks[0].area,'care integrity');assert.equal(tasks[1].area,'sleep');assert.equal(tasks[2].area,'friend sandbox');assert.ok(tasks.every(t=>t.autoDeploy===false&&t.reproduce.startsWith('node ')));
});
