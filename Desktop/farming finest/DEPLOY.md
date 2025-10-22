This repository contains two parts:

- frontend/ — static app (HTML/CSS/JS). Deploy to Vercel.
- backend/ — Node/Express API. Host on a server (Heroku, Render, Railway) or in a container.

Frontend (Vercel):
1. Connect the GitHub repo to Vercel and set the root directory to `frontend`.
2. Set build command: `npm run build` (if using a bundler) or leave default for static.
3. Set output directory to `public` or the build folder your frontend uses.

Backend (production suggestions):
- Use Render or Railway for easy deployment with environment variables.
- Add the following secrets to the hosting provider: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`.

CI:
- GitHub Actions workflow `/.github/workflows/ci.yml` will run basic build steps on push to `main`.

If you want, I can try adding the Git remote and pushing your current branch to the GitHub repo you provided. Note: push will require your GitHub credentials from the terminal.
