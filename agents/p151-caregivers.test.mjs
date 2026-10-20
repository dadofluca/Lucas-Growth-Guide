import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('P151: schedule runtime parses with escaped caregiver names',()=>{
 assert.doesNotThrow(()=>new vm.Script(readFileSync(new URL('../sync-fix.js',import.meta.url),'utf8')));
});
test('P151: saved names normalize safely and special characters cannot break typed attribution',()=>{
 const context={window:{}};vm.createContext(context);vm.runInContext(readFileSync(new URL('./caregivers.js',import.meta.url),'utf8'),context);
 assert.equal(context.window.LucaCaregivers.validate('  Aunt   Maria  '),'Aunt Maria');assert.equal(context.window.LucaCaregivers.validate('Alex (Nurse)'),'Alex (Nurse)');
 for(const name of ['','<img>','Sam and Alex','Alex, Sam','Other'])assert.throws(()=>context.window.LucaCaregivers.validate(name));
 const source=readFileSync(new URL('../index.html',import.meta.url),'utf8'),a=source.indexOf('function namedCaregiver'),b=source.indexOf('function caregiverNearAction',a);context.CAREGIVERS=['Ann','Alex (Nurse)'];vm.runInContext(source.slice(a,b),context);
 assert.equal(context.namedCaregiver('Alex (Nurse) gave 8 oz'),'Alex (Nurse)');assert.equal(context.namedCaregiver('Ann changed a diaper'),'Ann');assert.equal(context.namedCaregiver('ate banana'),null);
});
