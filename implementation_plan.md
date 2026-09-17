# Implementation Plan - Memory Lane: Dementia Care & Memory Companion

Memory Lane is a local-first mobile application designed to support individuals living with dementia (Alzheimer's / cognitive impairment) and provide peace of mind to their family caregivers.

The app focuses on two core MVP pillars:
1. **Loved Ones & Memory Carousel**: A calming, high-contrast visual photo album of family, friends, pets, and milestone memories with names, relationships, and optional voice readouts.
2. **Voice-Guided Daily Reminders**: A scheduled routine assistant that announces essential daily tasks (medication, meals, hydration, calling loved ones) using clear, soothing English Text-to-Speech (TTS) and local notifications.

The app is architected to run **100% locally on-device** (offline-first, total privacy) and designed from day one with a unified codebase for seamless iOS deployment in the future, while adhering strictly to Google Play policies for a frictionless submission process.

---

## User Review Required

> [!IMPORTANT]
> **Recommended Framework: React Native with Expo (TypeScript)**
> - **Why Expo/React Native**: Allows 100% shared code for Android and future iOS deployment. It runs on the user's existing Node.js environment (`v22.17.0` + `npm 10.9.2`) without needing complex Android Studio/Flutter toolchain setup right away. Caregivers can preview and test instantly on their physical phone using the free Expo Go app.
> - **Offline & Local Storage**: Uses `expo-sqlite` and `expo-file-system` to keep all pictures, voice memos, and reminders strictly inside the device's sandboxed storage.
> - **Zero-Friction Google Play Submission**: Expo managed workflow automatically configures minimal Android permissions, avoiding risky Google Play permission rejections (`MANAGE_EXTERNAL_STORAGE`, `USE_EXACT_ALARM`, etc.).

---

## Google Play Store Submission Strategy (Least Friction)

To guarantee the fastest, hassle-free approval on Google Play, the app will adhere to the following strict compliance measures:

1. **Modern Photo Picker (Zero Storage Permissions)**:
   - Avoid legacy `READ_EXTERNAL_STORAGE` or `WRITE_EXTERNAL_STORAGE`.
   - Use the Android 13+ system Photo Picker (`expo-image-picker`), which requires **no storage permissions** at all because the OS securely passes chosen photos into the app sandbox.
2. **Safe Alarm & Notification Architecture**:
   - Google strictly restricts `USE_EXACT_ALARM` unless an app is exclusively an alarm clock or calendar. Asking for it leads to policy rejections.
   - We will use standard `POST_NOTIFICATIONS` (opt-in on Android 13+) combined with `expo-notifications` / Alarm scheduling using permissible scheduling channels.
3. **Privacy & Data Safety Form**:
   - Because all data is stored locally in SQLite and file storage on the user's device, the Google Play Data Safety declaration will be: **"No user data collected, transmitted, or shared with third parties"**. This is the highest trust rating and clears automated policy audits immediately.
4. **App Category & Medical Disclaimer Policy**:
   - Google enforces stringent rules on medical apps. Memory Lane will be positioned as a **"Caregiver Memory & Daily Routine Companion"** (Lifestyle / Family / Productivity category), explicitly including standard health disclaimers ("Memory Lane is an organizational aid and memory companion, not a clinical diagnostic or treatment tool").
5. **Dementia-Friendly UX Guidelines**:
   - Adheres to WCAG AA / AAA contrast standards, minimum touch targets of 56x56dp, simple language, no confusing popups or nested navigation, and an optional Caregiver PIN to prevent accidental deletion of reminders.

---

## Proposed Architecture & Features

### 1. Multi-Mode Interface: "Patient View", "Caregiver Mode" & "Digital Picture Frame Mode"
- **Patient View (Default / Main)**:
  - Ultra-clean, high-contrast, clutter-free screen locked in Portrait orientation to prevent disorientation from accidental tilts.
  - Shows current day of the week, date, and time of day (e.g. *"Today is Thursday, Morning"*).
  - Prominent interactive **Memory Carousel** (swipeable with large arrow buttons and voice narration).
  - Upcoming or active task card with a large **"Listen"** (TTS voice readout) and **"Done"** button.
  - Quick-launch button for **Digital Picture Frame Mode**.
- **Caregiver Settings (Discreet / Lockable)**:
  - Accessed via a gentle long-press or 4-digit PIN lock (`CaregiverLockModal`).
  - Caregivers can add/edit photos, write captions, assign relationships, set reminder times and frequencies, and test notifications/diagnostics.
- **Digital Picture Frame Mode (Ambient Tabletop / Bedside)**:
  - Ambient full-screen photo slideshow cycling through all memories with animated cross-fade.
  - Minimalist, distraction-free display: shows **only the picture title** on an elegant floating title card (omitting tags and descriptions).
  - **Always-On Screen**: Integrates `expo-keep-awake` to prevent screen sleep while running on a nightstand or desk dock.
  - **Dynamic Orientation**: Supports auto-rotation into landscape or portrait via `expo-screen-orientation` to fit horizontal tablet stands or vertical docks.
  - **Voice-Over Routine Reminders**: Overlays scheduled reminders at alarm times, announces them aloud via English TTS, and provides a **sensible 60-second auto-dismiss timeout** to automatically resume the photo slideshow.

---

### 2. Feature 1: Memory & Photo Carousel
- **Local Photo Storage**: Selected photos are copied directly into the app's internal sandboxed filesystem (`FileSystem.documentDirectory/memories/`).
- **Memory Card Metadata**:
  - `id`: Unique identifier (UUID).
  - `title`: Name of person or event (e.g., "Sarah & Leo", "Trip to the Beach").
  - `relationship`: Badge tag (e.g., "Daughter & Grandson", "Wife", "Pet", "Old Home").
  - `story`: Short, warm sentence (e.g., "Sarah is your daughter. She lives nearby and loves gardening with you.").
  - `localImageUri`: Internal persistent path.
  - `isFavorite`: Pinned to the top of the carousel.
- **Interactive Carousel**:
  - High resolution, rounded corners, large text.
  - **Voice Readout Button**: Pressing "Read Memory" uses English Text-to-Speech to gently read aloud who the person is and the story.
  - Auto-play toggle: Gently transitions every 12 seconds so the patient can simply sit back and watch memories.

---

### 3. Feature 2: Voice-Guided Daily Reminder System
- **Reminder Engine**:
  - Uses `expo-notifications` for scheduling local notifications on device.
  - Uses `expo-speech` (native English Text-to-Speech engine) to speak reminder messages.
- **Pre-set Dementia Care Templates**:
  - *Medication* ("Time to take your morning medication with a glass of water.")
  - *Meal Time* ("It is lunchtime. Enjoy a warm, healthy meal.")
  - *Hydration Check* ("Time for a nice glass of water to stay refreshed.")
  - *Family Call* ("Let's give David a call or say hello today.")
  - *Gentle Rest* ("It is time to wind down and get ready for a good night's rest.")
- **Voice Playback Trigger**:
  - When a reminder triggers, the notification sounds.
  - When the app is opened or active, the in-app Voice Reminder Modal displays a large icon, high-contrast text, and automatically speaks the instruction out loud.
  - In Picture Frame Mode, speaks reminders aloud over the slideshow with a 60s auto-return countdown timer.
  - Caregivers can customize the exact spoken message.

---

### 4. Technical Stack & Dependencies

| Area | Solution | Notes |
| :--- | :--- | :--- |
| **Framework** | React Native (Expo SDK 52/57, TypeScript) | Cross-platform ready (Android now, iOS later). Zero native setup required on Windows. |
| **Database** | `expo-sqlite` | High-performance, fully offline, transactional SQL storage. |
| **File Storage** | `expo-file-system` | Storing full-res memory photos locally in app sandbox. |
| **Voice / TTS** | `expo-speech` | Built-in native speech synthesis (offline, high quality English). |
| **Notifications** | `expo-notifications` | Local scheduled notifications without remote server dependencies. |
| **Screen Wake Lock** | `expo-keep-awake` | Keeps display continuously illuminated in Picture Frame Mode. |
| **Screen Orientation** | `expo-screen-orientation` | Locks portrait for patient safety; unlocks dynamic rotation for picture frame. |
| **Safe Area Insets** | `react-native-safe-area-context` | Modern edge-to-edge support replacing deprecated RN `SafeAreaView`. |
| **Image Picker** | `expo-image-picker` | System photo picker (Android 13+ compliant, 0 dangerous permissions). |
| **UI Design** | Vanilla React Native StyleSheet + Calming Tokens | Dementia-friendly colors (Sage Green, Calming Warm White, Navy/Charcoal high contrast text, 20pt+ font sizes). |

---

## File Structure & Proposed Changes

```
Memory Lane/
├── app.json                  # Expo config (permissions, Android package, splash screen, icons)
├── package.json              # Project dependencies and build scripts
├── tsconfig.json             # TypeScript configuration
├── App.tsx                   # App root with Navigation and Global Context
├── src/
│   ├── constants/
│   │   ├── colors.ts         # Dementia-friendly accessible color palette
│   │   ├── typography.ts     # Large, legible typography definitions
│   │   └── defaultData.ts    # Initial warm seed memories & sample reminders
│   ├── db/
│   │   ├── database.ts       # SQLite database initialization & migrations
│   │   ├── memoryRepository.ts  # CRUD for photos & memory stories
│   │   └── reminderRepository.ts # CRUD for daily reminders & schedule states
│   ├── services/
│   │   ├── speechService.ts  # expo-speech wrapper with soothing rate & pitch
│   │   ├── notificationService.ts # Local notification scheduling & triggers
│   │   └── imageService.ts   # Persistent local sandbox image saving
│   ├── components/
│   │   ├── HeaderTimeWidget.tsx # Big clock, date, and part-of-day ("Thursday Morning")
│   │   ├── MemoryCarousel.tsx   # Smooth, large photo slideshow with voice button
│   │   ├── ReminderCard.tsx     # Today's tasks with Voice button & Complete toggle
│   │   ├── VoicePromptModal.tsx # Fullscreen gentle alert when reminder triggers
│   │   └── CaregiverPinModal.tsx # Quick lock to protect caregiver settings
│   └── screens/
│       ├── PatientHomeScreen.tsx # The primary serene patient interface
│       ├── CaregiverDashboardScreen.tsx # Overview of memories & reminders
│       ├── EditMemoryScreen.tsx         # Add/edit photos, relationship, caption
│       └── EditReminderScreen.tsx       # Set reminder time, frequency, custom voice text
```

---

## Step-by-Step Implementation Roadmap (Bite-Sized & Context-Optimized)

To keep within chat context limits in Antigravity IDE and ensure rock-solid stability, each phase is broken down into small, self-contained micro-tasks touching only 1–2 files at a time. 

> [!IMPORTANT]
> **MANDATORY PROTOCOL: Continuous Remote Synchronization & Plan Completion Checklist**
>
> For **EVERY upcoming phase and sub-phase**, the following sequence is strictly mandatory before declaring the phase finished:
> 1. **Static Validation**: Run `npx.cmd tsc --noEmit` and confirm zero TypeScript / build errors.
> 2. **Code Commit & Push**: Stage the phase code changes, commit with the designated message, and push immediately to GitHub:
>    ```powershell
>    git add <files...>
>    git commit -m "<designated checkpoint message>"
>    git push origin main
>    ```
> 3. **Plan Update**: In `implementation_plan.md`, mark the phase as `[COMPLETED]`, record the commit hash, and note `pushed to origin/main`.
> 4. **Plan Check-In (Commit)**: Check in the modified `implementation_plan.md` into Git:
>    ```powershell
>    git add implementation_plan.md
>    git commit -m "docs: mark <Phase Name> completed in implementation plan"
>    ```
> 5. **Remote Push Plan**: Push the checked-in implementation plan commit to GitHub:
>    ```powershell
>    git push origin main
>    ```
> 6. **Verification & Status Confirmation**: Confirm the remote repository is fully synchronized and clean:
>    ```powershell
>    git status # Must show: "Your branch is up to date with 'origin/main'", "nothing to commit, working tree clean"
>    ```

---

### [COMPLETED] Phase 0: Local Git & GitHub Setup (`gh` CLI)
- **Status**: Completed (Commit `ae1c2a6`, remote repository https://github.com/Austinmini/Memory-Lane)
- **Files**: `.gitignore`, `README.md`
- **Scope**:
  1. Initialize local repository: `git init -b main`.
  2. Create production `.gitignore` for React Native/Expo, node modules, Android/iOS build artifacts, and keystores.
  3. Verify GitHub CLI (`gh auth status` / `gh auth login`).
  4. Create remote GitHub repo via `gh repo create "Memory-Lane" --private --source=. --remote=origin`.
  5. Initial commit & push to `main`.
- **Context Size**: Minimal (~50 lines).

---

### Phase 1: Expo Scaffolding & Design Foundation
- **[COMPLETED] Phase 1A: Project Initialization & Configuration**
  - **Status**: Completed (Commit `5d70b65`, pushed to `origin/main`)
  - **Files**: `package.json`, `app.json`, `tsconfig.json`, `App.tsx`
  - **Scope**: Run `npx.cmd -y create-expo-app@latest . --template blank-typescript`. Configure `app.json` for Android package (`com.memorylane.carecompanion`) with zero-friction permissions (`POST_NOTIFICATIONS` only).
  - **Git Checkpoint**: `git commit -m "chore: scaffold expo typescript project with play store safe config" && git push origin main`
- **[COMPLETED] Phase 1B: Dementia-Accessible Design System**
  - **Status**: Completed (Commit `664f854`, pushed to `origin/main`)
  - **Files**: `src/constants/colors.ts`, `src/constants/typography.ts`, `src/constants/index.ts`
  - **Scope**: Define calming, high-contrast color tokens (Sage Green, warm cream, soft navy text) and large font scalings (22pt+ minimum touch sizes) meeting WCAG AAA contrast standards.
  - **Git Checkpoint**: `git commit -m "feat(ui): add dementia-friendly color palette and typography tokens" && git push origin main`

---

### Phase 2: Local Database & Storage Layer
- **[COMPLETED] Phase 2A: Database Initialization & Schema**
  - **Status**: Completed (Commit `eb81745`, pushed to `origin/main`)
  - **Files**: `src/db/database.ts`, `src/db/types.ts`, `src/db/index.ts`, `package.json`, `app.json`
  - **Scope**: Install `expo-sqlite`. Create initialization routine that opens/creates the local SQLite database and runs table creation queries for `memories` and `reminders`.
  - **Git Checkpoint**: `git commit -m "feat(db): initialize local sqlite database and tables" && git push origin main`
- **[COMPLETED] Phase 2B: Repositories & Comforting Seed Data**
  - **Status**: Completed (Commit `97bb74c`, pushed to `origin/main`)
  - **Files**: `src/db/memoryRepository.ts`, `src/db/reminderRepository.ts`, `src/constants/defaultData.ts`, `src/constants/index.ts`, `src/db/index.ts`
  - **Scope**: CRUD operations for memories and reminders. Add initial seed data (e.g. sample family memory and gentle daily routine templates) so the app is immediately useful out-of-the-box.
  - **Git Checkpoint**: `git commit -m "feat(db): add memory and reminder repositories with default seed data" && git push origin main`
- **[COMPLETED] Phase 2C: Local Sandbox File Storage**
  - **Status**: Completed (Commit `7815505`, pushed to `origin/main`)
  - **Files**: `src/services/imageService.ts`, `src/services/index.ts`, `package.json`
  - **Scope**: Install `expo-file-system`. Implement helper to copy user-selected photos from temporary cache directly into persistent app document directory (`FileSystem.documentDirectory/memories/`).
  - **Git Checkpoint**: `git commit -m "feat(storage): add local image persistence service" && git push origin main`

---

### Phase 3: Memory Carousel Feature
- **[COMPLETED] Phase 3A: Soothing Voice / Speech Service**
  - **Status**: Completed (Commit `5341375`, pushed to `origin/main`)
  - **Files**: `src/services/speechService.ts`, `src/services/index.ts`, `package.json`, `App.tsx`
  - **Scope**: Install `expo-speech`. Configure calm, slower-cadence English voice synthesis (`rate: 0.85`, comforting pitch) for reading memory stories and instructions. Includes formatted memory readouts, playback control, and active speech checking.
  - **Git Checkpoint**: `git commit -m "feat(speech): implement gentle english text-to-speech service (Phase 3A)" && git push origin main`
- **[COMPLETED] Phase 3B: Memory Carousel Component**
  - **Status**: Completed (Commit `b0581fd`, pushed to `origin/main`)
  - **Files**: `src/components/MemoryCarousel.tsx`, `src/components/index.ts`, `src/services/speechService.ts`, `App.tsx`
  - **Scope**: Build horizontal paging carousel with large Next/Previous buttons, prominent photo display, relationship badge, and a one-tap "Listen" button triggering speech readout. Includes an optional slow auto-advance toggle.
  - **Git Checkpoint**: `git commit -m "feat(ui): create accessible memory carousel with voice narration (Phase 3B)" && git push origin main`
- **[COMPLETED] Phase 3C: Caregiver Add/Edit Memory Screen**
  - **Status**: Completed (Commit `a82e3ed`, pushed to `origin/main`)
  - **Files**: `src/screens/EditMemoryScreen.tsx`, `src/screens/index.ts`, `src/constants/colors.ts`, `package.json`, `App.tsx`
  - **Scope**: Install `expo-image-picker` (using modern system Photo Picker that requires 0 dangerous permissions). Allow caregiver to pick photo, enter person's name, relationship, and short memory story. Includes in-editor calming voice narration test, favorite star pinning, and sandbox persistence.
  - **Git Checkpoint**: `git commit -m "feat(screens): add caregiver photo upload and memory editor (Phase 3C)" && git push origin main`

---

### Phase 4: Voice-Guided Daily Reminders
- **[COMPLETED] Phase 4A: Safe Local Notification Scheduling**
  - **Status**: Completed (Commit `1029b5f`, pushed to `origin/main`)
  - **Files**: `src/services/notificationService.ts`, `src/services/index.ts`, `package.json`, `app.json`, `App.tsx`
  - **Scope**: Install `expo-notifications`. Configure permissible scheduled notifications (avoiding restricted `USE_EXACT_ALARM`) for daily routine items (Meds, Meals, Hydration, Calls). Includes Android notification channel setup, daily recurrence triggers, foreground speech integration, and instant test verification.
  - **Git Checkpoint**: `git commit -m "feat(notifications): add safe local notification scheduling service (Phase 4A)" && git push origin main`
- **[COMPLETED] Phase 4B: Orientation Header & Daily Reminder Cards**
  - **Status**: Completed (Commit `e251aec`, pushed to `origin/main`)
  - **Files**: `src/components/HeaderTimeWidget.tsx`, `src/components/ReminderCard.tsx`, `src/components/index.ts`, `App.tsx`
  - **Scope**: Build clear orientation widget (e.g. *"Today is Thursday Morning, September 11"*) and large reminder cards with "Done" checkbox and "Listen" audio button. Includes live temporal clock, period-of-day badges, voice readouts, and WCAG AAA contrast.
  - **Git Checkpoint**: `git commit -m "feat(ui): add time orientation widget and reminder cards (Phase 4B)" && git push origin main`
- **[COMPLETED] Phase 4C: In-App Voice Reminder Alert Modal**
  - **Status**: Completed (Commit `280a576`, pushed to `origin/main`)
  - **Files**: `src/components/VoicePromptModal.tsx`, `src/components/index.ts`, `App.tsx`
  - **Scope**: High-contrast, gentle pop-up modal when a reminder triggers, automatically announcing the reminder out loud in English with large "Acknowledge" button. Includes category icons, auto-speech trigger, replay audio option, and 68dp confirmation target.
  - **Git Checkpoint**: `git commit -m "feat(ui): add voice prompt alert modal for active reminders (Phase 4C)" && git push origin main`
- **[COMPLETED] Phase 4D: Caregiver Add/Edit Reminder Screen**
  - **Status**: Completed (Commit `a8a7df3`, pushed to `origin/main`)
  - **Files**: `src/screens/EditReminderScreen.tsx`, `src/screens/index.ts`, `App.tsx`
  - **Scope**: Screen with quick-pick templates (Meds, Lunch, Water, Call Loved One) or custom reminders with time picker and spoken text preview. Includes accessible 12-hour AM/PM time selector, daily repeat/active switches, voice narration audition, and instant local notification rescheduling.
  - **Git Checkpoint**: `git commit -m "feat(screens): add caregiver reminder editor with routine templates (Phase 4D)" && git push origin main`
- **[COMPLETED] Phase 4 Supplement: Expo Go SDK 53+ Compatibility & Local Web Testing Setup**
  - **Status**: Completed (Commits `8121e9f`, `a7da50f`, `f9934c9`, pushed to `origin/main`)
  - **Files**: `src/services/notificationService.ts`, `metro.config.js`, `scripts/patch-expo-notifications.js`, `package.json`
  - **Scope**:
    1. Safe in-app fallback timers for notification simulation inside Expo Go Android SDK 53+ and Web (`Platform.OS === 'web'`).
    2. Patch script `scripts/patch-expo-notifications.js` wired to `postinstall` in `package.json` to swap top-level `requireNativeModule` calls to `requireOptionalNativeModule` with safe JS fallbacks for missing push modules (`ExpoTopicSubscriptionModule`, `ExpoPushTokenManager`, `NotificationsServerRegistrationModule`).
    3. Web platform bundling support with `.wasm` Metro asset resolvers for `expo-sqlite`. Both Android and Web bundles verified compiling with `HTTP 200 OK`.

---

### Phase 5: App Integration & Dual-Mode UI
- **[COMPLETED] Phase 5A: Patient Home Screen & Caregiver Lock**
  - **Status**: Completed (Commit `e09b83b`, pushed to `origin/main`)
  - **Files**: `src/screens/PatientHomeScreen.tsx`, `src/components/CaregiverLockModal.tsx`, `src/components/index.ts`, `src/screens/index.ts`, `App.tsx`
  - **Scope**: Assemble serene patient view containing the orientation header, memory carousel, and today's schedule. Add discreet long-press lock or PIN to enter Caregiver Mode.
  - **Git Checkpoint**: `git commit -m "feat(screens): assemble serene patient home screen with caregiver lock (Phase 5A)" && git push origin main`
- **[COMPLETED] Phase 5B: Caregiver Dashboard & Main App Root**
  - **Status**: Completed (Commit `e7fa038`, pushed to `origin/main`)
  - **Files**: `src/screens/CaregiverDashboardScreen.tsx`, `src/screens/index.ts`, `App.tsx`
  - **Scope**: Caregiver control panel with dedicated tabs for Family Memories, Daily Routines, Settings/Diagnostics, audio controls, and Google Play compliance disclaimers. Complete dual-mode navigation in `App.tsx`.
  - **Git Checkpoint**: `git commit -m "feat: complete caregiver dashboard and app navigation (Phase 5B)" && git push origin main`
- **[COMPLETED] Phase 5C: Ambient Digital Picture Frame & Voice-Guided Reminder Mode**
  - **Status**: Completed (Commits `50e13de`, `48f97ae`, `d7d33ac`, `a20242a`, `29dae04`, `12bd9ed`, `5767ac4`, `906b108`, `3cdcbb6`, `6c06558`, `eddef93`, `50c0ca5`, `92e55d4`, pushed to `origin/main`)
  - **Files**: `src/screens/PictureFrameScreen.tsx`, `src/screens/index.ts`, `src/screens/PatientHomeScreen.tsx`, `src/screens/CaregiverDashboardScreen.tsx`, `package.json`, `app.json`, `App.tsx`
  - **Scope**:
    1. Install `expo-keep-awake` to prevent screen sleep while in Picture Frame Mode.
    2. Build full-screen ambient photo slideshow cycling through all memories with animated cross-fade.
    3. Minimalist, distraction-free caption: displays **only the photo title** on a clean centered floating card (excluding relationship tags and story descriptions).
    4. Foreground routine reminder announcements: Overlays gentle reminder prompt, announces the reminder out loud via English TTS, and includes a **sensible 60-second auto-return timeout** with progress timer to resume slideshow if not manually acknowledged.
    5. Dynamic orientation via `expo-screen-orientation`: Enforces Portrait lock for Patient Home Screen and Caregiver Dashboard to prevent disorientation, while unlocking auto-rotation in Picture Frame Mode for tabletop docking and bedside nightstands.
    6. Modern safe area migration: Replaced deprecated React Native `SafeAreaView` with `react-native-safe-area-context` (`SafeAreaProvider` and `SafeAreaView`).
    7. Provide accessible entry/exit controls from Patient View and Caregiver Dashboard.
    8. **Edge-to-Edge Fullscreen & Centered Display**: Bypassed outer SafeAreaView padding in `App.tsx` for Picture Frame Mode, concealed the system status bar (`RNStatusBar.setHidden(true)` + `StatusBar hidden={true}`), centered photos uniformly with `resizeMode="contain"` to prevent cropping, and integrated ambient blurred letterbox filling.
    9. **Senior Accessibility & Clear Controls**: Renamed exit button to `"Exit"`, increased touch targets to 56dp (meeting dementia accessibility guidelines), enlarged speaker/pause icons (26px) and chevrons (36px). Added right-side inset clearance to prevent overlap with Expo Go's top-right floating developer widget.
    10. **High-Prominence Home Entry with Play Graphic**: Repositioned the Picture Frame entry card above Section 1 directly beneath "Read Today's Schedule" in `PatientHomeScreen.tsx`, featuring a custom composite photo-frame + play badge graphic (`🖼️▶`) and high-contrast `Play ▶` action pill.
    11. **Landscape Ambient Side Wings (Slim Non-Bleeding Layout)**: Dynamically responsive layout via `useWindowDimensions()`. In landscape, places a slim Clock & Date card in the left blurred wing and an Upcoming Routine glance card in the right blurred wing, hugging the screen edges (`left: 8px`, `right: 8px`) with dynamically clamped widths (`~92–132px`) so they never bleed into or overlap the central square photo. Tapping the upcoming routine card triggers gentle English speech narration. In portrait, gracefully adapts to a top-left ambient cluster.
  - **Git Checkpoint**: `git commit -m "feat(screens): add ambient picture frame mode with voice reminders, title-only overlay, and dynamic orientation (Phase 5C)" && git push origin main`
- **[COMPLETED] Phase 5D: Sensible Defaults, Onboarding Guide, Settings Audit, Caregiver Setup & Feedback**
  - **Status**: Completed (Commits `da5d5d2`, `43dd985`, `b182351`, `41251d9`, `25d18e2`, pushed to `origin/main`)
  - **Files**: `src/constants/defaultData.ts`, `src/components/OnboardingGuideModal.tsx`, `src/components/MemoryCarousel.tsx`, `src/components/index.ts`, `src/screens/CaregiverDashboardScreen.tsx`, `src/screens/PictureFrameScreen.tsx`, `src/screens/EditMemoryScreen.tsx`, `src/db/database.ts`, `src/db/reminderRepository.ts`, `App.tsx`, `assets/defaults/*`
  - **Scope**:
    1. **Sensible Defaults for Photos & Reminders**:
       - Bundled heartwarming sample image assets (`family_portrait.jpg`, `golden_retriever.jpg`, `lake_tahoe.jpg`) in `assets/defaults/` with `resolveMemoryImageSource()` utility so Carousel, Picture Frame, and Memory Editor immediately display authentic high-resolution imagery.
       - Configured **1 sample memory** (*Sarah & Leo*) and **1 sample reminder** (*Morning Medication*) for initial state, with `RECOMMENDED_ROUTINES` export for on-demand 7-routine population.
    2. **Fresh Install Landing in Caregiver Setup**:
       - On a fresh install, `App.tsx` queries SQLite `app_settings` for `has_completed_initial_setup` and lands directly in **Caregiver Mode** so family caregivers can configure photos and routines before handing the device to their loved one.
       - Switching to Patient View marks `has_completed_initial_setup` as complete so subsequent app opens land in serene Patient View.
    3. **Caregiver Setup Checklist Banner & Dismiss**:
       - Added prominent setup checklist card at the top of Caregiver Dashboard calling out the sample items and encouraging the caregiver to add loved ones' photos and daily alarms.
       - Added `✕ Close` button and dismiss link to hide the checklist, with a `"✨ Show Setup Checklist Again"` button in Settings to re-open it if needed.
       - Added gentle confirmation prompt when tapping `"← Patient View"` if only the sample items exist.
    4. **Caregiver & Patient Onboarding Guide**:
       - Built accessible, illustrated multi-slide modal (`OnboardingGuideModal.tsx`) walking through dual modes, family memories, daily routine alarms, and digital picture frame docking.
       - Persists `has_seen_onboarding` flag in SQLite `app_settings` to auto-prompt on first launch, with a permanent `"📖 How to Use Memory Lane"` guide button in Caregiver Settings.
    5. **Settings Page Audit & Sound Testing Clarification**:
       - Reorganized Settings into caregiver-friendly cards: Preferences & Audio Previews, Routine Alarms & Sound Testing, Help & Caregiver Feedback, and Offline Privacy & Safety.
       - Replaced developer/legal jargon on alarms with clear explanations of why testing is helpful and what each button does (Test 5-Sec Alarm, Preview Alert Popup, Re-sync Alarms, Populate Recommended Schedule).
       - Replaced exposed developer logs with a collapsed `"Advanced Troubleshooting / System Log"` accordion.
    6. **Caregiver Feedback via Email**:
       - Configured dedicated feedback channel to `unemployedasiandad@gmail.com` via native `mailto:` with pre-populated subject and device diagnostic context, plus an instant copyable dialog fallback.
    7. **Removal of Redundant Auto-Play in Patient Carousel**:
       - Removed `isAutoPlayActive`, `autoPlayTimerRef`, `toggleAutoPlay`, and auto-advance timers from `MemoryCarousel.tsx`.
       - Removed the `⏸ Pause Slideshow` / `▶ Auto-Play` toggle button from the patient carousel to keep it simple, self-paced, and distraction-free, leaving automatic slideshow playback exclusively to the dedicated Digital Picture Frame Mode (`🖼️▶`).
  - **Git Checkpoint**: `git commit -m "feat: add sensible defaults, onboarding guide, settings audit, and feedback (Phase 5D)" && git push origin main`

---

### Phase 6: Google Play Store Readiness & Policies
- **[COMPLETED] Phase 6A: Privacy Policy & Data Safety Document**
  - **Status**: Completed (Commit `29f3490`, pushed to `origin/main`)
  - **Files**: `PRIVACY_POLICY.md`
  - **Scope**: Complete privacy policy documenting 100% on-device offline storage, zero tracking, zero cloud data transfer, compliant with Google Play Data Safety, Families, and privacy requirements, ready to host on GitHub Pages for Play Store listing.
  - **Git Checkpoint**: `git commit -m "docs: add play store compliant zero-data-collection privacy policy (Phase 6A)" && git push origin main`
- **[COMPLETED] Phase 6B: Store Assets & Final Verification Audit**
  - **Status**: Completed (Commit `b55062e`, pushed to `origin/main`)
  - **Files**: `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash.png`, `app.json`, `package.json`
  - **Scope**: Verified app icon (`1024x1024`), adaptive icon (`512x512`), and splash screen assets (`1024x1024`) with matching `app.json` configuration. Executed `npx expo prebuild --clean` dry-run and audited generated `AndroidManifest.xml` to verify strict zero-excess permission posture: stripped unwanted permissions (`RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`) with `blockedPermissions` and confirmed only `POST_NOTIFICATIONS` is active for routine reminder scheduling. Verified zero TypeScript errors (`tsc --noEmit`).
  - **Git Checkpoint**: `git commit -m "chore: verify store assets and finalize play store prebuild audit (Phase 6B)" && git push origin main`


---

## Verification Plan

### Automated & Static Verification
- `npm run lint` / TypeScript check: Ensure zero type errors (`tsc --noEmit`).
- Database migration test: Verify SQLite schema initializes and seeds correctly on empty state.

### Manual & Functional Verification
1. **Photo Carousel**:
   - Pick photo from device gallery.
   - Verify image persists across app restarts (saved in app document sandbox).
   - Test "Read Out Loud" speech button to verify English voice narration works cleanly.
   - Test carousel swipe and auto-play mode.
2. **Voice Reminders**:
   - Schedule a reminder 1 minute in the future.
   - Verify notification triggers on Android device/emulator.
   - Verify in-app TTS speaks the reminder text clearly and audibly.
   - Mark reminder as "Done" and verify daily schedule resets for next cycle.
3. **Android Submission Check**:
   - Inspect generated `AndroidManifest.xml` via `npx expo prebuild` to confirm no prohibited permissions (`USE_EXACT_ALARM`, `MANAGE_EXTERNAL_STORAGE`, etc.).
   - Verify full offline operation (enable Airplane mode; verify app functions 100% identically).
