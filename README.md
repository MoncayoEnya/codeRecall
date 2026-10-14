# Code Recall

A study app for the BSCS skills test on **November 10, 2026**. Built with React Native + Expo.

- **Plan** – 27 daily tasks (Oct 14 → Nov 9) built around the CRUD skills test: C# basics → CRUD on a list → database CRUD → timed builds
- **Learn** – 21 topics in a path from Beginner → Intermediate → Advanced (database CRUD) → Extra (algorithms), in the same order as the plan. Mark topics as learned; the app shows what's up next. Each topic has *when to use it*, *watch out*, and the code in C#, Python, Java, C++ or JavaScript (plus SQL).
  CRUD cards: CRUD on a list, SQL INSERT/SELECT/UPDATE/DELETE, CRUD with a database (parameterized queries), C# WinForms grid + selected row, input validation
- **Explain any line** – tap a line of code on any topic to see what it does in plain English, or press *Walk me through it* to go line by line. Works offline; *Ask AI* gives more detail when you have a key.
- **Full program** – every topic can switch from *Just the idea* to the *Full program*: the using lines, namespace, class and Main (or the whole Form1 for WinForms), plus step-by-step how to create and run it in Visual Studio.
- **Live coach** – while you type in Type it or Write from scratch, the coach explains the line you're on, including lines you write yourself.
- **Practice** – Type it (copy + memory mode), Fill the blanks, Predict the output, Write from scratch (line-by-line check), Bug hunt (tap the broken line), Review (your mistakes come back after 1, 3 and 7 days)
- **Build** – 5 timed CRUD scenarios with the checker's checklist and saved scores, plus a Setup sheet: first-15-minutes routine, NuGet + connection strings, the full WinForms CRUD form, and 14 common errors with fixes
- **Daily reminders** – pick a time on the Plan tab; each notification names that day's task (phone only)
- **AI-made practice** – Predict the output, Bug hunt, Write from scratch and Build scenarios can make brand-new items every time, aimed at today's topic and the things you got wrong. Switch between *New from AI* and *Built-in set* at the top of each drill. AI items you miss go into Review like any other.
- **Tutor** – Claude, set up to give hints before answers

The tutor and AI-made practice need your own Anthropic API key (Settings). Everything else, including the built-in sets, works offline without a key.

Light and dark mode follow your device, or pick one in Settings (gear icon on Today). Progress is saved on the device you use. The API key is kept in the phone's secure storage.

## Run it in your browser (fastest)

```bash
npm install
npm run dev
```

It opens at http://localhost:8081. Progress is saved in that browser.

## Put it online with Vercel (free)

The project already has a `vercel.json`, so Vercel knows how to build it.

**Option A: from GitHub (updates automatically)**
1. Create a new repository on GitHub and push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Code Recall"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/code-recall.git
   git push -u origin main
   ```
2. Go to vercel.com, sign in with GitHub, choose **Add New → Project**, and import `code-recall`.
3. Leave every setting as it is and press **Deploy**. You get a link like `code-recall.vercel.app`.

Every time you push to GitHub, Vercel rebuilds the site.

**Option B: from your terminal (no GitHub)**
```bash
npx vercel
```
Log in when asked, accept the defaults, then run `npx vercel --prod` for the final link.

Notes:
- Anyone with the link can open the app, but nobody can see your progress or your API key. Both stay in each person's own browser.
- On the website, the AI features use the key saved in that browser. Don't put your key in the code or in Vercel settings.
- Daily reminders are phone-only; the website doesn't send them.

## Run it on your phone (5 minutes)

1. Install **Node.js LTS** on your laptop: https://nodejs.org
2. Install **Expo Go** on your phone (Play Store / App Store).
3. Unzip this folder, open a terminal inside it, and run:

   ```bash
   npm install
   npx expo start
   ```

4. Scan the QR code:
   - Android: open Expo Go → *Scan QR code*
   - iPhone: open the Camera app and point it at the QR code

   Your phone and laptop must be on the same Wi-Fi. If school Wi-Fi blocks it, run `npx expo start --tunnel` instead.

Daily reminders may be limited inside Expo Go. They work fully in the APK build below.

If Expo Go says the project needs a newer or older SDK, update Expo Go from the store. The project uses Expo SDK 57.

## Turn it into an APK you can install (Android)

```bash
npm install -g eas-cli
eas login            # free Expo account
eas build -p android --profile preview
```

When the cloud build finishes, EAS gives you a link. Open it on your phone, download the `.apk` and install it. You may need to allow "Install unknown apps" for your browser.

## Set up the AI tutor (optional)

The tutor calls the Anthropic API directly from the app. That is billed separately from a Claude Pro/Max subscription.

1. Go to https://console.anthropic.com and sign in.
2. Add a small amount of credit under **Billing** (a few dollars lasts a long time with Haiku).
3. Create a key under **API Keys**.
4. In the app, open **Tutor** and paste the key. Pick **Haiku** (cheapest) or **Sonnet** (smarter) under **Settings**.

Everything except the tutor works offline and without a key.

Keep your key private: don't commit it to GitHub, and don't send an APK with your key in it to classmates (the key is not inside the APK — each person pastes their own).

## Project layout

```
App.js                         tabs (bottom bar on phones, sidebar on wide screens), back stacks, fonts
src/theme.js                   design tokens: colors (light + dark), type scale, spacing; theme setting
src/components/ui.js           shared components: text, buttons, rows, lists, callouts, code blocks
src/plan.js                    study-plan helpers (today, days left, done ticks)
src/data.js                    concept cards, 27-day plan, quiz questions  <- edit content here
src/csharp.js                  C# code, CRUD cards, full form template, C#/CRUD quiz
src/drills.js                  Write-from-scratch tasks and Bug hunt snippets
src/build.js                   Build scenarios, grader checklist, setup sheet, error fixes
src/explain.js                 offline plain-English explanation for a line of code
src/program.js                 wraps a snippet into a full runnable program + how to run it
src/components/ExplainCode.js  tap-to-explain code block, walkthrough, live coach
src/ai.js                      Claude calls + generators for questions, bugs, tasks, scenarios
src/review.js                  mistake notebook (spaced review)
src/reminders.native.js        daily notifications
src/screens/TodayScreen.js     home: 27-day track, today's task, reviews due, this week
src/screens/PlanScreen.js      full plan
src/screens/SettingsScreen.js  appearance, code language, reminders, tutor key
src/screens/LearnScreen.js     topic list + topic page
src/screens/PracticeScreen.js  practice hub, typing, blanks, predict, review
src/screens/DrillGames.js      write from scratch, bug hunt
src/screens/AiSource.js        New from AI / Built-in switch, loading and error states
src/screens/BuildScreen.js     timed builds, scenario + timer + checklist, setup sheet
src/screens/TutorScreen.js     Claude chat
```

### Add your own concept or question

Open `src/data.js`:

- Add a card to `BASE` (or `CRUD_CONCEPTS` in `src/csharp.js`) with `id`, `group`, `title`, `use`, `warn`, and `code: { cs, py, java, cpp, js }`.
  Any missing language falls back to C#.
  It automatically appears in Concepts, Type it and Fill the blanks.
- Add a question to `QUIZ` with `l` (language), `q`, `code`, `opts` and `a` (index of the right option, usually 0 — options are shuffled).

Writing these yourself is good practice for the test too.
