function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;
}
function doTimesOverlap(a, b) {
  const s1 = timeToMinutes(a.startTime);
  const e1 = timeToMinutes(a.endTime);
  const s2 = timeToMinutes(b.startTime);
  const e2 = timeToMinutes(b.endTime);
  return s1 < e2 && s2 < e1;
}
function isValidTimeRange(s, e) { return timeToMinutes(s) < timeToMinutes(e); }
function findConflictingBookings(newBooking, existingBookings) {
  return existingBookings.filter(existing => {
    if (existing.roomId !== newBooking.roomId) return false;
    const nd = new Date(newBooking.date).toDateString();
    const ed = new Date(existing.date).toDateString();
    if (nd !== ed) return false;
    return doTimesOverlap({ startTime: newBooking.startTime, endTime: newBooking.endTime }, { startTime: existing.startTime, endTime: existing.endTime });
  });
}
function getAvailableSlots(existingBookings, businessStart='08:00', businessEnd='20:00', slotDuration=90) {
  const avail=[];
  const startM=timeToMinutes(businessStart);
  const endM=timeToMinutes(businessEnd);
  const sorted = [...existingBookings].sort((a,b)=>timeToMinutes(a.startTime)-timeToMinutes(b.startTime));
  let current = startM;
  for(const b of sorted){
    const bs=timeToMinutes(b.startTime);
    const be=timeToMinutes(b.endTime);
    if (current + slotDuration <= bs){
      while(current + slotDuration <= bs){
        avail.push({startTime:minutesToTime(current), endTime:minutesToTime(current+slotDuration)});
        current += slotDuration;
      }
    }
    current = Math.max(current, be);
  }
  while(current + slotDuration <= endM){
    avail.push({startTime:minutesToTime(current), endTime:minutesToTime(current+slotDuration)});
    current += slotDuration;
  }
  return avail;
}

// Run a few checks and print results
console.log('timeToMinutes 12:30 =>', timeToMinutes('12:30'));
console.log('minutesToTime 750 =>', minutesToTime(750));
console.log('doTimesOverlap (09:00-11:00) vs (10:00-12:00) =>', doTimesOverlap({startTime:'09:00', endTime:'11:00'},{startTime:'10:00', endTime:'12:00'}));
console.log('isValidTimeRange 10:00-09:00 =>', isValidTimeRange('10:00','09:00'));

const existing=[{roomId:'r1',date:new Date('2024-01-15'),startTime:'09:00',endTime:'10:30'},{roomId:'r1',date:new Date('2024-01-15'),startTime:'14:00',endTime:'15:30'},{roomId:'r2',date:new Date('2024-01-15'),startTime:'09:00',endTime:'10:30'}];
const newBooking={roomId:'r1',date:new Date('2024-01-15'),startTime:'09:30',endTime:'11:00'};
console.log('findConflictingBookings =>', findConflictingBookings(newBooking, existing));
console.log('getAvailableSlots no bookings =>', getAvailableSlots([], '08:00', '12:00', 60));
console.log('getAvailableSlots with bookings =>', getAvailableSlots([{startTime:'09:00',endTime:'10:00'},{startTime:'11:00',endTime:'12:00'}],'08:00','13:00',60));
console.log('Done');
