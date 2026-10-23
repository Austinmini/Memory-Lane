# Apple App Store & TestFlight Submission Guide: Memory Lane

This comprehensive guide provides step-by-step instructions, command lines, and copy-paste text to publish **Memory Lane** (`com.memorylane.carecompanion`) to the **Apple App Store** and distribute it via **TestFlight** for both **iPhone** and **iPad**.

---

## 1. Prerequisites Checklist

- [ ] **Apple Developer Program Account**: Active membership enrolled at [developer.apple.com](https://developer.apple.com) ($99/year USD).
- [ ] **Expo / EAS Account**: Free account at [expo.dev](https://expo.dev) to build and sign iOS `.ipa` archives in the cloud.
- [ ] **EAS CLI Installed**: Installed on your computer (`npm install -g eas-cli`).
- [ ] **No Mac Required**: Using Expo Application Services (EAS Cloud Build), Apple `.ipa` binaries are compiled and signed on remote macOS servers directly from your Windows environment.

---

## 2. Generating the iOS Production Archive (`.ipa`) via EAS Cloud

Apple requires an `.ipa` archive signed with an Apple Distribution Certificate and an App Store Provisioning Profile. EAS automates this entire process.

### Step 1: Log in and Configure EAS
In PowerShell or Terminal from the project root directory:

```powershell
# 1. Log in to your Expo account
eas login

# 2. Check that your project is linked
eas project:init
```

### Step 2: Build the Production iOS Archive
Run the following command to build the production `.ipa` file:

```powershell
eas build --platform ios --profile production
```

**What happens during this command:**
1. EAS will ask: *"Do you want EAS to manage your Apple credentials?"* -> **Select Yes (Recommended)**.
2. EAS will prompt you to log in to your Apple ID to automatically create:
   - An Apple Distribution Certificate
   - An Apple Provisioning Profile for `com.memorylane.carecompanion`
   - An App Store Connect API Key (for automated uploads)
3. EAS sends the build to a cloud macOS builder.
4. When finished, you will receive a download link for the `.ipa` file and the build will be available in your Expo dashboard at [expo.dev](https://expo.dev).

---

## 3. Submitting to TestFlight & App Store Connect

You can submit your build to App Store Connect in one of two ways:

### Option A: Automatic Upload via EAS (Recommended)
You can build and submit in a single command, or submit an already completed build:

```powershell
# Option A1: Build and automatically submit upon completion
eas build --platform ios --profile production --auto-submit

# Option A2: Submit the latest existing production build
eas submit --platform ios
```

EAS will upload the `.ipa` directly to App Store Connect. Within 10–15 minutes, Apple will process the binary, and it will appear under the **TestFlight** tab in App Store Connect.

### Option B: Manual Upload via Transporter (If you have a Mac)
If you prefer to manually upload:
1. Download the `.ipa` file from your Expo build dashboard.
2. Open the **Transporter** app from the Mac App Store.
3. Drag and drop the `.ipa` file into Transporter and click **Deliver**.

---

## 4. Creating Your App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com) and log in with your Apple Developer account.
2. Click **Apps** > Click the **"+"** button > Select **"New App"**.
3. Fill in the initial app modal:
   - **Platforms**: Check **iOS** (covers both iPhone & iPad).
   - **Name**: `Memory Lane: Dementia Care` (or `Memory Lane`)
   - **Primary Language**: `English (U.S.)`
   - **Bundle ID**: Select `com.memorylane.carecompanion` (created by EAS or create it in Certificates, Identifiers & Profiles).
   - **SKU**: `memory-lane-ios`
   - **User Access**: `Full Access`
4. Click **Create**.

---

## 5. Main Store Listing (Copy & Paste)

Navigate to **App Store > iOS App > 1.0 Prepare for Submission**:

### App Information
- **Name** (max 30 characters):  
  `Memory Lane: Dementia Care`
- **Subtitle** (max 30 characters):  
  `Alzheimer Daily Routine Frame`
- **Primary Category**:  
  `Medical` or `Lifestyle` *(Recommended: `Lifestyle` or `Utilities` with the health disclaimer to simplify review)*
- **Secondary Category (Optional)**:  
  `Health & Fitness`

### Version Information
- **Promotional Text** (max 170 characters):  
  ```text
  A gentle, 100% offline memory photo album and spoken daily routine companion designed with cognitive care principles for seniors, individuals with memory loss, and caregivers.
  ```

- **Keywords** (max 100 characters, comma-separated, no spaces after commas — ASO Option A):  
  ```text
  caregiver,senior,elderly,reminders,photo,album,clock,calendar,medication,pill,schedule,aging,speech
  ```
  > [!TIP]
  > **ASO Combinations Note (Option A):** This setup eliminates all keyword duplication across Title, Subtitle, and Keywords (utilizing 99/100 characters with zero spaces). Apple will algorithmically cross-index search queries such as *dementia caregiver*, *alzheimer routine*, *senior photo album*, *elderly medication reminders*, *daily pill schedule*, *routine clock*, and *dementia calendar*.

- **Support URL**:  
  `https://github.com/Austinmini/Memory-Lane`
- **Marketing URL (Optional)**:  
  `https://github.com/Austinmini/Memory-Lane`

- **Description** (max 4000 characters):  
```text
Memory Lane is a soothing, dignified, and 100% offline memory and daily routine companion designed specifically for individuals living with dementia, Alzheimer's disease, or cognitive memory loss, as well as their devoted family caregivers.

Created with deep empathy and dementia-accessible design principles, Memory Lane provides comfort, temporal orientation, and familiar connection without confusion or technical complexity.

🌿 KEY FEATURES FOR LOVED ONES:

• High-Contrast Memory Album: An accessible photo carousel displaying cherished family members, grandchildren, dear friends, and milestone memories with clear relationship labels.
• Soothing Voice Narration: One-tap text-to-speech reads personal memory stories and relationship descriptions in a calm, slower, reassuring cadence.
• Daily Time & Schedule Orientation: Prominently displays the current day, date, and time period (e.g., "Today is Thursday Morning") to reduce anxiety and disorientation.
• Voice-Guided Daily Routine Reminders: Gentle spoken announcements for daily routines—including morning medication, hydration, meals, and family phone calls.
• Ambient Digital Picture Frame Mode: Dock your iPad or iPhone on a nightstand or bedside table to cycle through full-screen memories with an always-on display and subtle time overlay.

🛡️ DEDICATED CAREGIVER CONTROLS:

• Discreet Caregiver Access: Access management tools via a subtle long-press or PIN lock to protect schedules from accidental edits.
• Pre-loaded Daily Routine Templates: Quick-pick schedule templates for medications, hydration, meals, family calls, and gentle walks.
• Custom Memory Notes: Easily import family photos directly through the secure system photo picker, type meaningful captions, and pin favorites.
• 100% Offline & Private: No remote servers, no user accounts, and zero cloud uploads. All photographs and personal notes stay sandboxed securely on your device.
• Zero Distractions: No ads, no subscriptions, no in-app purchases, and zero tracking.

🌱 DESIGNED FOR ACCESSIBILITY (IPHONE & IPAD):

• High-contrast, calming sage green and warm cream palette meeting WCAG AAA accessibility standards.
• Extra-large touch targets (56pt+) to assist seniors with tremors or fine-motor challenges.
• Zero high-friction pop-ups or confusing multi-level navigation.
• Full iPad and tablet optimization for tabletop and bedside care.

---

DISCLAIMER:
Memory Lane is an assistive lifestyle and caregiver support application designed to help families organize daily routines and share comforting memories. Memory Lane is not a medical device, diagnostic tool, or emergency medical alert service.
```

---

## 6. App Review Information (For Apple Reviewers)

Navigate to **App Review Information** at the bottom of the version page:

- **Sign-In Required**: Check **No** (The app is completely offline and does not require account creation or login).
- **Notes for Reviewer**:
  ```text
  Memory Lane is an offline, local-first companion app for dementia care.
  - All data (photos, memories, daily reminders, custom audio memos) is stored entirely in an on-device SQLite database and local sandbox.
  - To access Caregiver Dashboard, either enter the default PIN 1234 or long-press the 'Caregiver' lock button.
  - The app schedules local notifications and uses iOS text-to-speech (or caregiver's recorded voice memos) to announce daily routine tasks.
  - Microphone access is requested only when a caregiver taps 'Record' to save a custom voice memo for a routine reminder. All recordings remain 100% on the device.
  - Photos are selected via the iOS photo picker to personalize family memory cards.
  ```
- **Contact Information**:
  - First & Last Name: Your Name
  - Phone Number: Your Phone Number (including country code, e.g., `+1 555 123 4567`)
  - Email Address: Your Email Address

---

## 7. App Privacy Questionnaire (Nutrition Labels)

Navigate to **App Privacy** in the left sidebar:

1. Click **Get Started**.
2. **Do you or your third-party partners collect data from this app?**:
   - Select **"No, we do not collect data from this app"**.
   > **Note on Audio/Microphone**: Apple's App Privacy policy defines "collection" as transmitting data off the device. Because all caregiver voice recordings and photos stay 100% inside the app's local sandbox and are never uploaded or transmitted, you can truthfully select "No, we do not collect data from this app".
3. **Privacy Policy URL**:
   - `https://raw.githubusercontent.com/Austinmini/Memory-Lane/main/PRIVACY_POLICY.md`  
   *(or `https://github.com/Austinmini/Memory-Lane/blob/main/PRIVACY_POLICY.md`)*
4. Click **Publish** in the top right.
   > ✨ Apple will display the **"Data Not Collected"** privacy badge on your App Store listing, giving caregivers immediate trust.

---

## 8. Age Rating Questionnaire

Navigate to **Age Rating** in the left sidebar and click **Edit**:

- Violence, profanity, drugs, gambling, contests, mature themes: **None / No**
- Health / Medical Information: Select **Frequent / Intense** or **Infrequent / Mild** depending on whether you categorize routine reminders as health-related. (Selecting "Infrequent / Mild" results in a 12+ or 4+ rating).
- Unrestricted Web Access: **No**
- Summary Rating: Typically yields **4+** or **12+**.

---

## 9. Screenshot & App Icon Requirements

Apple requires screenshots for specific screen sizes. Because iPad support is enabled, both iPhone and iPad screenshots are required.

### Required Display Sizes

| Device Target | Required Resolution | Required? | Source / Recommendation |
| :--- | :--- | :--- | :--- |
| **6.9" iPhone Display** (iPhone 16 Pro Max / 15 Pro Max) | **1320 x 2868 px** or **1290 x 2796 px** | **Mandatory** | Take via iOS Simulator or resize high-res device screenshots |
| **6.5" iPhone Display** (iPhone 14 Plus / 11 Pro Max / XS Max) | **1242 x 2688 px** or **1284 x 2778 px** | Optional if 6.9" supplied, recommended | Derived from iPhone screenshots |
| **13" iPad Pro Display** (M4 / 6th Gen iPad Pro) | **2064 x 2752 px** (Portrait) or **2752 x 2064 px** (Landscape) | **Mandatory** (since `supportsTablet: true`) | Take via iPad Simulator or tablet frame |
| **App Icon** | **1024 x 1024 px** PNG (no transparency) | Handled by `assets/icon.png` in EAS | ✅ Pre-configured |

### Recommended Screenshot Sequence
1. **Screenshot 1**: Patient Home Screen (Daily time, date period, and daily routine reminders).
2. **Screenshot 2**: Loved Ones Memory Carousel (Photo card, relationship tag, and "Listen" voice narration).
3. **Screenshot 3**: Voice Reminder Prompt Modal (Gentle voice alert for hydration/medication).
4. **Screenshot 4**: Ambient Digital Picture Frame Mode (Landscape clock + memory slideshow).
5. **Screenshot 5**: Caregiver Dashboard (Schedule management and memory album editor).

> **Tip for generating screenshots without a physical device**:
> Run the preview simulator build on a Mac (`eas build --platform ios --profile preview`), open Xcode Simulator, press `Cmd + S` on iPhone 16 Pro Max and iPad Pro (13-inch) to save exact pixel-perfect App Store screenshots.

---

## 10. Distributing via TestFlight (Beta Testing)

Before releasing to the public, test the app with caregivers on real iPhones and iPads using TestFlight:

1. In App Store Connect, click the **TestFlight** tab.
2. Under **Internal Testing**:
   - Click **"+"** to create an internal group (e.g., "Core Family & Testers").
   - Add your Apple ID email.
   - Build availability is **instantaneous** (no Apple review needed for internal testers).
   - You will receive an email invitation to download the **TestFlight** app and install Memory Lane.
3. Under **External Testing** (Optional for up to 10,000 testers):
   - Add external tester emails or generate a public TestFlight join link.
   - Apple performs a quick 24-hour Beta App Review before external testing begins.

---

## 11. Submitting for Final App Store Approval

1. In App Store Connect, go to **App Store > iOS App > 1.0 Prepare for Submission**.
2. Scroll to the **Build** section:
   - Click **"Add Build"** (or select the uploaded build from TestFlight).
3. Confirm that screenshots, descriptions, URLs, and age ratings are filled out.
4. Click **"Save"** in the top right.
5. Click **"Add for Review"** > Click **"Submit to App Review"**.
6. Turnaround time: Apple App Review typically takes **24 to 48 hours**. You will receive an email as soon as the app is approved and live on the App Store!

---

## Quick Command Reference

```powershell
# Build simulator version for Mac testing (no Apple Developer account needed):
eas build --platform ios --profile preview

# Build production version for App Store / TestFlight:
eas build --platform ios --profile production

# Build and automatically upload directly to TestFlight / App Store:
eas build --platform ios --profile production --auto-submit

# Submit an existing build to App Store Connect:
eas submit --platform ios
```
