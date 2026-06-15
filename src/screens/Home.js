import { View, Text, Image, TouchableOpacity, FlatList } from 'react-native'
import React, { useState, useCallback } from 'react'
import Styles from '../constants/Styles'
import Header from '../components/Header'
import { Button } from 'react-native-paper'

import AntDesign from 'react-native-vector-icons/AntDesign';
import colors from '../constants/colors'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import HomeData from '../constants/HomeData'
import * as Animatable from 'react-native-animatable';
import { GAMBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ ? TestIds.GAM_BANNER : 'ca-app-pub-9079412151911301/9661313073';

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
  const [recent, setRecent] = useState([])

  const loadRecent = async () => {
    try {
      const raw = await AsyncStorage.getItem('search_history')
      const list = raw ? JSON.parse(raw) : []
      setRecent(list.slice(0, 8))
    } catch (e) {
      console.log('loadRecent error', e)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadRecent()
    }, [])
  )
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
                    <Text style={{ textAlign: 'center', paddingVertical: 16, fontWeight: '700' }}>{data.title_en}</Text>
                    <Text style={{ textAlign: 'center', paddingBottom: 16, fontWeight: '700' }}>{data.title_si}</Text>
                    <Button mode="contained" style={{ backgroundColor: data.color }} onPress={() => navigation.navigate('lotteries', { data: data })}>
                      <Text>Results  </Text>
                      <AntDesign name="right" size={12} color={colors.white} />
                    </Button>
                  </Animatable.View>
                </View>
              )
            })
          }
        </View>

                {/* Recent searches section */}
        <View style={{ marginVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '700' }}>Recent Searches</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SearchHistory')}>
            <Text style={{ color: '#007bff' }}>View all</Text>
          </TouchableOpacity>
        </View>
        {recent.length === 0 ? (
          <Text style={{ color: '#666', marginBottom: 12 }}>No recent searches</Text>
        ) : (
          <FlatList
            data={recent}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => `${i.id}`}
            style={{ marginBottom: 12 }}
            numColumns={4}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ marginRight: 12, marginBottom: 12, width: (Styles.homeCard.width - 12) / 2 ,backgroundColor:'#fff',borderRadius:8,padding:8,alignItems:'center',borderWidth:1,borderColor:colors.border}}
                onPress={() => navigation.navigate('lotteryresult', { lottery: item.lottery, type: item.type, selectedDate: item.date || null, drawNumber: item.drawNumber || '', fromHistory: true })}
              >
                <Image source={item.lottery?.logo || require('../assets/app/icon.jpg')} style={{ width: 70, height: 50, resizeMode: 'contain' }} />
                <Text style={{ textAlign: 'center', paddingVertical: 8, fontWeight: '700' }}>{item.lotteryTitle || item.lottery?.title_en}</Text>
                <Text style={{ textAlign: 'center', color: '#666' ,fontSize: 12}}>{item.date ? item.date : ''}{item.drawNumber ? `  #${item.drawNumber}` : ''}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

    </View>
  )
}