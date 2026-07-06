import fs from 'fs';
const code = fs.readFileSync('src/pages/candidate/JobListing.jsx', 'utf8');
const lines = code.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '`') count++;
  }
  // Log khi count lẻ (có thể là lỗi)
  if (count % 2 !== 0 && i > 0 && i < 500) {
    console.log(`Line ${i+1} (count=${count}): ${line.trim().substring(0,80)}`);
  }
}
console.log('Total backticks:', count, count % 2 === 0 ? 'balanced' : 'UNBALANCED!');
