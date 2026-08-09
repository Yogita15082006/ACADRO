const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'EventsModule.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Add toast import if missing
if (!content.includes(`import { toast }`)) {
  content = content.replace(`import { cn } from '../lib/utils';`, `import { cn } from '../lib/utils';\nimport { toast } from 'react-hot-toast';`);
}

// Fix 'newnotice' -> 'newNotice' and 'content' -> 'description' in notice creation
content = content.replace(/setNewNotice\(\{title: '', content: '', attachment: 'None'\}\)/g, "setNewNotice({title: '', description: '', attachment: 'None'})");
content = content.replace(/setNewNotice\(\{title: '', content: '', attachment: 'PDF'\}\)/g, "setNewNotice({title: '', description: '', attachment: 'PDF'})");

// Replace all usages of 'newNotice.content' with 'newNotice.description'
content = content.replace(/newNotice\.content/g, "newNotice.description");

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Typescript errors fixed!");
