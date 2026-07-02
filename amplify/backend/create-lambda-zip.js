/**
 * Fast zip creator for Lambda deployment using archiver
 * Usage: node create-lambda-zip.js
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const deployDir = path.join(__dirname, 'lambda-deployment');
const outZip = path.join(__dirname, 'employer-profile-lambda.zip');

// Check if archiver is available, if not use a simpler approach
let archiver;
try {
  archiver = require('archiver');
  if (typeof archiver !== 'function') throw new Error('not a function');
} catch (e) {
  console.log('Installing archiver...');
  execSync('npm install archiver@6', { cwd: __dirname, stdio: 'inherit' });
  // Clear require cache
  delete require.cache[require.resolve('archiver')];
  archiver = require('archiver');
}

if (fs.existsSync(outZip)) {
  fs.unlinkSync(outZip);
  console.log('Removed old zip');
}

const output = fs.createWriteStream(outZip);
const archive = archiver('zip', { zlib: { level: 6 } });

output.on('close', () => {
  const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✅ Zip created: ${outZip} (${sizeMB} MB)`);
});

archive.on('error', (err) => { throw err; });

archive.pipe(output);
archive.directory(deployDir, false);
archive.finalize();
