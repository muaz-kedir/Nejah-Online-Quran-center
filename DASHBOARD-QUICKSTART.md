# 🚀 Dashboard Quick Start

## Test the Dashboard in 3 Steps

### Step 1: Set User Info

Open browser console and run:

```javascript
localStorage.setItem('userRole', 'super_admin');
localStorage.setItem('userName', 'Super Administrator');
localStorage.setItem('token', 'your_jwt_token_here');
```

### Step 2: Navigate to Dashboard

```
http://localhost:8080/dashboard
```

### Step 3: Explore!

You should see:
- ✅ Dark green sidebar with menu
- ✅ Search bar at top
- ✅ User profile in top-right
- ✅ Analytics cards
- ✅ Recent students table
- ✅ Staff overview panel
- ✅ Today's classes
- ✅ System alerts

## Test Different Roles

### Test as SUPER_ADMIN

```javascript
localStorage.setItem('userRole', 'super_admin');
localStorage.setItem('userName', 'Super Admin');
location.reload();
```

**You'll see 13 menu items:**
Dashboard, Admins, Teachers, Students, Parents, Attendance, Quran Progress, Homework, Schedules, Reports, Analytics, Messages, System Settings

### Test as ADMIN

```javascript
localStorage.setItem('userRole', 'admin');
localStorage.setItem('userName', 'Admin User');
location.reload();
```

**You'll see 8 menu items:**
Dashboard, Teachers, Students, Parents, Attendance, Reports, Messages, Settings

### Test as TEACHER

```javascript
localStorage.setItem('userRole', 'teacher');
localStorage.setItem('userName', 'Teacher Name');
location.reload();
```

**You'll see 7 menu items:**
Dashboard, My Students, Attendance, Homework, Quran Progress, Messages, Schedule

### Test as STUDENT

```javascript
localStorage.setItem('userRole', 'student');
localStorage.setItem('userName', 'Student Name');
location.reload();
```

**You'll see 6 menu items:**
Dashboard, My Progress, Homework, Attendance, Schedule, Messages

### Test as PARENT

```javascript
localStorage.setItem('userRole', 'parent');
localStorage.setItem('userName', 'Parent Name');
location.reload();
```

**You'll see 5 menu items:**
Dashboard, Child Progress, Attendance, Messages, Reports

## Test Responsive Design

### Mobile View

1. Open browser dev tools (F12)
2. Click device toolbar icon
3. Select "iPhone 12 Pro" or similar
4. Refresh page
5. Click hamburger menu (☰)
6. Sidebar should slide in from left

### Tablet View

1. Select "iPad" or similar
2. Refresh page
3. Sidebar should be visible
4. Layout should be 2-column

### Desktop View

1. Select "Responsive" and set to 1920x1080
2. Refresh page
3. Full 3-column layout
4. All panels visible

## Test Features

### Test Sidebar

- ✅ Click menu items
- ✅ Active item highlights in emerald
- ✅ Hover effects work
- ✅ Icons display correctly

### Test Topbar

- ✅ Type in search bar
- ✅ Click notification bell
- ✅ Click user profile
- ✅ Dropdown menus work

### Test Dashboard Cards

- ✅ All 4 cards display
- ✅ Numbers show correctly
- ✅ Icons render
- ✅ Hover effects work

### Test Tables

- ✅ Recent students table loads
- ✅ Student avatars show
- ✅ Status badges display
- ✅ Hover effects work

### Test Panels

- ✅ Staff overview shows
- ✅ Today's classes display
- ✅ System alerts render
- ✅ All buttons work

## Create Your First Dashboard Page

### 1. Create New File

```bash
touch frontend/src/routes/my-page.tsx
```

### 2. Add This Code

```tsx
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';

export default function MyPage() {
  return (
    <DashboardLayout>
      <Breadcrumbs />
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          My Custom Page
        </h1>
        <p className="text-gray-600">
          This is my custom dashboard page!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-2">Card 1</h3>
          <p className="text-gray-600">Content here</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-2">Card 2</h3>
          <p className="text-gray-600">Content here</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-2">Card 3</h3>
          <p className="text-gray-600">Content here</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### 3. Add to Menu Config

Edit `frontend/src/components/dashboard/menuConfig.ts`:

```typescript
import { Star } from 'lucide-react';

export const menuByRole: Record<string, MenuItem[]> = {
  super_admin: [
    // ... existing items
    { label: 'My Page', icon: Star, path: '/my-page' },
  ],
};
```

### 4. Add Route

Edit your router configuration to add the route.

### 5. Test It!

Navigate to: `http://localhost:8080/my-page`

## Common Issues

### Sidebar Not Showing

**Fix:**
```javascript
// Make sure role is set
localStorage.setItem('userRole', 'super_admin');
location.reload();
```

### Menu Items Missing

**Fix:**
Check `menuConfig.ts` has items for your role.

### Styling Broken

**Fix:**
Make sure Tailwind CSS is configured and running.

### Components Not Found

**Fix:**
```bash
# Make sure all files are created
ls frontend/src/components/dashboard/
```

## Tips

### Use Dashboard Components

```tsx
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { RecentStudentsTable } from '@/components/dashboard/RecentStudentsTable';
import { StaffOverview } from '@/components/dashboard/StaffOverview';
import { TodaysClasses } from '@/components/dashboard/TodaysClasses';
import { SystemAlerts } from '@/components/dashboard/SystemAlerts';

// Use them in your page
<DashboardCards />
<RecentStudentsTable />
```

### Customize Colors

The dashboard uses emerald green. To change:

1. Edit Tailwind config
2. Replace `emerald` with your color
3. Update gradient classes

### Add Icons

```bash
# Lucide React icons are included
import { Star, Heart, Zap } from 'lucide-react';
```

## Next Steps

1. ✅ Test all roles
2. ✅ Test responsive design
3. ✅ Create custom pages
4. ✅ Add to menu config
5. ✅ Customize styling
6. ✅ Add real data
7. ✅ Deploy!

## Need Help?

- Check `DASHBOARD-LAYOUT-GUIDE.md` for full docs
- Check `DASHBOARD-SUMMARY.md` for overview
- Review component code
- Test with different roles

---

**You're all set! 🎉**

The dashboard is ready to use. Start building your pages!
