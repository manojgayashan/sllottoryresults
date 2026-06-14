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

const adUnitId = __DEV__ ? TestIds.GAM_BANNER : 'ca-app-pub-9079412151911301/2406311027';

export default function Lotteries() {
    const navigation = useNavigation()
    const route = useRoute()
    const data = route.params?.data
    const lotteries = data.short == 'nlb' ? NLBlotteryList : DLBlotteryList

    const goToLottery = (lottery) => {
        navigation.navigate('lotteryresult', { lottery, data, type: data.short })
    }

    return (
        <View style={Styles.container}>
            <Header title={data.title_en} leftIcon={'arrow-left'} leftIconOnPress={() => navigation.goBack()} />
            <View style={Styles.innerContainer}>

                            <TouchableOpacity onPress={() => navigation.navigate('webviewer', { url: data.short=='nlb'?'https://www.nlb.lk/%E0%B7%83%E0%B7%92%E0%B6%82%E0%B7%84%E0%B6%BD':'https://www.dlb.lk/home/si',company:data.short})}>
                                <Animatable.View style={[Styles.lotteryCard, { backgroundColor: data.color,height:50}]} animation={'fadeInLeft'} >
                                    <Text style={{ color: colors.white }}>Latest Results - සියලුම නවතම ප්‍රතිඵල </Text>
                                </Animatable.View>
                            </TouchableOpacity>
                {
                    lotteries.map((lottery, index) => {
                        return (
                            <TouchableOpacity key={index} onPress={() => goToLottery(lottery)}>
                                <Animatable.View style={[Styles.lotteryCard, { backgroundColor: data.color }]} animation={'fadeInLeft'} delay={(index+1) * 100} >
                                    <Image source={lottery.logo} style={{ height: 30, width: 50, resizeMode: 'contain' }} />
                                    <Text style={{ color: colors.white }}>  {lottery.title_en} - {lottery.title_si}</Text>
                                </Animatable.View>
                            </TouchableOpacity>
                        )
                    })
                }
            <GAMBannerAd unitId={adUnitId} sizes={[BannerAdSize.MEDIUM_RECTANGLE]} />
            </View>
        </View>
    )
}