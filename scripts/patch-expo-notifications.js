const fs = require('fs');
const path = require('path');

const expoNotificationsDir = path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build');

if (fs.existsSync(expoNotificationsDir)) {
  // 1. Patch TopicSubscriptionModule.android.js
  const topicPath = path.join(expoNotificationsDir, 'TopicSubscriptionModule.android.js');
  if (fs.existsSync(topicPath)) {
    const content = `import { requireOptionalNativeModule } from 'expo-modules-core';
import fallback from './TopicSubscriptionModule';
const nativeModule = requireOptionalNativeModule('ExpoTopicSubscriptionModule');
export default nativeModule || fallback;
`;
    fs.writeFileSync(topicPath, content, 'utf8');
    console.log('[patch-expo-notifications] Successfully patched TopicSubscriptionModule.android.js');
  }

  // 2. Patch PushTokenManager.native.js
  const pushTokenPath = path.join(expoNotificationsDir, 'PushTokenManager.native.js');
  if (fs.existsSync(pushTokenPath)) {
    const content = `import { requireOptionalNativeModule } from 'expo-modules-core';
import fallback from './PushTokenManager';
const nativeModule = requireOptionalNativeModule('ExpoPushTokenManager');
export default nativeModule || fallback;
`;
    fs.writeFileSync(pushTokenPath, content, 'utf8');
    console.log('[patch-expo-notifications] Successfully patched PushTokenManager.native.js');
  }

  // 3. Patch ServerRegistrationModule.native.js
  const serverRegPath = path.join(expoNotificationsDir, 'ServerRegistrationModule.native.js');
  if (fs.existsSync(serverRegPath)) {
    const content = `import { requireOptionalNativeModule } from 'expo-modules-core';
import fallback from './ServerRegistrationModule';
const nativeModule = requireOptionalNativeModule('NotificationsServerRegistrationModule');
export default nativeModule || fallback;
`;
    fs.writeFileSync(serverRegPath, content, 'utf8');
    console.log('[patch-expo-notifications] Successfully patched ServerRegistrationModule.native.js');
  }

  // 4. Ensure warnOfExpoGoPushUsage doesn't throw
  const warnPath = path.join(expoNotificationsDir, 'warnOfExpoGoPushUsage.js');
  if (fs.existsSync(warnPath)) {
    let warnContent = fs.readFileSync(warnPath, 'utf8');
    if (warnContent.includes('throw new Error')) {
      warnContent = warnContent.replace(/throw new Error\([^)]+\);/g, 'console.warn(message);');
      fs.writeFileSync(warnPath, warnContent, 'utf8');
      console.log('[patch-expo-notifications] Successfully patched warnOfExpoGoPushUsage.js');
    }
  }
} else {
  console.log('[patch-expo-notifications] node_modules/expo-notifications not found, skipping.');
}
