const screens=new Set(['today','question','weekly-question','weekly-reveal','done','sets','history','saved','reveal','notification','insights','report','pair','preferences','settings','install']);
export function isAppScreen(value:string|null,demo=false):value is string {return value!==null&&screens.has(value)&&(demo||value!=='notification');}
export function appScreen(value:string|null,demo:boolean){return isAppScreen(value,demo)?value:demo?'question':'today';}
