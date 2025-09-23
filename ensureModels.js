// ensureModels.js
// usage: node ensureModels.js
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const modelsDir = path.join(ROOT, 'models');
if(!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir);

function writeIfMissing(fname, content){
  const p = path.join(modelsDir, fname);
  if(!fs.existsSync(p)){
    fs.writeFileSync(p, content, 'utf8');
    console.log('created', fname);
  } else {
    console.log('exists', fname);
  }
}

const userTpl = `// models/User.js
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  password: { type: String },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', UserSchema);
`;

const notifTpl = `// models/Notification.js
const mongoose = require('mongoose');
const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Notification', NotificationSchema);
`;

writeIfMissing('User.js', userTpl);
writeIfMissing('Notification.js', notifTpl);

console.log('done.');
