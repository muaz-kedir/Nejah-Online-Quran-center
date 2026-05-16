# Dashboard Layout System - Complete Guide

## Overview

Modern, reusable dashboard layout system for Nejah Online Quran & Islamic Center with role-based navigation and premium Islamic admin design.

## Features

✅ **Modern Islamic Design**
- Dark emerald green sidebar
- Clean white content area
- Premium card designs
- Elegant spacing and typography
- Professional SaaS admin feel

✅ **Role-Based System**
- SUPER_ADMIN - Full system access
- ADMIN - Limited management
- TEACHER - Teaching tools
- STUDENT - Learning dashboard
- PARENT - Child monitoring

✅ **Responsive Design**
- Mobile-first approach
- Collapsible sidebar
- Touch-friendly navigation
- Tablet optimized

✅ **Reusable Components**
- DashboardLayout
- Sidebar with role-based menus
- Topbar with search & notifications
- Dashboard cards
- Data tables
- Staff overview
- System alerts

## Components Created

### Layout Components

```
frontend/src/components/dashboard/
├── DashboardLayout.tsx       - Main layout wrapper
├── Sidebar.tsx               - Role-based navigation
├── Topbar.tsx                - Search, notifications, profile
├── Breadcrumbs.tsx           - Navigation breadcrumbs
├── menuConfig.ts             - Role-based menu configuration
├── DashboardCards.tsx        - Analytics stat cards
├── RecentStudentsTable.tsx   - Student data table
├── StaffOverview.tsx         - Staff list panel
├── TodaysClasses.tsx         - Class schedule cards
└── SystemAlerts.tsx          - Notification panel
```

### Pages

```
frontend/src/routes/
├── dashboard.tsx             - Main dashboard page
└── users.tsx                 - User management (updated)
```

## Usage

### Basic Dashboard Page

```tsx
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function MyPage() {
  return (
    <DashboardLayout>
      <h1>My Page Content</h1>
      {/* Your content here */}
    </DashboardLayout>
  );
}
```

### With Breadcrumbs

```tsx
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';

export default function MyPage() {
  return (
    <DashboardLayout>
      <Breadcrumbs />
      <h1>My Page Content</h1>
    </DashboardLayout>
  );
}
```

### Using Dashboard Components

```tsx
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { RecentStudentsTable } from '@/components/dashboard/RecentStudentsTable';

export default function MyDashboard() {
  return (
    <DashboardLayout>
      <DashboardCards />
      <RecentStudentsTable />
    </DashboardLayout>
  );
}
```

## Role-Based Navigation

### Menu Configuration

The sidebar menu automatically changes based on user role stored in `localStorage`:

```typescript
// Set user role
localStorage.setItem('userRole', 'super_admin');
localStorage.setItem('userName', 'Admin User');
```

### Available Roles

**SUPER_ADMIN Menu:**
- Dashboard
- Admins
- Teachers
- Students
- Parents
- Attendance
- Quran Progress
- Homework
- Schedules
- Reports
- Analytics
- Messages
- System Settings

**ADMIN Menu:**
- Dashboard
- Teachers
- Students
- Parents
- Attendance
- Reports
- Messages
- Settings

**TEACHER Menu:**
- Dashboard
- My Students
- Attendance
- Homework
- Quran Progress
- Messages
- Schedule

**STUDENT Menu:**
- Dashboard
- My Progress
- Homework
- Attendance
- Schedule
- Messages

**PARENT Menu:**
- Dashboard
- Child Progress
- Attendance
- Messages
- Reports

## Sidebar Features

### Active Route Highlighting

The sidebar automatically highlights the active route based on current URL:

```tsx
// Active route gets emerald background
className="bg-emerald-800 text-white shadow-lg"
```

### Mobile Responsive

- Sidebar collapses on mobile
- Overlay backdrop on mobile
- Smooth slide animations
- Touch-friendly menu items

### Collapsible

```tsx
const [sidebarOpen, setSidebarOpen] = useState(true);

// Toggle sidebar
<Button onClick={() => setSidebarOpen(!sidebarOpen)}>
  Toggle Menu
</Button>
```

## Topbar Features

### Search Bar

Large, prominent search bar matching reference design:

```tsx
<Input
  type="text"
  placeholder="Search across console..."
  className="pl-10 bg-gray-50"
/>
```

### Notifications

Dropdown with notification count badge:

```tsx
<Bell className="h-5 w-5" />
{notifications > 0 && (
  <Badge className="absolute -top-1 -right-1">
    {notifications}
  </Badge>
)}
```

### User Profile Dropdown

- User avatar with initials
- User name and role
- Profile link
- Settings link
- Logout button

## Dashboard Components

### Analytics Cards

Four stat cards with icons and trends:

```tsx
<DashboardCards />
```

Features:
- Total Students (with trend)
- Total Teachers
- Active Classes
- Attendance Rate
- Color-coded borders
- Icon backgrounds
- Hover effects

### Recent Students Table

Professional data table:

