# tripdiary (Next.js + Supabase)

A port of the PHP/MySQL tripdiary app. Stack: Next.js 14 (App Router) · Supabase (Postgres + Storage) · deploy on Vercel.

## 1. Supabase
1. Create a project at supabase.com.
2. SQL Editor → paste all of `supabase/schema.sql` → Run. (Creates tables, locks them with RLS, and makes the `uploads` image bucket.)
3. Project Settings → API: copy the **Project URL** and the **service_role** key.

## 2. Run locally
```bash
npm install
cp .env.example .env.local     # fill in the 3 values
npm run dev                    # http://localhost:3000
```

## 3. Create your first admin
```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 10))"
```
Then in the Supabase SQL Editor:
```sql
insert into admin (email, password) values ('you@example.com', 'PASTE_THE_HASH');
```
Log in at `/admin/login`.

## 4. Deploy on Vercel
1. Push this folder to a GitHub repo.
2. vercel.com → Add New → Project → import the repo (framework: Next.js, auto-detected).
3. Add Environment Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET` (any long random string).
4. Deploy.

## Notes
- The service-role key is used only on the server. Never put it in a `NEXT_PUBLIC_` variable.
- Passwords are bcrypt (PHP `password_hash` hashes also work, if you import old users).

## Not ported yet (from the PHP version)
Stickers and emoji pickers, photos in messages, admin photo hide/quarantine, admin add/edit student, profile views, and the theme switcher.
