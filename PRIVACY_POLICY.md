# Privacy Policy for Memory Lane

**Last Updated:** September 17, 2026  
**Effective Date:** September 17, 2026  
**Application Name:** Memory Lane (Dementia Care Companion)  
**Package Identifier:** `com.memorylane.carecompanion`  
**Developer Contact:** `unemployedasiandad@gmail.com`  
**Repository:** [https://github.com/Austinmini/Memory-Lane](https://github.com/Austinmini/Memory-Lane)

---

## 1. Overview & Core Philosophy

Memory Lane was developed specifically as an offline-first, calm, and dignified memory and daily routine companion for individuals living with dementia, Alzheimer's disease, or cognitive memory challenges, as well as their dedicated family caregivers.

**Our fundamental commitment to privacy:**
> **Memory Lane does NOT collect, store, transmit, sell, or share any personal data, photos, audio, or device identifiers.**
> 
> Everything you enter into Memory Lane—including family photographs, names, personal relationships, stories, and daily reminder schedules—**stays 100% on your device.**

---

## 2. Information Collection and Use

### A. Personal Data & Photos
- **No Cloud Uploads:** Any photographs selected by the caregiver for the Memory Carousel or Digital Picture Frame are copied solely into the device's local private sandbox storage directory. They are never uploaded to any remote server, cloud repository, or third-party service.
- **No Account Required:** You do not need to register an account, sign in with an email address, or provide any personal details to use Memory Lane.
- **Local SQLite Database:** All names, relationships, memory notes, and routine reminder configurations are saved in an on-device SQLite database.

### B. Audio and Voice Synthesis
- **Local On-Device Text-to-Speech:** When the app reads aloud memory stories or daily reminder prompts, it utilizes your device's built-in operating system Text-to-Speech (TTS) engine (`expo-speech`).
- **Zero Audio Transmission:** No audio recordings are made, no microphone permissions are requested, and no spoken text is transmitted to external speech servers.

### C. Analytics, Tracking, and Advertising
- **Zero Third-Party Trackers:** Memory Lane does **not** integrate third-party analytics libraries (such as Google Analytics, Firebase Analytics, Mixpanel, or Facebook SDK).
- **No Advertising:** Memory Lane contains zero advertisements, ad SDKs, or behavioral tracking pixels.

---

## 3. Device Permissions & Justifications

Memory Lane strictly adheres to the principle of least privilege, requesting only the minimum permission required for its core assistive functions:

| Permission | Android Identifier | Purpose & Justification |
| :--- | :--- | :--- |
| **Notifications** | `android.permission.POST_NOTIFICATIONS` | **Required on Android 13+ (API level 33+)** strictly to display scheduled daily routine reminders (e.g., medication prompts, meal alerts, hydration reminders) that the caregiver configured. No remote push notifications or external servers are involved. |

### Permissions We Explicitly DO NOT Request:
- ❌ **No Internet/Cloud Dependency:** The core functionality functions entirely in Airplane Mode without network connectivity.
- ❌ **No Camera Permission (`CAMERA`):** The app does not access the camera directly.
- ❌ **No Storage Access Permission (`READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `MANAGE_EXTERNAL_STORAGE`):** Memory Lane uses the secure system Photo Picker to let caregivers select images without giving the app broad access to the device file system.
- ❌ **No Location Permission (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`):** The app never tracks or accesses your location.
- ❌ **No Audio/Microphone Permission (`RECORD_AUDIO`):** The app never listens to or records speech.
- ❌ **No Exact Alarm Special Permission (`USE_EXACT_ALARM`):** The app avoids high-friction exact alarm permissions, using standard platform scheduling.
- ❌ **No Contacts, Phone, or SMS Permissions.**

---

## 4. Google Play Data Safety Declaration

In accordance with Google Play's Data Safety requirements:

| Data Safety Field | Status / Value | Description |
| :--- | :--- | :--- |
| **Data Collection** | **No data collected** | The application does not collect any user data. |
| **Data Sharing** | **No data shared** | Zero user data is shared with third parties or service providers. |
| **Data in Transit Encryption** | **Not Applicable** | No data is ever transmitted off the device over any network. |
| **Data Deletion** | **Available on device** | Users can delete individual memories and reminders anytime in Caregiver Mode. Uninstalling the app or clearing app storage permanently deletes 100% of stored data. |
| **Security Practices** | **Sandboxed locally** | Data is confined to the operating system's application sandbox, inaccessible to other apps. |

---

## 5. Data Retention and Deletion

Because all data resides exclusively in your device's local application sandbox:
- **Caregiver Control:** Caregivers can edit or permanently delete any memory, photo, or reminder directly within the Caregiver Dashboard at any time.
- **Immediate Full Purge:** Uninstalling the Memory Lane application or selecting **"Clear Data"** in your Android device's System Settings (`Settings > Apps > Memory Lane > Storage > Clear Storage`) instantly and irreversibly erases all photos, memories, settings, and schedules from the device.

---

## 6. Children's and Vulnerable Persons' Privacy

Memory Lane complies with the Children’s Online Privacy Protection Act (COPPA), the General Data Protection Regulation (GDPR), and Google Play Families Policies. Because Memory Lane does not collect any personal data from any user regardless of age, it poses zero privacy risk to children or seniors with memory impairment.

---

## 7. Assistive & Medical Disclaimer

Memory Lane is designed as an assistive lifestyle and caregiver support tool to help families organize daily schedules and share comforting memories. **Memory Lane is not a medical device**, diagnostic instrument, or emergency dispatch service. Caregivers should ensure that critical medical regimens are monitored according to healthcare provider instructions.

---

## 8. Changes to This Privacy Policy

We may update this Privacy Policy from time to time if new features or platform requirements are introduced. Any updates will be reflected with a revised **"Last Updated"** date at the top of this document and will be posted directly to our official repository:  
[https://github.com/Austinmini/Memory-Lane/blob/main/PRIVACY_POLICY.md](https://github.com/Austinmini/Memory-Lane/blob/main/PRIVACY_POLICY.md)

---

## 9. Contact Us

If you have questions, feedback, or concerns regarding this Privacy Policy or the data practices of Memory Lane, please reach out to us at:

- **Email:** `unemployedasiandad@gmail.com`
- **GitHub Issues:** [https://github.com/Austinmini/Memory-Lane/issues](https://github.com/Austinmini/Memory-Lane/issues)
