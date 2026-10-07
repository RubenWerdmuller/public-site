import assert from 'node:assert/strict';
const base=process.env.APP_TEST_URL??'http://localhost:3101';
function client(){let cookie='';return async(payload)=>{const response=await fetch(`${base}/api/app`,{method:payload?'POST':'GET',headers:{Cookie:cookie,...(payload?{Origin:base,'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined});const set=response.headers.get('set-cookie');if(set)cookie=set.split(';')[0];return {status:response.status,data:await response.json()};};}
const a=client(),b=client(),guest=client(),nonce=Date.now();
for(const [index,user] of [a,b].entries())assert.equal((await user({action:'register',name:`Push test ${index}`,email:`push-${nonce}-${index}@example.com`,password:'push-test-only-123',avatar:index})).status,200);
const subscription={endpoint:`https://fcm.googleapis.com/push-test-${nonce}`,keys:{p256dh:'not-a-real-key-but-long-enough-for-validation',auth:'not-a-real-auth'}};
assert.equal((await a({action:'subscribe',subscription})).status,200);
assert.equal((await guest({action:'push-test',endpoint:subscription.endpoint})).status,401);
assert.equal((await b({action:'push-test',endpoint:subscription.endpoint})).status,403);
assert.equal((await a()).data.pushConfigured,false);assert.equal((await a()).data.pushPublicKey,null);
assert.equal((await a({action:'push-test',endpoint:subscription.endpoint})).status,503);
assert.equal((await fetch(`${base}/api/jobs`)).status,401);
assert.equal((await fetch(`${base}/api/jobs`,{headers:{Authorization:'Bearer wrong'}})).status,401);
assert.equal((await fetch(`${base}/api/app`,{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:JSON.stringify({action:'push-test',endpoint:subscription.endpoint})})).status,403);
console.log('PASS: authenticated device ownership, guest/CSRF/cron rejection, missing-config status, public-key-only projection; no notification is sent.');
