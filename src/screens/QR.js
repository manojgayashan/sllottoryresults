import { View, Text, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import Header from '../components/Header'
import Styles from '../constants/Styles'
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera'

export default function QR() {

    const codeScanner = useCodeScanner({
        codeTypes: ['qr', 'ean-13'],
        onCodeScanned: (codes) => {
            console.log(`Scanned ${codes.length} codes!`)
        }
    })
    
  const device = useCameraDevice('back')
  const { hasPermissions } = useCameraPermission()
  const [hasPermission, setHasPermission] = useState(false)

  if (!hasPermission) return requestPermission()
//   if (device == null) return <NoCameraDeviceError />

const requestPermission = async () => {
      const permission = await Camera.requestCameraPermission();
      setHasPermission(permission === 'authorized');
    }

    return (
        <View style={Styles.container}>
            <Header title={'Scan QR'} />
            <View style={Styles.innerContainer}>
                <Camera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={true}
                    codeScanner={codeScanner}
                />
            </View>
        </View>
    )
}