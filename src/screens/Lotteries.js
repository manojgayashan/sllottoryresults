import { View, Text, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import Styles from '../constants/Styles'
import Header from '../components/Header'
import { useNavigation, useRoute } from '@react-navigation/native'
import * as Animatable from 'react-native-animatable';
import colors from '../constants/colors'
import NLBlotteryList from '../constants/NLBlotteryList'
import DLBlotteryList from '../constants/DLBlotteryList'
import { GAMBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = 'ca-app-pub-9079412151911301/2406311027';

export default function Lotteries() {
    const navigation = useNavigation()
    const route = useRoute()
    const data = route.params?.data
    const lotteries = data.short == 'nlb' ? NLBlotteryList : DLBlotteryList

    const goToLottery = (lottery) => {
        if (data.short == 'nlb') {
            let url = 'https://www.nlb.lk/සිංහල/ප්%E2%80%8Dරතිඵල/' + lottery.name_si
            navigation.navigate('webviewer', { url: url, lottery: lottery,type:'nlb' })
            console.log(url)
        }
        else {
            let url = 'https://www.dlb.lk/result/' + lottery.number
            navigation.navigate('webviewer', { url: url, lottery: lottery,type:'dlb' })
            console.log(url)
        }


    }

    return (
        <View style={Styles.container}>
            <Header title={data.title_si} leftIcon={'arrow-left'} leftIconOnPress={() => navigation.goBack()} />
            <View style={Styles.innerContainer}>
                {
                    lotteries.map((lottery, index) => {
                        return (
                            <TouchableOpacity key={index} onPress={() => goToLottery(lottery)}>
                                <Animatable.View style={[Styles.lotteryCard, { backgroundColor: data.color }]} animation={'fadeInLeft'} delay={index * 100} >
                                    <Image source={lottery.logo} style={{ height: 30, width: 50, resizeMode: 'contain' }} />
                                    <Text style={{ color: colors.white }}>  {lottery.title_si}</Text>
                                </Animatable.View>
                            </TouchableOpacity>
                        )
                    })
                }
            </View>
            <GAMBannerAd unitId={adUnitId} sizes={[BannerAdSize.FULL_BANNER]} />
        </View>
    )
}