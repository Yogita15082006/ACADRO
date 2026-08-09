const fs = require('fs');
const path = './src/pages/EventsModule.tsx';
let content = fs.readFileSync(path, 'utf8');
let original = fs.readFileSync('temp.tsx', 'utf8');

const startStr = '  const renderEventCard = (event: any, isAdmin: boolean) => (';
const startIndex = original.indexOf(startStr);
const endIndex = original.indexOf('  const renderAdminEventDetails = () => (', startIndex);
let chunk = original.substring(startIndex, endIndex);

const splitPoint = content.indexOf('  const renderCreateEvent = () => (');
content = content.slice(0, splitPoint) + chunk + '\n' + content.slice(splitPoint);

fs.writeFileSync(path, content, 'utf8');
console.log('Inserted robustly');