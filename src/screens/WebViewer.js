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
    const [loading, setLoading] = useState(false)
    const webviewRef = useRef(null)
    const isDlb = route.params?.company === 'dlb'
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
      <Header title={lottery?lottery.title_en:(route.params?.company).toUpperCase()+'  Latest Results'} leftIcon={'arrow-left'} leftIconOnPress={()=>navigation.goBack()} />
      {
        loading&&
        <View style={[StyleSheet.absoluteFill,{backgroundColor:'rgba(0,0,0,0.3)',alignItems:'center',justifyContent:'center',flex:1,zIndex:10}]}>
          <Animatable.Image source={require('../assets/app/logo.png')} style={{width:100,height:100}} animation={'flash'} duration={5000} iterationCount="infinite"/>
        </View>
      }
      <WebView 
      ref={webviewRef}
      source={{ uri: route.params?.url }} 
      style={{ flex: 1 ,marginTop: route.params?.company=='nlb'?-900:route.params?.company=='dlb'?-780:-50}} 
      onLoadStart={()=>setLoading(true)}
      onLoadEnd={() => {
        setLoading(false)
        if (isDlb && webviewRef.current) {
          webviewRef.current.injectJavaScript(dlbScrollScript)
        }
      }}
      />
            <View style={{ marginTop: 8 }}>
              <GAMBannerAd unitId={adUnitId} sizes={[BannerAdSize.ANCHORED_ADAPTIVE_BANNER]} />
            </View>
    </View>
  )
}