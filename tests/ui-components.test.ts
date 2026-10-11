import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {PrimaryNavigation} from '../components/primary-navigation';
import {SiteNavigation} from '../components/site-navigation';
import {AppAction,AnswerChoice,ChoiceAttributes,QuickAction} from '../components/ui';

test('all navigation variants use identical destinations and labels',()=>{
 for(const variant of ['sidebar','mobile','footer'] as const){
  const html=renderToStaticMarkup(createElement(PrimaryNavigation,{variant,current:'vragen'}));
  assert.equal((html.match(/<a\b/g)??[]).length,3,variant);
  for(const label of ['Home','Vragen','Instellingen'])assert.ok(html.includes('>'+label+'</span>'),variant+': '+label);
  assert.ok(html.includes('aria-current="page"'));
  assert.ok(html.includes('href="/vragen"'));
  assert.ok(html.includes('href="/?screen=settings"'));
 }
 const footer=renderToStaticMarkup(createElement(SiteNavigation,{current:'/vragen'}));
 assert.ok(footer.includes('app-primary-nav--footer'));
});

test('buttons and links have native semantics but share action styling',()=>{
 const button=renderToStaticMarkup(createElement(AppAction,{variant:'primary'},'Begin'));
 const link=renderToStaticMarkup(createElement(AppAction,{variant:'primary',href:'/vragen'},'Vragen'));
 assert.match(button,/<button[^>]*type="button"[^>]*class="rk-button"/);
 assert.match(link,/<a[^>]*class="rk-button"[^>]*href="\/vragen"/);
});

test('the same answer component renders its selected state and attributes',()=>{
 const details=createElement(ChoiceAttributes,{attributes:{budget:100,nature:4},other:{budget:120,nature:4}});
 const answer=renderToStaticMarkup(createElement(AnswerChoice,{label:'A',title:'Kleine reis',description:'In de natuur',chosen:true},details));
 assert.match(answer,/rk-answer-tile rk-answer-chosen/);
 assert.match(answer,/jouw keuze/);
 assert.match(answer,/rk-attr-difference/);
 assert.match(answer,/€ 100\/week/);
 const action=renderToStaticMarkup(createElement(QuickAction,{title:'Buzzer',description:'Seintje',icon:'!',onClick:()=>{}}));
 assert.match(action,/home-action/);
});
