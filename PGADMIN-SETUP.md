# pgAdmin Setup Guide

## ✅ PostgreSQL is Ready!

**Password has been set to: `postgres`**

## Add Server in pgAdmin

1. Open **pgAdmin**

2. Click **"Add New Server"** (or right-click "Servers" → "Register" → "Server")

3. **General Tab:**
   - Name: `Local PostgreSQL`

4. **Connection Tab:**
   - Host name/address: `127.0.0.1`
   - Port: `5432`
   - Maintenance database: `postgres`
   - Username: `postgres`
   - Password: `postgres`
   - ✅ Check "Save password?"

5. Click **"Save"**

6. The server should connect immediately!

7. Navigate to:
   - Servers → Local PostgreSQL → Databases → nejah_db → Schemas → public → Tables

## Your Database Tables

- **users** - User accounts
- **students** - Student records
- **teachers** - Teacher records  
- **parents** - Parent records

## View Data

Right-click any table → "View/Edit Data" → "All Rows"

---

**Backend API:** http://localhost:3000/api
**Database:** nejah_db
**Username:** postgres
**Password:** postgres
