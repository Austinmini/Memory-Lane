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

### 1. Dual-Mode Interface: "Patient View" & "Caregiver Mode"
- **Patient View (Default / Main)**:
  - Ultra-clean, high-contrast, clutter-free screen.
  - Shows current day of the week, date, and time of day (e.g. *"Today is Thursday, Morning"*).
  - Prominent interactive **Memory Carousel** (swipeable with large arrow buttons and optional slow auto-advance).
  - Upcoming or active task card with a large **"Listen"** (TTS voice readout) and **"Done"** button.
- **Caregiver Settings (Discreet / Lockable)**:
  - Accessed via a gentle long-press or simple optional PIN.
  - Caregivers can add/edit photos, write captions, assign relationships (e.g., "Sarah - Daughter"), and set reminder times and frequencies.

---

### 2. Feature 1: Memory & Photo Carousel
- **Local Photo Storage**: Selected photos are copied directly into the app's internal sandboxed filesystem (`FileSystem.documentDirectory/memories/`).
- **Memory Card Metadata**:
  - `id`: Unique identifier (UUID).
  - `title`: Name of person or event (e.g., "Sarah & Leo", "Trip to the Beach").
  - `relationship`: Badge tag (e.g., "Daughter & Grandson", "Wife", "Pet", "Old Home").
  - `story`: Short, warm sentence (e.g., "Sarah is your daughter. She lives nearby and loves gardening with you.").
  - `localImageUri`: Internal persistent path.
  - `favorite`: Pinned to the top of the carousel.
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
  - Caregivers can customize the exact spoken message.

---

### 4. Technical Stack & Dependencies

| Area | Solution | Notes |
| :--- | :--- | :--- |
| **Framework** | React Native (Expo SDK 52, TypeScript) | Cross-platform ready (Android now, iOS later). Zero native setup required on Windows. |
| **Database** | `expo-sqlite` | High-performance, fully offline, transactional SQL storage. |
| **File Storage** | `expo-file-system` | Storing full-res memory photos locally in app sandbox. |
| **Voice / TTS** | `expo-speech` | Built-in native speech synthesis (offline, high quality English). |
| **Notifications** | `expo-notifications` | Local scheduled notifications without remote server dependencies. |
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

To keep within chat context limits in Antigravity IDE and ensure rock-solid stability, each phase is broken down into small, self-contained micro-tasks touching only 1–2 files at a time. Each micro-step ends with a verification check and an incremental Git commit.

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
- **Phase 1A: Project Initialization & Configuration**
  - **Files**: `package.json`, `app.json`, `tsconfig.json`
  - **Scope**: Run `npx.cmd -y create-expo-app@latest . --template blank-typescript`. Configure `app.json` for Android package (`com.memorylane.carecompanion`) with zero-friction permissions (`POST_NOTIFICATIONS` only).
  - **Git Checkpoint**: `git commit -m "chore: scaffold expo typescript project with play store safe config"`
- **Phase 1B: Dementia-Accessible Design System**
  - **Files**: `src/constants/colors.ts`, `src/constants/typography.ts`
  - **Scope**: Define calming, high-contrast color tokens (Sage Green, warm cream, soft navy text) and large font scalings (22pt+ minimum touch sizes) meeting WCAG AAA contrast standards.
  - **Git Checkpoint**: `git commit -m "feat(ui): add dementia-friendly color palette and typography tokens"`

---

### Phase 2: Local Database & Storage Layer
- **Phase 2A: Database Initialization & Schema**
  - **Files**: `src/db/database.ts`
  - **Scope**: Install `expo-sqlite`. Create initialization routine that opens/creates the local SQLite database and runs table creation queries for `memories` and `reminders`.
  - **Git Checkpoint**: `git commit -m "feat(db): initialize local sqlite database and tables"`
- **Phase 2B: Repositories & Comforting Seed Data**
  - **Files**: `src/db/memoryRepository.ts`, `src/db/reminderRepository.ts`, `src/constants/defaultData.ts`
  - **Scope**: CRUD operations for memories and reminders. Add initial seed data (e.g. sample family memory and gentle daily routine templates) so the app is immediately useful out-of-the-box.
  - **Git Checkpoint**: `git commit -m "feat(db): add memory and reminder repositories with default seed data"`
- **Phase 2C: Local Sandbox File Storage**
  - **Files**: `src/services/imageService.ts`
  - **Scope**: Install `expo-file-system`. Implement helper to copy user-selected photos from temporary cache directly into persistent app document directory (`FileSystem.documentDirectory/memories/`).
  - **Git Checkpoint**: `git commit -m "feat(storage): add local image persistence service"`

---

