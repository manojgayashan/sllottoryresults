import {
    View, Text, TouchableOpacity, Switch, ScrollView,
    Linking, Alert, StyleSheet, Platform, PermissionsAndroid
} from 'react-native'
import React, { useState, useEffect } from 'react'
import Styles from '../constants/Styles'
import Header from '../components/Header'
import { useNavigation } from '@react-navigation/native'
import * as Animatable from 'react-native-animatable'
import colors from '../constants/colors'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { GAMBannerAd, BannerAdSize } from 'react-native-google-mobile-ads'
import messaging from '@react-native-firebase/messaging'
import AntDesign from 'react-native-vector-icons/AntDesign'

import pkg from '../../package.json'

const adUnitId = 'ca-app-pub-9079412151911301/2406311027'
const SETTINGS_KEY = '@lottery_settings'
const FCM_TOPIC = 'lottery_results'

const defaultSettings = {
    notifications: true,
}

export default function Settings() {
    const navigation = useNavigation()
    const [settings, setSettings] = useState(defaultSettings)

    useEffect(() => {
        loadSettings()
    }, [])

    // ─── Permission helpers ────────────────────────────────────────────────────

    const hasPermission = async () => {
        const status = await messaging().hasPermission()
        return (
            status === messaging.AuthorizationStatus.AUTHORIZED ||
            status === messaging.AuthorizationStatus.PROVISIONAL
        )
    }

    const requestPermission = async () => {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            const result = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            )
            return result === PermissionsAndroid.RESULTS.GRANTED
        }
        const authStatus = await messaging().requestPermission()
        return (
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL
        )
    }

    const openAppSettings = () => {
        if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:')
        } else {
            Linking.openSettings()
        }
    }

    // ─── Storage helpers ───────────────────────────────────────────────────────

    const loadSettings = async () => {
        try {
            const stored = await AsyncStorage.getItem(SETTINGS_KEY)
            if (stored) setSettings(JSON.parse(stored))
        } catch (e) {
            console.log('Failed to load settings', e)
        }
    }

    const updateSetting = async (key, value) => {
        const updated = { ...settings, [key]: value }
        setSettings(updated)
        try {
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
        } catch (e) {
            console.log('Failed to save settings', e)
        }
    }

    // ─── Notification toggle ───────────────────────────────────────────────────

    const handleNotificationToggle = async (value) => {
        if (value) {
            const granted = (await hasPermission()) || (await requestPermission())

            if (!granted) {
                Alert.alert(
                    'Permission Required',
                    'Please enable notifications in your device settings to receive lottery alerts.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: openAppSettings },
                    ]
                )
                return
            }

            try {
                await messaging().subscribeToTopic(FCM_TOPIC)
            } catch (e) {
                console.log('FCM subscribe error', e)
            }

            await updateSetting('notifications', true)
        } else {
            try {
                await messaging().unsubscribeFromTopic(FCM_TOPIC)
            } catch (e) {
                console.log('FCM unsubscribe error', e)
            }

            await updateSetting('notifications', false)
        }
    }

    // ─── Other actions ─────────────────────────────────────────────────────────

    const handleClearCache = () => {
        Alert.alert(
            'Clear Cache',
            'Are you sure you want to clear all cached data?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.clear()
                            await messaging().subscribeToTopic(FCM_TOPIC)
                            setSettings(defaultSettings)
                            Alert.alert('Done', 'Cache cleared successfully.')
                        } catch (e) {
                            Alert.alert('Error', 'Failed to clear cache.')
                        }
                    },
                },
            ]
        )
    }

    const handleRate = () => {
        Linking.openURL('https://play.google.com/store/apps/details?id=com.sllotteryresult')
    }

    const handlePrivacyPolicy = () => {
        navigation.navigate('webviewer', {
            url: 'https://sllottoriesresult.muisolutions.com',
            lottery: { title_en: 'Privacy Policy' },
        })
    }

    const handleContact = () => {
        Linking.openURL('mailto:gayashanmanoj1995@gmail.com?subject=Lottery App Support')
    }

    // ─── Sub-components ────────────────────────────────────────────────────────

    const SectionHeader = ({ title, delay }) => (
        <Animatable.View animation="fadeInLeft" delay={delay}>
            <Text style={s.sectionHeader}>{title}</Text>
        </Animatable.View>
    )

    const Card = ({ children, delay }) => (
        <Animatable.View animation="fadeInUp" delay={delay} style={s.card}>
            {children}
        </Animatable.View>
    )

    const SettingRow = ({ iconName, iconBg, iconColor, label, sublabel, value, onValueChange, delay }) => (
        <Animatable.View animation="fadeInLeft" delay={delay} style={s.row}>
            <View style={[s.iconWrap, { backgroundColor: iconBg }]}>
                <AntDesign name={iconName} size={18} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.label}>{label}</Text>
                {sublabel ? <Text style={s.sublabel}>{sublabel}</Text> : null}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor={value ? '#fff' : '#f4f3f4'}
                ios_backgroundColor="#E0E0E0"
            />
        </Animatable.View>
    )

    const ActionRow = ({ iconName, iconBg, iconColor, label, sublabel, onPress, delay, destructive, rightEl }) => (
        <Animatable.View animation="fadeInLeft" delay={delay}>
            <TouchableOpacity
                style={s.row}
                onPress={onPress}
                activeOpacity={onPress ? 0.7 : 1}
            >
                <View style={[s.iconWrap, { backgroundColor: iconBg }]}>
                    <AntDesign name={iconName} size={18} color={iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[s.label, destructive && { color: '#e53935' }]}>{label}</Text>
                    {sublabel ? <Text style={s.sublabel}>{sublabel}</Text> : null}
                </View>
                {rightEl ?? <AntDesign name="right" size={14} color="#ccc" />}
            </TouchableOpacity>
        </Animatable.View>
    )

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <View style={Styles.container}>
            <Header title="Settings" />

            <ScrollView
                contentContainerStyle={{ paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
                style={{ backgroundColor: colors.background || '#F5F5F7' }}
            >
                {/* ── Notifications ── */}
                <SectionHeader title="NOTIFICATIONS" delay={80} />
                <Card delay={100}>
                    <SettingRow
                        iconName="bells"
                        iconBg="#E6F1FB"
                        iconColor="#1976D2"
                        label="Enable Notifications"
                        sublabel="Receive lottery result alerts"
                        value={settings.notifications}
                        onValueChange={handleNotificationToggle}
                        delay={120}
                    />
                </Card>

                {/* ── About ── */}
                <SectionHeader title="ABOUT" delay={200} />
                <Card delay={220}>
                    <ActionRow
                        iconName="lock"
                        iconBg="#EEEDFE"
                        iconColor="#5C35CC"
                        label="Privacy Policy"
                        sublabel="Read our privacy policy"
                        onPress={handlePrivacyPolicy}
                        delay={240}
                    />
                    <ActionRow
                        iconName="staro"
                        iconBg="#FFF8E1"
                        iconColor="#F9A825"
                        label="Rate the App"
                        sublabel="Enjoying the app? Leave a review!"
                        onPress={handleRate}
                        delay={260}
                    />
                    <ActionRow
                        iconName="mail"
                        iconBg="#EAF3DE"
                        iconColor="#388E3C"
                        label="Contact Us"
                        sublabel="gayashanmanoj1995@gmail.com"
                        onPress={handleContact}
                        delay={280}
                    />
                    <ActionRow
                        iconName="infocirlceo"
                        iconBg="#E6F1FB"
                        iconColor="#1976D2"
                        label="App Version"
                        onPress={null}
                        delay={300}
                        rightEl={
                            <View style={s.versionBadge}>
                                <Text style={s.versionText}>{pkg.version}</Text>
                            </View>
                        }
                    />
                </Card>

                {/* ── Data ── */}
                <SectionHeader title="DATA" delay={360} />
                <Card delay={380}>
                    <ActionRow
                        iconName="delete"
                        iconBg="#FCEBEB"
                        iconColor="#e53935"
                        label="Clear Cache"
                        sublabel="Remove all stored data and reset settings"
                        onPress={handleClearCache}
                        delay={400}
                        destructive
                    />
                </Card>

                {/* ── Ad Banner ── */}
                {/* <View style={{ alignItems: 'center', marginTop: 24 }}>
                    <GAMBannerAd unitId={adUnitId} sizes={[BannerAdSize.MEDIUM_RECTANGLE]} />
                </View> */}
            </ScrollView>
        </View>
    )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    sectionHeader: {
        fontSize: 11,
        fontWeight: '700',
        color: '#999',
        letterSpacing: 1,
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 8,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        marginHorizontal: 12,
        marginBottom: 4,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(0,0,0,0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.07)',
        gap: 12,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1a1a1a',
    },
    sublabel: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    versionBadge: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    versionText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
})