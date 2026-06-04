import { View, Text, Modal, TouchableOpacity, Platform, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { hideSplash } from 'react-native-splash-view'
import MainRoute from './src/routes/MainRoute'
import colors from './src/constants/colors'
import pkg from './package.json'

import SpInAppUpdates, {
  IAUUpdateKind,
  IAUInstallStatus,
} from 'sp-react-native-in-app-updates'

// ─────────────────────────────────────────────────────────────────────────────
// Install:
//   npm install sp-react-native-in-app-updates react-native-device-info
//   cd android && ./gradlew clean  →  rebuild release APK/AAB
//
// ⚠️  IMPORTANT - WHY IT MIGHT NOT TRIGGER:
//   1. Must be a RELEASE build signed with your Play Store keystore
//   2. The app on the device must have a LOWER version than what's on Play Store
//   3. The app must be installed via Play Store (not sideloaded / USB)
//   4. Use Internal Testing track on Play Console to test quickly
// ─────────────────────────────────────────────────────────────────────────────

const inAppUpdates = new SpInAppUpdates(false) // set true to see debug logs

export default function App() {
  // Used only for FLEXIBLE flow — shown when download finishes
  const [showInstallModal, setShowInstallModal] = useState(false)

  useEffect(() => {
    const splashTimer = setTimeout(() => hideSplash(), 5000)
    checkForUpdates()
    return () => clearTimeout(splashTimer)
  }, [])

  const checkForUpdates = () => {
    inAppUpdates
      .checkNeedsUpdate({ curVersion: pkg.version })
      .then(result => {
        console.log('Update check result:', result)

        if (!result.shouldUpdate) return

        if (Platform.OS === 'android') {
          // ── IMMEDIATE: Play Store takes over full screen (best for critical updates)
          // The update dialog is shown by the OS — no custom modal needed.
          // Switch to FLEXIBLE below if you prefer background download + custom prompt.
          inAppUpdates.startUpdate({ updateType: IAUUpdateKind.IMMEDIATE })

          // ── FLEXIBLE (background download) — uncomment to use instead:
          // inAppUpdates.addStatusUpdateListener(onStatusUpdate)
          // inAppUpdates.startUpdate({ updateType: IAUUpdateKind.FLEXIBLE })
        }

        if (Platform.OS === 'ios') {
          // iOS: shows a native alert directing user to the App Store
          inAppUpdates.startUpdate({
            title: 'Update Available',
            message: 'A new version of the app is available. Please update to continue.',
            buttonUpgradeText: 'Update Now',
            buttonCancelText: 'Later',
          })
        }
      })
      .catch(err => {
        // Non-critical — app still opens normally if update check fails
        console.log('Update check skipped:', err?.message)
      })
  }

  // Called only when using FLEXIBLE update type
  const onStatusUpdate = ({ status }) => {
    console.log('Update download status:', status)
    if (status === IAUInstallStatus.DOWNLOADED) {
      // Download complete — show prompt to restart and install
      setShowInstallModal(true)
      inAppUpdates.removeStatusUpdateListener(onStatusUpdate)
    }
  }

  const handleInstallNow = () => {
    inAppUpdates.installUpdate()
    setShowInstallModal(false)
  }

  return (
    <View style={{ flex: 1 }}>
      <MainRoute />

      {/* Only shown when FLEXIBLE update finishes downloading */}
      <Modal visible={showInstallModal} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.title}>Update Ready</Text>
            <Text style={styles.sub}>
              A new version has been downloaded and is ready to install.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={handleInstallNow}>
              <Text style={styles.btnText}>Restart & Update</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowInstallModal(false)}
              style={{ paddingTop: 14 }}
            >
              <Text style={styles.laterText}>Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    width: '85%',
    alignItems: 'center',
    elevation: 10,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111',
  },
  sub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  laterText: {
    color: 'rgba(0,0,0,0.35)',
    fontWeight: '600',
    fontSize: 14,
  },
})