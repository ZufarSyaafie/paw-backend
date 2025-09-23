// fixPaths.js
// usage: node fixPaths.js
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

const patterns = [
  // ./models/  -> ../models/
  { r: /require\(\s*['"]\.\/models\//g, s: "require('../models/" },
  { r: /require\(\s*['"]\.\/middleware\//g, s: "require('../middleware/" },
  { r: /require\(\s*['"]\.\/controllers\//g, s: "require('../controllers/" },
  { r: /require\(\s*['"]\.\/utils\//g, s: "require('../utils/" },
  // accidental triple-dots '.../' -> '../'
  { r: /require\(\s*['"]\.\.\.\/+/g, s: "require('../" },
  // common wrong: require('../models/User') -> require('../models/User')
  { r: /require\(\s*['"]\.\.\/User['"]\s*\)/g, s: "require('../models/User')" },
  { r: /require\(\s*['"]\.\.\/Notification['"]\s*\)/g, s: "require('../models/Notification')" },
  // general: require('../SomeModel') where SomeModel looks like Model without models/ -> add models/ for common cases
  // NOTE: this one is conservative: only apply for capitalized names in models folder (User, Book, Notification, Room, Borrowing)
  { r: /require\(\s*['"]\.\.\/(User|Book|Notification|Room|Borrowing|Borrow|RoomBooking)['"]\s*\)/g,
    s: "require('../models/$1')" }
];

let changedFiles = [];

walk(ROOT, (file)=>{
  let src = fs.readFileSync(file,'utf8');
  let orig = src;
  for(const p of patterns){
    src = src.replace(p.r, p.s);
  }
  if(src !== orig){
    fs.writeFileSync(file, src, 'utf8');
    changedFiles.push(file);
    console.log('[fixed]', path.relative(ROOT, file));
  }
});

console.log('done. files changed:', changedFiles.length);
if(changedFiles.length > 0) console.log('review changes before commit.');
