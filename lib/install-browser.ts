export type InstallBrowser='unknown'|'ecosia'|'safari'|'chrome'|'firefox'|'edge';
// Browser markers overlap: Ecosia and Chromium browsers can also contain Safari.
export function installBrowser(userAgent:string):InstallBrowser {
 if(/\bEcosia\b/i.test(userAgent))return 'ecosia';
 if(/\b(?:EdgiOS|EdgA|Edg)\//i.test(userAgent))return 'edge';
 if(/\b(?:CriOS|Chrome)\//i.test(userAgent))return 'chrome';
 if(/\b(?:FxiOS|Firefox)\//i.test(userAgent))return 'firefox';
 if(/\bVersion\//i.test(userAgent)&&/\bSafari\//i.test(userAgent))return 'safari';
 return 'unknown';
}
