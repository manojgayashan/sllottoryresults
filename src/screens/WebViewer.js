import { View, Text, StyleSheet, StatusBar } from 'react-native'
import React, { useState } from 'react'
import { WebView } from 'react-native-webview';
import Styles from '../constants/Styles'
import Header from '../components/Header';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GAMBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import * as Animatable from 'react-native-animatable';
import colors from '../constants/colors';

const adUnitId = 'ca-app-pub-9079412151911301/2406311027';

export default function WebViewer() {
    const navigation = useNavigation()
    const route = useRoute()
    const lottery = route.params?.lottery
    const [loading, setLoading] = useState(false)

  return (
    <View style={Styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle={'dark-content'}/>
      <Header title={lottery?lottery.title_si:(route.params?.company).toUpperCase()+'  නවතම ප්‍රතිඵල'} leftIcon={'arrow-left'} leftIconOnPress={()=>navigation.goBack()} />
      {
        loading&&
        <View style={[StyleSheet.absoluteFill,{backgroundColor:'rgba(0,0,0,0.3)',alignItems:'center',justifyContent:'center',flex:1,zIndex:10}]}>
          <Animatable.Image source={require('../assets/app/logo.png')} style={{width:100,height:100}} animation={'flash'} duration={5000} iterationCount="infinite"/>
        </View>
      }
      <WebView 
      source={{ uri: route.params?.url }} 
      style={{ flex: 1 ,marginTop: route.params?.type=='nlb'?-250:-480,paddingBottom:800}} 
      onLoadStart={()=>setLoading(true)}
      onLoadEnd={()=>setLoading(false)}
      />
            <View style={{ marginTop: 8 }}>
              <GAMBannerAd unitId={adUnitId} sizes={[BannerAdSize.ANCHORED_ADAPTIVE_BANNER]} />
            </View>
    </View>
  )
}