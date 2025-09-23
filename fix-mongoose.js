// fix-mongoose.js
const fs = require("fs");
const path = require("path");

const targetDir = path.join(__dirname, "tests"); // folder test
const modelDir = path.join(__dirname, "models"); // folder model

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  // 1. cari mongoose.connect di test file -> comment + tambah note
  content = content.replace(/await\s+mongoose\.connect\(.*\);?/g, match => {
    changed = true;
    return `// ${match}   <-- commented by script (handled by tests/setup.js)\n// mongoose.connect now handled globally in tests/setup.js`;
  });

  // 2. cari mongoose.createConnection di model -> comment + ganti
  content = content.replace(/mongoose\.createConnection\(.*\);?/g, match => {
    changed = true;
    return `// ${match}   <-- commented by script (should use default mongoose)\n// use default mongoose instance instead (already connected in setup)`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("✅ fixed:", filePath);
  }
}

// recursive scan
function scanDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      scanDir(full);
    } else if (file.endsWith(".js")) {
      processFile(full);
    }
  });
}

// run
scanDir(targetDir);
scanDir(modelDir);
