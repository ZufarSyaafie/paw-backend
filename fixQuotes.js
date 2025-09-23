// fixQuotes.js
// usage: node fixQuotes.js
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const IGNORE = ['node_modules', '.git', 'dist', '.cache'];

function shouldIgnore(p){
  return IGNORE.some(x => p.includes(path.sep + x + path.sep) || p.endsWith(path.sep + x));
}

function walk(dir, cb){
  const items = fs.readdirSync(dir);
  for(const it of items){
    const full = path.join(dir, it);
    if (shouldIgnore(full)) continue;
    const stat = fs.statSync(full);
    if(stat.isDirectory()){
      walk(full, cb);
    } else if(stat.isFile() && full.endsWith('.js')){
      cb(full);
    }
  }
}

let changed = 0;
walk(ROOT, (file)=>{
  let s = fs.readFileSync(file, 'utf8');

  // pattern: require('../models/Name');  OR  require('../models/Name');
  s = s.replace(/require\(\s*'(\.\.\/(models|middleware|controllers|utils)\/[^'"]+)"\s*\)/g, "require('$1')");
  s = s.replace(/require\(\s*"(\.\.\/(models|middleware|controllers|utils)\/[^'"]+)'\s*\)/g, "require('$1')");

  if(s !== fs.readFileSync(file, 'utf8')){
    fs.writeFileSync(file, s, 'utf8');
    console.log('[fixed quotes]', path.relative(ROOT, file));
    changed++;
  }
});

console.log('done. files changed:', changed);
