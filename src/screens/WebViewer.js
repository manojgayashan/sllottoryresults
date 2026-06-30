import { View, Text, StyleSheet, StatusBar } from 'react-native'
import React, { useState, useRef } from 'react'
import { WebView } from 'react-native-webview';
import Styles from '../constants/Styles'
import Header from '../components/Header';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GAMBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import * as Animatable from 'react-native-animatable';
import colors from '../constants/colors';

const adUnitId = __DEV__ ? TestIds.GAM_BANNER : 'ca-app-pub-9079412151911301/2406311027';

export default function WebViewer() {
    const navigation = useNavigation()
    const route = useRoute()
    const lottery = route.params?.lottery
    const company = route.params?.company ?? ''
    const url = route.params?.url ?? ''
    const [loading, setLoading] = useState(false)
    const webviewRef = useRef(null)
    const isDlb = company === 'dlb'
    const dlbScrollScript = `
      (function() {
        window.scrollTo(0, document.body.scrollHeight*2 || document.documentElement.scrollHeight*2);
        setTimeout(function() {
          window.scrollTo(0, 0);
        }, 100);
      })();
      true;
    `

  return (
    <View style={Styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle={'dark-content'}/>
      <Header title={lottery ? lottery.title_en : company ? company.toUpperCase() + ' Latest Results' : 'Latest Results'} leftIcon={'arrow-left'} leftIconOnPress={()=>navigation.goBack()} />
      {
        loading&&
        <View style={[StyleSheet.absoluteFill,{backgroundColor:'rgba(0,0,0,0.3)',alignItems:'center',justifyContent:'center',flex:1,zIndex:10}]}>
          <Animatable.Image source={require('../assets/app/logo.png')} style={{width:100,height:100}} animation={'flash'} duration={5000} iterationCount="infinite"/>
        </View>
      }
      {url ? (
        <WebView
          ref={webviewRef}
          source={{ uri: url }}
          style={{ flex: 1, marginTop: company === 'nlb' ? -900 : company === 'dlb' ? -780 : -50 }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => {
            setLoading(false)
            if (isDlb && webviewRef.current) {
              webviewRef.current.injectJavaScript(dlbScrollScript)
            }
          }}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }]}> 
          <Text>No URL provided to display.</Text>
        </View>
      )}
            <View style={{ marginTop: 8 }}>
              <GAMBannerAd unitId={adUnitId} sizes={[BannerAdSize.ANCHORED_ADAPTIVE_BANNER]} />
            </View>
    </View>
  )
}