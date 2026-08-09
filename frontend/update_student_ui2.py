import re

file_path = 'C:/A/Development/AcroNexus/frontend/src/pages/EventsModule.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

with open('C:/Users/rajku/.gemini/antigravity-ide/brain/2097efe7-c054-4951-88bd-a8c5910019f6/scratch/student_attendance_tab.tsx', 'r', encoding='utf-8') as f:
    replacement = f.read()

pattern = re.compile(r'\{\s*studentEventTab === \'attendance\' && \(.*?\{\s*studentEventTab === \'notices\' && \(', re.DOTALL)
new_content = pattern.sub(replacement + '\n\n            {studentEventTab === \'notices\' && (', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

