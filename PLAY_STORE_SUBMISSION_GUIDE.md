# Google Play Store Submission Guide: Memory Lane

This guide provides step-by-step instructions and copy-paste text to submit **Memory Lane** (`com.memorylane.carecompanion`) to the Google Play Console.

---

## 1. Prerequisites Checklist

- [ ] **Google Play Developer Account**: Registered at [Google Play Console](https://play.google.com/console) ($25 one-time registration fee).
- [ ] **Expo / EAS Account**: Free account at [expo.dev](https://expo.dev) to build the production `.aab` (Android App Bundle).
- [ ] **Repository Status**: Synced with GitHub at [https://github.com/Austinmini/Memory-Lane](https://github.com/Austinmini/Memory-Lane).

---

## 2. Generating the Production Android App Bundle (`.aab`)

Google Play requires a signed **Android App Bundle (`.aab`)** for all new apps.

### Option A: Expo Cloud Build (Recommended — No Android Studio Needed)
Expo builds the `.aab` directly in the cloud on their build servers and manages production signing keys automatically.

1. In PowerShell/Terminal in the project root:
   ```powershell
   # Install eas-cli globally
   npm install -g eas-cli

   # Log in to your Expo account
   eas login

   # Configure EAS project (links project to your Expo account)
   eas project:init

   # Build the production bundle (.aab)
   eas build --platform android --profile production
   ```
2. Once the build completes, the terminal will print a download link (or visit `expo.dev/accounts/[your-username]/projects/memory-lane/builds`).
3. Download the generated `.aab` file to your computer.

---

## 3. Creating Your App in Google Play Console

1. Log in to [Google Play Console](https://play.google.com/console).
2. Click **"Create app"** in the top right.
3. Enter the initial details:
   - **App name**: `Memory Lane - Dementia Care` (or `Memory Lane`)
   - **Default language**: `English (United States) - en-US`
   - **App or game**: `App`
   - **Free or paid**: `Free`
4. Accept the **Developer Program Policies** and **US Export Laws** checkboxes.
5. Click **"Create app"**.

---

## 4. Main Store Listing (Copy & Paste)

Navigate to **Grow > Store presence > Main store listing**:

### App Details
- **App name** (max 30 characters):  
  `Memory Lane - Dementia Care`
- **Short description** (max 80 characters):  
  `Calm offline photo album & gentle voice routine companion for dementia care.`
- **Full description** (max 4000 characters):  
```text
Memory Lane is a soothing, dignified, and 100% offline memory and daily routine companion designed specifically for individuals living with dementia, Alzheimer's disease, or cognitive memory loss, as well as their devoted family caregivers.

Created with deep empathy and dementia-accessible design principles, Memory Lane provides comfort, temporal orientation, and familiar connection without confusion or technical complexity.

🌿 KEY FEATURES FOR LOVED ONES:

• High-Contrast Memory Album: An accessible photo carousel displaying cherished family members, grandchildren, dear friends, and milestone memories with clear relationship labels.
• Soothing Voice Narration: One-tap English text-to-speech reads personal memory stories and relationship descriptions in a calm, slower, reassuring voice.
• Daily Time & Schedule Orientation: Prominently displays the current day, date, and time period (e.g., "Today is Thursday Morning") to reduce anxiety and disorientation.
• Voice-Guided Daily Routine Alarms: Gentle spoken announcements for daily routines—including morning medication, hydration reminders, wholesome meals, and phone calls with loved ones.
• Ambient Digital Picture Frame Mode: Dock your tablet or phone on a nightstand or bedside table to cycle through full-screen memories with an always-on screen and subtle time overlay.

🛡️ DEDICATED CAREGIVER CONTROLS:

• Discreet Caregiver Access: Access management tools via a subtle long-press or PIN lock to protect schedules from accidental edits.
• Pre-loaded Daily Routine Templates: Quick-pick schedule templates for medications, hydration, meals, family calls, and gentle walks.
• Custom Memory Notes: Easily import family photos directly through the secure system photo picker, type meaningful captions, and pin favorites.
• 100% Offline & Private: No remote servers, no user accounts, and zero cloud uploads. All photographs and personal notes stay sandboxed securely on your device.
• Zero Distractions: No ads, no in-app purchases, no complex menus, and zero tracking.

🌱 DESIGNED FOR COGNITIVE ACCESSIBILITY:

• High-contrast, calming sage green and warm cream palette meeting WCAG AAA accessibility standards.
• Extra-large touch targets (56dp+) to assist seniors with tremors or fine-motor challenges.
• Zero high-friction pop-ups or confusing multi-level navigation.

---

DISCLAIMER:
Memory Lane is an assistive lifestyle and caregiver support application designed to help families organize daily routines and share comforting memories. Memory Lane is not a medical device, diagnostic tool, or emergency dispatch service.
```

---

## 5. Store Graphics & Assets

All assets are pre-formatted and ready in your `assets/` folder:

| Asset | Requirement | File Location in Project | Status |
| :--- | :--- | :--- | :--- |
| **App Icon** | 512 x 512 px PNG, 32-bit | `assets/store-icon-512.png` | ✅ Ready (Exact 512x512) |
| **Feature Graphic** | 1024 x 500 px PNG / JPEG | `assets/feature-graphic.png` | ✅ Ready (Exact 1024x500) |
| **Phone Screenshots** | Minimum 2, 16:9 or 9:16 aspect ratio | Capture in emulator or Expo Go | 📷 Capture Patient Home & Picture Frame |
| **Tablet Screenshots** | Recommended for 7" and 10" | Recommended for bedside Picture Frame | 📷 Capture Landscape Picture Frame |

---

## 6. App Content & Policy Declarations

Navigate to **Policy and programs > App content**:

### 1. Privacy Policy
- **Privacy Policy URL**:  
  `https://raw.githubusercontent.com/Austinmini/Memory-Lane/main/PRIVACY_POLICY.md`  
  *(or `https://github.com/Austinmini/Memory-Lane/blob/main/PRIVACY_POLICY.md`)*

### 2. Ads
- **Does your app contain ads?**: Select **"No, my app does not contain ads"**.

### 3. App Access
- **Instructions**: Select **"All functionality is available without special access"**.
  - *(Optional note if requested: "The app is completely usable out-of-the-box. Caregiver settings can be accessed by long-pressing the 'Caregiver' lock button or entering default PIN 1234.")*

### 4. Content Rating (IARC Questionnaire)
- Enter developer email: `unemployedasiandad@gmail.com`
- Category: Select **"Utility, Productivity, Communication, or Other"**.
- Questionnaire answers:
  - Violence: **No**
  - Sexuality: **No**
  - Language / Profanity: **No**
  - Controlled Substances: **No**
  - User-to-user content sharing: **No**
  - Physical location sharing: **No**
  - Digital goods purchases: **No**
- Summary Rating: Receives **Everyone / PEGI 3**. Click **Save** and **Apply rating**.

### 5. Target Audience and Content
- Target age group: Check **18 and over** (Caregivers and seniors).
- Could your app inadvertently appeal to children?: Select **"No"**.

### 6. News Apps
- Is your app a news app?: Select **"No"**.

### 7. COVID-19 Contact Tracing & Status Apps
- Select **"My app is not a publicly available COVID-19 contact tracing or status app"**.

### 8. Data Safety Questionnaire (CRITICAL)
Because Memory Lane operates 100% locally on-device:
- **Does your app collect or share any user data?**: Select **"No"**.
- Everything else automatically completes as zero collection / zero sharing.
- Click **Save**.

### 9. Government Apps
- Is your app developed by or on behalf of a government?: Select **"No"**.

### 10. Financial Features
- Does your app provide any financial features?: Select **"None of the above"**.

### 11. Health Apps
- Declarations: Select **"My app is not a health or medical app"** or select **"Non-clinical assistive lifestyle & caregiver companion"** with no diagnostic/medical claims.

---

## 7. Releasing the App (Upload `.aab`)

1. In Google Play Console, navigate to **Release > Testing > Internal testing** (or **Closed testing / Production**).
2. Click **"Create new release"**.
3. Under **App bundles**, click **"Upload"** and select your downloaded `.aab` file.
4. Set **Release name**: `1.0.0 (Initial Release)`.
5. Enter **Release notes**:
   ```text
   Initial public release of Memory Lane:
   - High-contrast dementia-friendly memory photo album with gentle voice narration.
   - Live time orientation and daily routine voice reminders.
   - Ambient full-screen Digital Picture Frame mode for bedside docking.
   - 100% private on-device local storage.
   ```
6. Click **"Next"**, review any informational notes, and click **"Save and publish release"**.

---

## Summary of Prepared Project Assets

- **Privacy Policy**: [`PRIVACY_POLICY.md`](file:///c:/Users/unemp/OneDrive/Documents/github/Memory%20Lane/PRIVACY_POLICY.md)
- **EAS Build Config**: [`eas.json`](file:///c:/Users/unemp/OneDrive/Documents/github/Memory%20Lane/eas.json)
- **Feature Graphic (1024x500)**: [`assets/feature-graphic.png`](file:///c:/Users/unemp/OneDrive/Documents/github/Memory%20Lane/assets/feature-graphic.png)
- **Play Store Icon (512x512)**: [`assets/store-icon-512.png`](file:///c:/Users/unemp/OneDrive/Documents/github/Memory%20Lane/assets/store-icon-512.png)
- **App Configuration**: [`app.json`](file:///c:/Users/unemp/OneDrive/Documents/github/Memory%20Lane/app.json) (Package `com.memorylane.carecompanion`, blocked excess permissions)
