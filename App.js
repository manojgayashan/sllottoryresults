import { View, Text, Modal, TouchableOpacity, Linking, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { hideSplash } from 'react-native-splash-view';
import MainRoute from './src/routes/MainRoute'
import pkg from './package.json'
import colors from './src/constants/colors';

const INSTALLED_VERSION = pkg.version;   // replace with your app version
const PACKAGE_NAME = "com.sllotteryresult"; // replace with your bundle name

async function fetchPlayStoreVersion(packageName) {
  try {
    const res = await fetch(
      `https://play.google.com/store/apps/details?id=${packageName}&hl=en`
    );
    const html = await res.text();
    const match = html.match(/\[\[\["(\d+\.\d+[\.\d]*)"\]\]/);
    return match ? match[1] : null;
  } catch (err) {
    console.error("Play Store fetch error:", err);
    return null;
  }
}

function isOutdated(installed, store) {
  const a = installed.split(".").map(Number);
  const b = store.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) < (b[i] ?? 0)) return true;
    if ((a[i] ?? 0) > (b[i] ?? 0)) return false;
  }
  return false;
}

export default function App() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [storeVersion, setStoreVersion] = useState(null);

  useEffect(() => {
    // Hide splash after 5 seconds
    setTimeout(() => {
      hideSplash();
    }, 5000);

    // Check Play Store version
    fetchPlayStoreVersion(PACKAGE_NAME).then((version) => {
      if (version && isOutdated(INSTALLED_VERSION, version)) {
        setStoreVersion(version);
        setShowUpdateModal(true);
      }
    });
  }, []);

  const handleUpdate = () => {
    Linking.openURL(`https://play.google.com/store/apps/details?id=${PACKAGE_NAME}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <MainRoute />

      <Modal visible={showUpdateModal} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>Update Required</Text>
            <Text style={styles.sub}>
              A new version is available. Please update to continue.
            </Text>
            {storeVersion && (
              <Text style={styles.version}>
                {INSTALLED_VERSION} → {storeVersion}
              </Text>
            )}
            <TouchableOpacity style={styles.btn} onPress={handleUpdate}>
              <Text style={styles.btnText}>Update Now</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setShowUpdateModal(false)} style={{paddingTop:10}}>
              <Text style={[styles.btnText,{color:'rgba(0,0,0,0.4)'}]}>Reminde me Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 28,
    width: "85%",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
  },
  sub: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  version: {
    fontSize: 13,
    color: "#999",
    marginBottom: 20,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  btnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
});