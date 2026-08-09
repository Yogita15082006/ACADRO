import re

file_path = 'C:/A/Development/AcroNexus/frontend/src/pages/EventsModule.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

modal = """
      {/* Start Attendance Modal */}
      <AnimatePresence>
      {showStartAttendanceModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card w-full max-w-xl rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-black mb-6">Start Event Attendance</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold block mb-2">Unique Code Count</label>
                  <input type="number" className="w-full p-4 border border-border rounded-xl bg-background font-bold text-lg" value={startAttendanceForm.uniqueCodeCount} onChange={e => setStartAttendanceForm({...startAttendanceForm, uniqueCodeCount: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-2">Timer Duration (Minutes)</label>
                  <input type="number" className="w-full p-4 border border-border rounded-xl bg-background font-bold text-lg" value={startAttendanceForm.timerDurationMinutes} onChange={e => setStartAttendanceForm({...startAttendanceForm, timerDurationMinutes: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-bold block mb-2">Half Type</label>
                <select className="w-full p-4 border border-border rounded-xl bg-background font-bold" value={startAttendanceForm.halfType} onChange={e => setStartAttendanceForm({...startAttendanceForm, halfType: e.target.value})}>
                  <option value="FIRST_HALF">First Half</option>
                  <option value="SECOND_HALF">Second Half</option>
                  <option value="FULL_DAY">Full Day</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold block mb-2">Selected Lectures (e.g. 1,2,3)</label>
                <input type="text" className="w-full p-4 border border-border rounded-xl bg-background font-medium" placeholder="1,2,3" value={startAttendanceForm.selectedLectures.join(',')} onChange={e => {
                  const arr = e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                  setStartAttendanceForm({...startAttendanceForm, selectedLectures: arr});
                }} />
              </div>

              <div className="flex items-center gap-3 bg-accent/50 p-4 rounded-xl border border-border">
                <input type="checkbox" id="incOverall" className="w-5 h-5" checked={startAttendanceForm.isIncludedInOverall} onChange={e => setStartAttendanceForm({...startAttendanceForm, isIncludedInOverall: e.target.checked})} />
                <label htmlFor="incOverall" className="font-bold text-sm">Include this attendance in student overall statistics</label>
              </div>

              <div>
                <label className="text-sm font-bold block mb-2">Custom Attendance Code (Optional)</label>
                <input type="text" className="w-full p-4 border border-border rounded-xl bg-background font-mono text-xl tracking-widest uppercase" placeholder="Leave empty to auto-generate" value={startAttendanceForm.attendanceCode} onChange={e => setStartAttendanceForm({...startAttendanceForm, attendanceCode: e.target.value.toUpperCase()})} />
              </div>

            </div>
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-border">
              <Button variant="outline" size="lg" className="font-bold rounded-xl px-6" onClick={() => setShowStartAttendanceModal(false)}>Cancel</Button>
              <Button size="lg" className="font-bold rounded-xl px-8 bg-primary hover:bg-primary/90 text-white" onClick={() => { 
                eventService.startAttendance(selectedEvent.id, {
                  uniqueCodeCount: startAttendanceForm.uniqueCodeCount,
                  timerDurationMinutes: startAttendanceForm.timerDurationMinutes,
                  halfType: startAttendanceForm.halfType,
                  selectedLectures: JSON.stringify(startAttendanceForm.selectedLectures),
                  isIncludedInOverall: startAttendanceForm.isIncludedInOverall,
                  attendanceCode: startAttendanceForm.attendanceCode
                }).then(res => {
                  if (res.success) {
                    toast.success("Attendance Live!");
                    setShowStartAttendanceModal(false);
                    fetchEventDetails(selectedEvent.id);
                  }
                });
              }}>Confirm & Start Attendance</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
"""

content = content.replace('        {/* Notice Modal */}', modal + '\n        {/* Notice Modal */}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

