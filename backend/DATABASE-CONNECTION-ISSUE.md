# Database Connection Issue - Troubleshooting Guide

## Problem
The backend cannot connect to Supabase PostgreSQL database due to DNS resolution failure:
```
Error: getaddrinfo ENOTFOUND db.cywtgpuxslrikoshekgf.supabase.co
```

## Root Cause
Your system's DNS cannot resolve the Supabase hostname `db.cywtgpuxslrikoshekgf.supabase.co`.

## Possible Solutions

### Solution 1: Check Your Internet Connection
1. Make sure you have a stable internet connection
2. Try accessing https://supabase.com in your browser
3. Check if you're behind a corporate firewall or VPN

### Solution 2: Flush DNS Cache
```powershell
# Run in PowerShell as Administrator
ipconfig /flushdns
```

### Solution 3: Change DNS Servers
Try using Google DNS or Cloudflare DNS:

**Google DNS:**
- Primary: 8.8.8.8
- Secondary: 8.8.4.4

**Cloudflare DNS:**
- Primary: 1.1.1.1
- Secondary: 1.0.0.1

**To change DNS in Windows:**
1. Open Network Connections
2. Right-click your network adapter → Properties
3. Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties
4. Select "Use the following DNS server addresses"
5. Enter the DNS addresses above
6. Click OK and restart your network connection

### Solution 4: Check Firewall/Antivirus
1. Temporarily disable your firewall/antivirus
2. Try connecting again
3. If it works, add an exception for Node.js

### Solution 5: Use Supabase Connection Pooler
Try using port 6543 instead of 5432 in `.env`:
```env
DB_PORT=6543
```

### Solution 6: Check Supabase Project Status
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Check if your project is active and running
3. Verify the connection details are correct

### Solution 7: Test Connection from Supabase Dashboard
1. Go to Supabase Dashboard → Project Settings → Database
2. Copy the connection string
3. Verify the hostname matches: `db.cywtgpuxslrikoshekgf.supabase.co`

### Solution 8: Use Direct Connection String
In your Supabase dashboard, get the "Direct Connection" string (not pooler) and update `.env`:
```env
DATABASE_URL=postgresql://postgres:mk12@MK1221@db.cywtgpuxslrikoshekgf.supabase.co:5432/postgres
```

### Solution 9: Check if IPv6 is the Issue
Your system resolved to an IPv6 address. Try disabling IPv6:
1. Open Network Connections
2. Right-click your adapter → Properties
3. Uncheck "Internet Protocol Version 6 (TCP/IPv6)"
4. Click OK and restart

### Solution 10: Use a VPN
If you're in a region with restricted access, try using a VPN.

## Testing the Connection

After trying any solution, test with:
```bash
cd backend
node test-db-connection.js
```

If you see "✅ Successfully connected to Supabase!", the issue is resolved!

## Alternative: Use Local PostgreSQL
If you cannot resolve the Supabase connection issue, you can:
1. Install PostgreSQL locally
2. Update `.env` to use localhost:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nejah_db
```

## Need More Help?
1. Check Supabase status: https://status.supabase.com/
2. Contact Supabase support
3. Check your network administrator if on corporate network
