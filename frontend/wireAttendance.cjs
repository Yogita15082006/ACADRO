const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'EventsModule.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add attendanceSessions state
content = content.replace(
  `const [notices, setNotices] = useState<any[]>([]);`,
  `const [notices, setNotices] = useState<any[]>([]);\n  const [attendanceSessions, setAttendanceSessions] = useState<any[]>([]);\n  const [activeSession, setActiveSession] = useState<any>(null);`
);

// 2. Fetch attendanceSessions
content = content.replace(
  `// Add getAttendanceSessions here later`,
  `eventService.getAttendanceSessions(eventId).then(res => {
      if(res.success) {
        setAttendanceSessions(res.data);
        if(res.data.length > 0) setActiveSession(res.data[0]);
      }
    });`
);

// 3. Admin Generate Code
content = content.replace(
  `<Button size="lg" className="text-lg px-8 py-6 rounded-2xl shadow-lg shadow-primary/20 bg-primary text-white w-full max-w-sm font-black">\n                      Generate Attendance Code\n                    </Button>`,
  `<Button size="lg" className="text-lg px-8 py-6 rounded-2xl shadow-lg shadow-primary/20 bg-primary text-white w-full max-w-sm font-black" onClick={() => {
    if(activeSession) {
      eventService.generateAttendanceCode(activeSession.id).then(() => fetchEventDetails(selectedEvent.id));
    }
  }}>\n                      Generate Attendance Code\n                    </Button>`
);

// 4. Admin active code display
content = content.replace(
  `{attendanceCode && (`,
  `{activeSession && activeSession.attendanceCode && (`
);

content = content.replace(
  `<p className="text-4xl font-black text-primary tracking-[0.5em]">{attendanceCode}</p>`,
  `<p className="text-4xl font-black text-primary tracking-[0.5em]">{activeSession.attendanceCode}</p>`
);

// 5. Student Submit Attendance
content = content.replace(
  `<Button className="w-full py-7 rounded-2xl text-xl font-black bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 transition-all" onClick={() => setIsAttendanceSubmitted(true)}>Submit Attendance</Button>`,
  `<Button className="w-full py-7 rounded-2xl text-xl font-black bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 transition-all" onClick={async () => {
    if(!activeSession) return toast.error("No active session");
    try {
      const res = await eventService.submitAttendance(activeSession.id, attendanceCode, 1);
      if(res.success) {
        setIsAttendanceSubmitted(true);
        toast.success("Attendance Submitted!");
      }
    } catch(e: any) {
      toast.error(e.response?.data?.message || "Failed to submit attendance");
    }
  }}>Submit Attendance</Button>`
);

content = content.replace(
  `const [attendanceCode, _setAttendanceCode] = useState('');`,
  `const [attendanceCode, setAttendanceCode] = useState('');`
);

content = content.replace(
  `<input type="text" placeholder="ENTER 6-DIGIT CODE" className="w-full p-5 text-center text-3xl font-black tracking-[0.5em] border-2 border-border rounded-2xl bg-background focus:border-primary focus:ring-4 focus:ring-primary/20 uppercase transition-all shadow-inner" maxLength={6} />`,
  `<input type="text" placeholder="ENTER 6-DIGIT CODE" className="w-full p-5 text-center text-3xl font-black tracking-[0.5em] border-2 border-border rounded-2xl bg-background focus:border-primary focus:ring-4 focus:ring-primary/20 uppercase transition-all shadow-inner" maxLength={6} value={attendanceCode} onChange={(e) => setAttendanceCode(e.target.value.toUpperCase())} />`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Replaced successfully!");
