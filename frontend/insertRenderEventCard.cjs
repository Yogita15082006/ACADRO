const fs = require('fs');
const path = './src/pages/EventsModule.tsx';
let content = fs.readFileSync(path, 'utf8');
let original = fs.readFileSync('temp.tsx', 'utf8');

const startStr = '  const renderEventCard = (event: any, isAdmin: boolean) => (';
const endStr = '  const renderAdminEventDetails = () => (';

const startIndex = original.indexOf(startStr);
let endIndex = original.indexOf(endStr);
if (endIndex === -1) { endIndex = original.indexOf('  const renderCreateEvent = () => ('); }

const chunk = original.substring(startIndex, endIndex);

content = content.replace('  const renderCreateEvent = () => (<CreateEventForm', chunk + '\n  const renderCreateEvent = () => (<CreateEventForm');

// Also fix the props on CreateEventForm since PowerShell failed earlier
content = content.replace('onBack={() =>', 'onCancel={() =>');
content = content.replace('onSuccess={() =>', 'onSave={() =>');

fs.writeFileSync(path, content, 'utf8');
console.log('Inserted');