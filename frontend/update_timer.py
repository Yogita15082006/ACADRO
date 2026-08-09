import re

file_path = 'C:/A/Development/AcroNexus/frontend/src/pages/EventsModule.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

timer_effect = '''
  useEffect(() => {
    let interval: any;
    if (activeSession && activeSession.status === 'LIVE' && activeSession.sessionStartTime && activeSession.timerDurationMinutes) {
      interval = setInterval(() => {
        const start = new Date(activeSession.sessionStartTime).getTime();
        const durationMs = activeSession.timerDurationMinutes * 60 * 1000;
        const now = new Date().getTime();
        const elapsed = now - start;
        const remaining = durationMs - elapsed;
        
        if (remaining <= 0) {
          setTimeRemaining('00:00');
          clearInterval(interval);
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setTimeRemaining(\:\);
        }
      }, 1000);
    } else {
      setTimeRemaining(null);
    }
    return () => clearInterval(interval);
  }, [activeSession]);
'''

content = content.replace('useEffect(() => {\n    if (activeSession) {', timer_effect + '\n  useEffect(() => {\n    if (activeSession) {')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

