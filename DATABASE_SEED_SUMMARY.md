# Central University Miotso - RESMAN Database Seed Summary

## Campus Infrastructure

### Blocks & Classrooms (56 rooms)
- **Block A**: A101-A108 (8 classrooms, 40-50 capacity each)
- **Block B**: B101-B108 (8 classrooms, 40-50 capacity each)
- **Block C**: C101-C108 (8 classrooms, 40-50 capacity each)
- **Block D**: D101-D108 (8 classrooms, 40-50 capacity each)
- **Block E**: E101-E108 (8 classrooms, 40-50 capacity each)
- **Block F**: F101-F108 (8 classrooms, 40-50 capacity each)
- **Block G**: G101-G108 (8 classrooms, 40-50 capacity each)

### Libraries (2 facilities)
- **Main Library** (LIB-MAIN): 200 capacity
  - Ground Floor study area
  - Equipment: WiFi, reading tables, computers, AC
- **Reference Library** (LIB-REF): 100 capacity
  - First Floor specialized collections
  - Equipment: WiFi, reading tables, computers, AC

### Laboratories (3 facilities)
- **Computer Lab A** (LAB-COMP-A): 50 capacity
  - Ground Floor - Programming & Development
  - Equipment: Computers, networking equipment, projector, whiteboard, AC
- **Computer Lab B** (LAB-COMP-B): 50 capacity
  - First Floor - Networking & Systems
  - Equipment: Computers, networking equipment, projector, whiteboard, AC
- **Science Lab** (LAB-SCI): 40 capacity
  - Second Floor - Physics, Chemistry, Experiments
  - Equipment: Lab equipment, projector, whiteboard, AC, safety equipment

**Total: 61 learning spaces**

---

## User Accounts

### Admin (1)
- Email: `admin@miotso.centraluniversity.edu.gh`
- Password: `admin123`
- Full access to system administration

### Staff (3)
| Name | Email | Role | Department | Password |
|------|-------|------|------------|----------|
| Dr. Joseph Mensah | `dr.mensah@miotso.centraluniversity.edu.gh` | STAFF | Computer Science | `staff123` |
| Prof. Kwame Adjei | `prof.adjei@miotso.centraluniversity.edu.gh` | STAFF | Information Technology | `staff123` |
| Mr. David Boateng | `mr.boateng@miotso.centraluniversity.edu.gh` | STAFF | Software Engineering | `staff123` |

### Students (5 - Sample)
| Index Number | Name | Email | Department | Password |
|--------------|------|-------|------------|----------|
| INT/23/01/0001 | John Doe | `int/23/01/0001@student.centraluniversity.edu.gh` | CS | `student123` |
| INT/23/01/0002 | Jane Smith | `int/23/01/0002@student.centraluniversity.edu.gh` | IT | `student123` |
| INT/23/01/0003 | Michael Johnson | `int/23/01/0003@student.centraluniversity.edu.gh` | SE | `student123` |
| INT/23/01/0004 | Sarah Williams | `int/23/01/0004@student.centraluniversity.edu.gh` | CS | `student123` |
| INT/23/01/0005 | Emmanuel Owusu | `int/23/01/0005@student.centraluniversity.edu.gh` | IT | `student123` |

---

## Departments (10)
1. Computer Science (CS)
2. Information Technology (IT)
3. Software Engineering (SE)
4. Civil Engineering (CE)
5. Mechanical Engineering (ME)
6. Electrical & Electronic Engineering (EE)
7. Chemical Engineering (CHE)
8. Aerospace Engineering (AE)
9. Business Administration (BUS)
10. Accounting (ACC)

---

## Time Slots
**Operating Hours: Monday-Friday, 8:00 AM - 7:00 PM**

6 slots per room per day:
- 08:00 - 09:30 (Slot 1)
- 09:45 - 11:15 (Slot 2)
- 11:30 - 13:00 (Slot 3)
- 14:00 - 15:30 (Slot 4) - After lunch break
- 15:45 - 17:15 (Slot 5)
- 17:30 - 19:00 (Slot 6) - Evening sessions

**Total available slots per room per week: 30 (6 slots × 5 days)**
**Total available slots across all rooms per week: 1,830**

---

## Key Features Enabled
✅ Conflict-free booking (unique constraint on room/date/time)
✅ Real-time availability tracking
✅ Role-based access control (Admin, Staff, Student)
✅ Audit logging of all operations
✅ Room equipment tracking
✅ Capacity management
✅ Time slot management
✅ Multi-department support

---

## Testing Recommendations

### Quick Tests
1. **Admin Login**: `admin@miotso.centraluniversity.edu.gh` / `admin123`
2. **Staff Login**: `dr.mensah@miotso.centraluniversity.edu.gh` / `staff123`
3. **Student Login**: `int/23/01/0001@student.centraluniversity.edu.gh` / `student123`

### Booking Tests
- Try booking a room in Block A on Monday 08:00-09:30
- Verify duplicate booking is rejected
- Check room availability across different times
- Test staff vs student booking permissions

### Admin Tests
- View all bookings
- Check audit logs
- Manage room availability
- View room utilization reports

---

## Next Steps
1. Deploy to staging environment
2. Load real student data (if needed)
3. Configure email notifications
4. Set up backup procedures
5. Create admin onboarding guide
6. Deploy to production

---

**Seeding Date**: January 12, 2026  
**Database**: SQLite (dev.db)  
**Schema Version**: Latest Prisma schema
