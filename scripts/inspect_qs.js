const fs = require('fs');
const p = 'functions/helpers/emailValidation.js';
const s = fs.readFileSync(p, 'utf8');
let arr = [];
for (let i = 0; i < s.length; i++) { if (s.charCodeAt(i) === 63) arr.push(i); }
console.log('positions of ?:', arr);
for (let pos of arr) {
    const start = Math.max(0, pos - 40);
    const end = Math.min(s.length, pos + 40);
    const context = s.slice(start, end);
    console.log('---', pos, '---');
    console.log(context.replace(/\n/g, '\\n'));
}