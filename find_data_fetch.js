const fs = require('fs');
const content = fs.readFileSync('src/pages/candidate/JobListing.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('setQuickJobs') || line.includes('setDynamoDBJobs') || line.includes('fetchData')) {
    console.log(`${index + 1}: ${line}`);
    // print some context
    for(let i=1; i<=3; i++) {
        if(lines[index+i]) console.log(`  ${index+1+i}: ${lines[index+i]}`);
    }
  }
});
