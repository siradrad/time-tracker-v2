# Supabase CLI Linking Commands

## Prerequisites
- Supabase CLI installed ✅ (version 2.23.4)
- Database password: `xCobAWYGktH7Dccn`
- Project reference: `lyborpfxgfioavqutiap`

## Step 1: Login to Supabase
```bash
supabase login
# Press Enter when prompted to open browser
# Complete OAuth login in browser
```

## Step 2: Link Project
```bash
supabase link --project-ref lyborpfxgfioavqutiap
# When prompted for database password, enter: xCobAWYGktH7Dccn
```

## Step 3: Verify Link
```bash
supabase status
```

## Step 4: (Optional) Push Migration
```bash
supabase db push
```

## Expected Output After Successful Link:
```
✅ Linked to project: TimeTracker
✅ Connected to database
```

## Troubleshooting:
- If login fails: Check internet connection and try again
- If link fails: Verify project reference and password
- If push fails: Migration may already be applied (this is OK)

## Note:
The `manual` column migration is already applied in the database, so the push step is optional for verification purposes only. 