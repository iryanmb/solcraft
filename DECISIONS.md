# Decisions

Short log of choices that shape the project. Newest at the bottom.

## 2026-10-12: Project lives in `~/Desktop/Developer/solcraft`
- **Choice:** Moved the project out of `~/Documents/solcraft`.
- **Reason:** `~/Documents` was itself a Git repo (no commits) with personal files staged in it, so Solcraft was sitting inside it. iCloud "Desktop & Documents" sync was checked and is **off**, so Desktop is a safe local location.
- **Tradeoff:** If that iCloud sync is ever turned on, move the project to `~/Developer/solcraft` first. `node_modules` and `.git` shouldn't sync through iCloud.

## 2026-10-12: One Git repo per project; stray `~/Documents/.git` removed
- **Choice:** `git init` inside `solcraft/` only. The empty repo at `~/Documents/.git` was deleted after copying out 8 files that existed only in its staging area (to `~/Desktop/documents-git-rescue/`).
- **Reason:** A repo covering a whole personal folder could push private files (transcript, FAFSA, resumes) to GitHub by accident.
- **Tradeoff:** None for Solcraft. The rescued files now need a permanent home.

## 2026-10-12: Hand-written Next.js setup instead of `create-next-app`
- **Choice:** Wrote `package.json`, `tsconfig.json` and `app/` files by hand.
- **Reason:** The folder already had `CLAUDE.md` and `design/`, and the generator adds sample files and settings we'd delete. Writing the files by hand keeps every file understood.
- **Tradeoff:** No ESLint (code-style checker) yet. Add it when the codebase grows.

## 2026-10-12: Plain CSS with variables in one global stylesheet
- **Choice:** All design tokens (colors, fonts, radii, spacing, widths) are CSS variables in `app/globals.css`, with no Tailwind or UI library.
- **Reason:** Matches CLAUDE.md, has nothing extra to learn, and a token changes everywhere from one line.
- **Tradeoff:** One file will grow. Split it into per-component CSS Modules when it gets hard to read.

## 2026-10-12: Fonts via `next/font/google`
- **Choice:** Load Bricolage Grotesque (700/800) and DM Sans (400/500/700) with Next's built-in font loader.
- **Reason:** No extra package. Fonts are downloaded at build time and served from our own site, so there's no layout jump and visitors' browsers make no request to Google.
- **Tradeoff:** The build needs internet access to fetch the fonts.

## 2026-10-12: Sun outline stroke 3 by default
- **Choice:** `SunMark` uses stroke 3 (CLAUDE.md), with a `strokeWidth` prop.
- **Reason:** The mockups use 4–6 on small suns so the outline stays visible. The header sun (36px) uses 4.
- **Tradeoff:** Each small use has to pick its stroke.

## 2026-10-12: Keep Next's generated `AGENTS.md`
- **Choice:** Commit the `AGENTS.md` file that `next dev` writes.
- **Reason:** `next dev` re-creates it if deleted. It tells AI coding assistants to check the docs bundled with this Next version.
- **Tradeoff:** One file we didn't write ourselves.

## 2026-10-12: GitHub over SSH, merge instead of force-push
- **Choice:** Remote `origin` = `git@github.com:iryanmb/solcraft.git` (SSH). GitHub's auto-made README commit was merged in with `--allow-unrelated-histories`.
- **Reason:** The Mac's SSH key already works for `iryanmb`; the saved HTTPS password in Keychain is stale. Merging keeps both histories; force-pushing would delete a commit on GitHub.
- **Tradeoff:** One extra merge commit in the history.
