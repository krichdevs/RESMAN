# RESMAN Phase 1 — Quick Test Guide

## 🎯 What to Test

### 1. Landing Page (`http://localhost:3000/`)
- [ ] Sticky header with logo and sign in/register buttons
- [ ] Three role-based cards (Student/Staff/Admin) visible
- [ ] Maintenance alerts section displays (if any)
- [ ] Public search form with date, capacity, equipment inputs
- [ ] Search button filters rooms (client-side mock data)
- [ ] Room status cards show occupancy and sparklines
- [ ] All buttons/links navigate correctly
- [ ] Mobile responsive (test on mobile view)

### 2. Admin Login Page (`http://localhost:3000/admin-login`)
- [ ] Purple-themed admin interface
- [ ] Admin portal title and shield icon
- [ ] Email and password input fields
- [ ] Password visibility toggle button
- [ ] "Sign In as Administrator" button
- [ ] Demo credentials section visible
- [ ] "Regular Login" link available
- [ ] Form submission (with valid admin credentials from seed)

### 3. Admin Dashboard (`http://localhost:3000/admin/dashboard` after admin login)
- [ ] Welcome message with admin name
- [ ] Six metrics cards displaying (Users, Bookings, Rooms, Approvals, Maintenance, Health)
- [ ] Management Actions section with three clickable items
- [ ] Recent Activity feed showing 4 items with timestamps
- [ ] System Status panel showing database/API/Socket.IO status
- [ ] All cards styled with appropriate colors

### 4. Room Calendar Component
- [ ] Can be viewed in BookingPage or standalone
- [ ] Date navigation (prev/next day buttons work)
- [ ] Time slots displayed from 8 AM to 6 PM
- [ ] Color coding: Green (available), Red (booked), Yellow (maintenance)
- [ ] Slot selection highlighting (click a slot to select)
- [ ] Summary stats at top (correct counts)
- [ ] Legend at bottom showing color meanings

### 5. Room Details Modal
- [ ] Click on a room to open modal
- [ ] Shows room name, building, floor
- [ ] Displays capacity with user icon
- [ ] Shows equipment list (if any)
- [ ] "Book Now" and "Close" buttons visible
- [ ] Close button dismisses modal
- [ ] Modal has backdrop that closes on click

---

## 🔄 Test User Flows

### Flow 1: Public Room Search
1. Go to `http://localhost:3000/`
2. Fill in date (today or tomorrow)
3. Fill in capacity (e.g., 30)
4. Leave equipment empty (or type something)
5. Click "Search availability"
6. Verify results appear below
7. Click "Book Now" on any room
8. Should redirect to login/register

### Flow 2: Admin Access
1. Go to `http://localhost:3000/`
2. Click "Admin Login" button
3. Enter admin credentials (from database seed)
4. Click "Sign In as Administrator"
5. Should redirect to `/admin/dashboard`
6. Verify admin dashboard loads with stats

### Flow 3: Non-Admin Admin Login Attempt
1. Go to `http://localhost:3000/admin-login`
2. Enter student/lecturer credentials
3. Click login
4. Should show error: "This page is for administrators only"
5. Show option to switch to regular login

---

## 📋 Testing Checklist

### Visual Tests
- [ ] All text renders clearly
- [ ] Colors match design (red, purple, green)
- [ ] Spacing/padding looks consistent
- [ ] Icons load correctly (lucide-react)
- [ ] Responsive on mobile (< 640px width)
- [ ] Responsive on tablet (640-1024px)
- [ ] Responsive on desktop (> 1024px)

### Functional Tests
- [ ] All buttons are clickable
- [ ] Links navigate to correct routes
- [ ] Form inputs accept text/dates
- [ ] Search filters work (client-side)
- [ ] Modal opens and closes
- [ ] Calendar date navigation works
- [ ] No console errors
- [ ] No broken imports

### Navigation Tests
- [ ] Logo/buttons on landing page work
- [ ] Admin login button goes to admin-login page
- [ ] Student login button goes to login page
- [ ] After login, redirects to dashboard
- [ ] After admin login, redirects to admin/dashboard
- [ ] Logout works (if implemented)

### API Connection Tests
- [ ] Room occupancy data loads
- [ ] No 404 errors in network tab
- [ ] Real data displays (not mock)
- [ ] Search hits API endpoint
- [ ] Admin stats load from API

---

## 🐛 Common Issues & Fixes

### Issue: Search returns no results
- **Cause**: Mock data generation
- **Fix**: Check browser console for errors, verify occupancy API endpoint exists

### Issue: Admin login says "access denied"
- **Cause**: User role is not 'ADMIN'
- **Fix**: Verify seed data has admin user, check role in database

### Issue: Calendar won't navigate to next day
- **Cause**: Date state not updating
- **Fix**: Check useEffect dependencies, verify date logic

### Issue: Responsive design broken on mobile
- **Cause**: Fixed widths or missing responsive classes
- **Fix**: Use Tailwind responsive modifiers (sm:, md:, lg:)

### Issue: Icons not showing
- **Cause**: lucide-react not installed or imported
- **Fix**: Run `npm install lucide-react`, verify imports

---

## 🎬 Demo Credentials (from seed.ts)

```
Admin:
- Email: admin@centraluniversity.edu
- Password: (check prisma/seed.ts for default password)

Student Example:
- Email: student@centraluniversity.edu
- Password: (check seed)

Lecturer Example:
- Email: lecturer@centraluniversity.edu
- Password: (check seed)
```

---

## 📸 Screenshots to Take

1. Landing page showing all three role cards
2. Admin dashboard with metrics
3. Room details modal popup
4. Calendar with colored time slots
5. Mobile view of landing page
6. Search results display

---

## 🚀 Performance Notes

- Landing page should load in < 2 seconds
- Admin dashboard should load in < 1 second
- No unnecessary re-renders (check React DevTools)
- Images/icons load instantly (SVG/inline)
- Smooth transitions on interactions

---

**Last Updated**: January 11, 2026
**Frontend Version**: React + Vite + TypeScript
