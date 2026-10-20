import test from 'node:test';import assert from 'node:assert/strict';
import {availableThemes,themes,themeScope} from './themes.js';
test('P147 three personal palettes are free, first care earns Field Notes and both secrets earn Aurora',()=>{
 assert.deepEqual(availableThemes().map(t=>t.id),['autumn','sea-glass','peach-static']);
 assert(availableThemes(['first-watch']).some(t=>t.id==='field-notes'));
 assert(!availableThemes(['block-party']).some(t=>t.id==='aurora-protocol'));
 assert(!availableThemes(['silent-operator']).some(t=>t.id==='aurora-protocol'));
 assert(availableThemes(['block-party','silent-operator']).some(t=>t.id==='aurora-protocol'));
 assert.equal(new Set(themes.map(t=>t.id)).size,themes.length);
});
test('P147 theme storage uses the authenticated family/user, never an editable caregiver label',()=>{
 assert.equal(themeScope({family:'f',user:'u',baby:'b',person:'Sam'}),'f:u');assert.equal(themeScope({family:'f',user:'u',baby:'b',person:'Nona'}),'f:u');assert.equal(themeScope({family:'f',user:'u'}),'');assert.notEqual(themeScope({family:'f2',user:'u',baby:'b'}),'f:u');
});
await import('./family-stars.js');
test('P147 Star adjustments use verified account permissions, with only Sam able to adjust self',()=>{
 const api=globalThis.LucaFamilyStars;assert.equal(api.canChangeStars({person:'Nona',manager:false},' NONA '),false);assert.equal(api.canChangeStars({person:'Nona',manager:false},'KJ'),true);assert.equal(api.canChangeStars({person:'Sam',manager:true},'Sam'),true);assert.equal(api.canChangeStars({person:'',manager:false},'KJ'),false);
 const e=api.entry('award',{person:'KJ',delta:-2,reason:'Correction'},'remove');assert.equal(e.details.starChart.delta,-2);
});
