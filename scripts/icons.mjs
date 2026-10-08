import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('public/icons',{recursive:true});
for(const size of [192,512]) await sharp('public/icon.svg').resize(size,size).png().toFile(`public/icons/icon-${size}.png`);
await sharp('public/icon.svg').resize(400,400).extend({top:56,bottom:56,left:56,right:56,background:'#f7f5ed'}).png().toFile('public/icons/maskable-512.png');

// iOS home-screen icon: opaque PNG, also available at Safari's default path.
await sharp('public/icon.svg').resize(180,180).flatten({background:'#f7f5ed'}).png().toFile('public/apple-touch-icon.png');
