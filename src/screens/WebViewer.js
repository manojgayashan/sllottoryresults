import { View, Text } from 'react-native'
import React from 'react'
import { WebView } from 'react-native-webview';
import Styles from '../constants/Styles'
import Header from '../components/Header';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function WebViewer() {
    const navigation = useNavigation()
    const route = useRoute()
    const lottery = route.params?.lottery

  return (
    <View style={Styles.container}>
      <Header title={lottery.title_si} leftIcon={'arrow-left'} leftIconOnPress={()=>navigation.goBack()} />
      <WebView source={{ uri: route.params?.url }} style={{ flex: 1 ,marginTop: route.params?.type=='nlb'?-250:-480,paddingBottom:800}} />
    </View>
  )
}