### Phase 3: Memory Carousel Feature
- **Phase 3A: Soothing Voice / Speech Service**
  - **Files**: `src/services/speechService.ts`
  - **Scope**: Install `expo-speech`. Configure calm, slower-cadence English voice synthesis (`rate: 0.85`, comforting pitch) for reading memory stories and instructions.
  - **Git Checkpoint**: `git commit -m "feat(speech): implement gentle english text-to-speech service"`
- **Phase 3B: Memory Carousel Component**
  - **Files**: `src/components/MemoryCarousel.tsx`
  - **Scope**: Build horizontal paging carousel with large Next/Previous buttons, prominent photo display, relationship badge, and a one-tap "Listen" button triggering speech readout. Includes an optional slow auto-advance toggle.
  - **Git Checkpoint**: `git commit -m "feat(ui): create accessible memory carousel with voice narration"`
- **Phase 3C: Caregiver Add/Edit Memory Screen**
  - **Files**: `src/screens/EditMemoryScreen.tsx`
  - **Scope**: Install `expo-image-picker` (using modern system Photo Picker that requires 0 dangerous permissions). Allow caregiver to pick photo, enter person's name, relationship, and short memory story.
  - **Git Checkpoint**: `git commit -m "feat(screens): add caregiver photo upload and memory editor"`

---

### Phase 4: Voice-Guided Daily Reminders
- **Phase 4A: Safe Local Notification Scheduling**
  - **Files**: `src/services/notificationService.ts`
  - **Scope**: Install `expo-notifications`. Configure permissible scheduled notifications (avoiding restricted `USE_EXACT_ALARM`) for daily routine items (Meds, Meals, Hydration, Calls).
  - **Git Checkpoint**: `git commit -m "feat(notifications): add safe local notification scheduling service"`
- **Phase 4B: Orientation Header & Daily Reminder Cards**
  - **Files**: `src/components/HeaderTimeWidget.tsx`, `src/components/ReminderCard.tsx`
  - **Scope**: Build clear orientation widget (e.g. *"Today is Thursday Morning, September 11"*) and large reminder cards with "Done" checkbox and "Listen" audio button.
  - **Git Checkpoint**: `git commit -m "feat(ui): add time orientation widget and reminder cards"`
- **Phase 4C: In-App Voice Reminder Alert Modal**
  - **Files**: `src/components/VoicePromptModal.tsx`
  - **Scope**: High-contrast, gentle pop-up modal when a reminder triggers, automatically announcing the reminder out loud in English with large "Acknowledge" button.
  - **Git Checkpoint**: `git commit -m "feat(ui): add voice prompt alert modal for active reminders"`
- **Phase 4D: Caregiver Add/Edit Reminder Screen**
  - **Files**: `src/screens/EditReminderScreen.tsx`
  - **Scope**: Screen with quick-pick templates (Meds, Lunch, Water, Call Loved One) or custom reminders with time picker and spoken text preview.
  - **Git Checkpoint**: `git commit -m "feat(screens): add caregiver reminder editor with routine templates"`

---

### Phase 5: App Integration & Dual-Mode UI
- **Phase 5A: Patient Home Screen & Caregiver Lock**
  - **Files**: `src/screens/PatientHomeScreen.tsx`, `src/components/CaregiverLockModal.tsx`
  - **Scope**: Assemble serene patient view containing the orientation header, memory carousel, and today's schedule. Add discreet long-press lock or PIN to enter Caregiver Mode.
  - **Git Checkpoint**: `git commit -m "feat(screens): assemble serene patient home screen with caregiver lock"`
- **Phase 5B: Caregiver Dashboard & Main App Root**
  - **Files**: `src/screens/CaregiverDashboardScreen.tsx`, `App.tsx`
  - **Scope**: Caregiver control panel to manage all memories, view/edit reminders, and toggle settings. Hook up navigation in `App.tsx`.
  - **Git Checkpoint**: `git commit -m "feat: complete caregiver dashboard and app navigation"`

---

### Phase 6: Google Play Store Readiness & Policies
- **Phase 6A: Privacy Policy & Data Safety Document**
  - **Files**: `PRIVACY_POLICY.md`
  - **Scope**: Complete privacy policy documenting 100% on-device offline storage, zero tracking, zero cloud data transfer, ready to host on GitHub Pages for Play Store listing.
  - **Git Checkpoint**: `git commit -m "docs: add play store compliant zero-data-collection privacy policy"`
- **Phase 6B: Store Assets & Final Verification Audit**
  - **Files**: `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash.png`
  - **Scope**: Verify icons, run TypeScript validation (`tsc --noEmit`), and execute `npx expo prebuild --clean` dry-run to audit generated `AndroidManifest.xml` for zero unauthorized permissions.
  - **Git Checkpoint**: `git commit -m "chore: verify store assets and finalize play store prebuild audit"`


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
