const fs = require('fs');
const path = './src/pages/EventsModule.tsx';
let content = fs.readFileSync(path, 'utf8');
let original = fs.readFileSync('temp.tsx', 'utf8');

const startStr = '  const renderEventCard = (event: any, isAdmin: boolean) => (';
const startIndex = original.indexOf(startStr);
const endIndex = original.indexOf('  const renderCreateEvent = () => (', startIndex);
const chunk = original.substring(startIndex, endIndex);

content = content.replace('const renderCreateEvent = () => (<CreateEventForm', chunk + '\n  const renderCreateEvent = () => (<CreateEventForm');

fs.writeFileSync(path, content, 'utf8');
console.log('Done replacement');