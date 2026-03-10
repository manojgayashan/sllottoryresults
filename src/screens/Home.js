import { View, Text, Image } from 'react-native'
import React from 'react'
import Styles from '../constants/Styles'
import Header from '../components/Header'
import { Button } from 'react-native-paper'

import AntDesign from 'react-native-vector-icons/AntDesign';
import colors from '../constants/colors'
import { useNavigation } from '@react-navigation/native'
import HomeData from '../constants/HomeData'
import * as Animatable from 'react-native-animatable';
import { GAMBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = 'ca-app-pub-9079412151911301/9661313073';

export default function Home() {

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Hi, Good morning!';
    }
    if (hour < 17) {
      return 'Hi, Good afternoon!';
    }
    return 'Hi, Good evening!';
  };


  const navigation = useNavigation()
  // const homeData = require('../constants/HomeData')
  return (
    <View style={Styles.container}>
      <Header title={getGreeting()} />

      <View style={{ marginTop: 8 }}>
        <GAMBannerAd unitId={adUnitId} sizes={[BannerAdSize.ANCHORED_ADAPTIVE_BANNER]} />
      </View>

      <View style={Styles.innerContainer}>
        <View style={[Styles.row, { justifyContent: 'space-between' }]}>
          {
            HomeData.map((data, index) => {
              return (
                <View key={index}>
                  <Animatable.View style={Styles.homeCard} animation={'zoomIn'}>
                    <Image source={data.logo} style={{ width: 70, height: 50, resizeMode: 'contain' }} />
                    <Text style={{ textAlign: 'center', paddingVertical: 16, fontWeight: '700' }}>{data.title_si}</Text>
                    <Button mode="contained" style={{ backgroundColor: data.color }} onPress={() => navigation.navigate('lotteries', { data: data })}>
                      <Text>ප්‍රතිඵල  </Text>
                      <AntDesign name="right" size={12} color={colors.white} />
                    </Button>
                  </Animatable.View>
                </View>
              )
            })
          }
        </View>
      </View>

    </View>
  )
}