```tsx
<RecentStudentsTable />
```

Features:
- Student avatars
- Enrollment dates
- Primary courses
- Status badges
- Hover effects

### Staff Overview

Staff member list with status indicators:

```tsx
<StaffOverview />
```

Features:
- Staff avatars
- Role labels
- Online status dots
- Manage button

### Today's Classes

Class schedule cards:

```tsx
<TodaysClasses />
```

Features:
- Class titles
- Teacher info
- Time slots
- Category badges
- Navigation arrows

### System Alerts

Notification panel:

```tsx
<SystemAlerts />
```

Features:
- Alert types (error, success, info)
- Color-coded borders
- Alert icons
- Timestamps
- View all button

## Styling

### Color Scheme

**Primary Colors:**
- Emerald 900-950: Sidebar background
- Emerald 600: Primary actions
- Emerald 800: Active states
- Gray 50: Content background
- White: Cards and panels

**Status Colors:**
- Green: Success, active
- Red: Error, critical
- Yellow: Warning, pending
- Blue: Info
- Orange: Categories

### Typography

**Headings:**
- 4xl (36px): Page titles
- 3xl (30px): Section titles
- xl (20px): Card titles
- lg (18px): Subsections

**Body:**
- Base (16px): Regular text
- sm (14px): Secondary text
- xs (12px): Labels, captions

### Spacing

**Consistent spacing:**
- p-6: Card padding
- gap-6: Grid gaps
- mb-8: Section margins
- space-y-4: Vertical spacing

## Responsive Breakpoints

```css
sm: 640px   - Small devices
md: 768px   - Tablets
lg: 1024px  - Desktops
xl: 1280px  - Large screens
```

### Mobile (<768px)
- Sidebar collapses
- Single column layout
- Stacked cards
- Hamburger menu

### Tablet (768px-1024px)
- 2-column grid
- Visible sidebar
- Compact spacing

### Desktop (>1024px)
- 3-column grid
- Full sidebar
- Optimal spacing

## Customization

### Adding New Menu Items

Edit `menuConfig.ts`:

```typescript
export const menuByRole: Record<string, MenuItem[]> = {
  super_admin: [
    // Add new item
    { 
      label: 'New Feature', 
      icon: Star, 
      path: '/new-feature' 
    },
  ],
};
```

### Custom Dashboard Cards

Create new stat card:

```tsx
<StatCard
  title="Custom Metric"
  value="123"
  icon={<Icon className="h-6 w-6" />}
  borderColor="border-purple-500"
  iconBg="bg-purple-50"
/>
```

### Theme Customization

Update Tailwind config for custom colors:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f0fdf4',
        // ... your colors
      }
    }
  }
}
```

## Best Practices

### Layout Usage

✅ **DO:**
- Wrap all dashboard pages with `<DashboardLayout>`
- Use breadcrumbs for navigation context
- Keep consistent spacing
- Use provided components

❌ **DON'T:**
- Create custom layouts for dashboard pages
- Mix different spacing patterns
- Override core layout styles
- Duplicate components

### Performance

- Components are optimized for re-renders
- Sidebar state managed efficiently
- Lazy load heavy components
- Use React.memo for static components

### Accessibility

- Keyboard navigation supported
- ARIA labels on interactive elements
- Focus indicators visible
- Screen reader friendly

## Testing

### Test User Roles

```typescript
// Test as SUPER_ADMIN
localStorage.setItem('userRole', 'super_admin');
localStorage.setItem('userName', 'Super Admin');

// Test as TEACHER
localStorage.setItem('userRole', 'teacher');
localStorage.setItem('userName', 'Teacher Name');
```

### Test Responsive

1. Open browser dev tools
2. Toggle device toolbar
3. Test mobile, tablet, desktop
4. Verify sidebar behavior
5. Check touch interactions

## Troubleshooting

### Sidebar Not Showing

**Check:**
1. User role is set in localStorage
2. Menu config has items for that role
3. DashboardLayout is wrapping content

### Menu Not Highlighting

**Check:**
1. Route paths match menu config
2. React Router is configured
3. useLocation hook is working

### Styling Issues

**Check:**
1. Tailwind CSS is configured
2. shadcn/ui components installed
3. CSS imports in main file

## Next Steps

### Recommended Enhancements

1. **Add More Dashboards**
   - Teacher-specific dashboard
   - Student progress dashboard
   - Parent monitoring dashboard

2. **Enhanced Features**
   - Dark mode toggle
   - Customizable widgets
   - Drag-and-drop dashboard
   - Real-time updates

3. **Additional Components**
   - Calendar widget
   - Chat widget
   - Progress charts
   - Activity feed

4. **Performance**
   - Add loading skeletons
   - Implement virtual scrolling
   - Optimize images
   - Add caching

## Support

For issues or questions:
1. Check this guide
2. Review component code
3. Test with different roles
4. Verify localStorage values

---

**Built for Nejah Online Quran & Islamic Center**
**Status: ✅ PRODUCTION-READY**
