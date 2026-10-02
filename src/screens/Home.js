import { View, Text, Image, TouchableOpacity, StatusBar, ScrollView, Modal, TextInput, Pressable, StyleSheet } from 'react-native'
import React, { useState, useCallback } from 'react'
import Styles from '../constants/Styles'
import Header from '../components/Header'
import { Button } from 'react-native-paper'

import AntDesign from 'react-native-vector-icons/AntDesign';
import colors from '../constants/colors'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import HomeData from '../constants/HomeData'
import NLBlotteryList from '../constants/NLBlotteryList'
import DLBlotteryList from '../constants/DLBlotteryList'
import * as Animatable from 'react-native-animatable';
import { GAMBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

const adUnitId = __DEV__ ? TestIds.GAM_BANNER : 'ca-app-pub-9079412151911301/9661313073';
const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const lotteryOptions = [
  ...NLBlotteryList.map((lottery) => ({ lottery, type: 'nlb', company: HomeData[0] })),
  ...DLBlotteryList.map((lottery) => ({ lottery, type: 'dlb', company: HomeData[1] })),
]

const formatDate = (date) => {
  if (!date) return ''
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

const getMonthDays = (monthDate) => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array(firstWeekday).fill(null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day))
  }

  while (days.length % 7 !== 0) days.push(null)
  return days
}

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
  const [selectedOption, setSelectedOption] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [drawNumber, setDrawNumber] = useState('')
  const [lotteryPickerOpen, setLotteryPickerOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const loadRecent = async () => {
    try {
      const raw = await AsyncStorage.getItem('search_history')
      const list = raw ? JSON.parse(raw) : []
      setRecent(list.slice(0, 4))
    } catch (e) {
      console.log('loadRecent error', e)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadRecent()
    }, [])
  )

  const openSearch = () => {
    if (!selectedOption) return

    navigation.navigate('lotteryresult', {
      lottery: selectedOption.lottery,
      data: selectedOption.company,
      type: selectedOption.type,
      selectedDate: formatDate(selectedDate) || null,
      drawNumber: drawNumber.trim(),
      autoSearch: true,
    })
  }

  return (
    <View style={Styles.container}>
      <Header title={getGreeting()}
        backgroundColor={colors.white} />

      <View style={homeStyles.headerSearchContainer}>
        {/* <View style={homeStyles.searchPanel}> */}
        <TouchableOpacity
          accessibilityRole="button"
          style={homeStyles.lotteryDropdown}
          onPress={() => setLotteryPickerOpen(true)}
        >
          <View style={homeStyles.dropdownText}>
            <Text style={homeStyles.fieldLabel}>Lottery</Text>
            <Text numberOfLines={1} style={[homeStyles.fieldValue, !selectedOption && homeStyles.placeholder]}>
              {selectedOption ? selectedOption.lottery.title_en : 'Choose a lottery'}
            </Text>
          </View>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={homeStyles.searchFieldsRow}>
          <View style={homeStyles.dateFieldGroup}>
            <TouchableOpacity
              accessibilityRole="button"
              style={[homeStyles.field, homeStyles.dateField]}
              onPress={() => setDatePickerOpen(true)}
            >
              <Text style={homeStyles.fieldLabel}>Draw date</Text>
              <View style={homeStyles.fieldValueRow}>
                <Text numberOfLines={1} style={[homeStyles.fieldValue, !selectedDate && homeStyles.placeholder]}>
                  {selectedDate ? formatDate(selectedDate) : 'Any date'}
                </Text>
                <MaterialIcons name="calendar-today" size={17} color={colors.subText} />
              </View>
            </TouchableOpacity>
            {selectedDate && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Clear selected draw date"
                style={homeStyles.clearDateButton}
                onPress={() => setSelectedDate(null)}
              >
                <MaterialIcons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[homeStyles.field, homeStyles.numberField]}>
            <Text style={homeStyles.fieldLabel}>Draw number</Text>
            <TextInput
              accessibilityLabel="Draw number"
              value={drawNumber}
              onChangeText={setDrawNumber}
              placeholder="Optional"
              placeholderTextColor={colors.subText}
              keyboardType="number-pad"
              returnKeyType="search"
              onSubmitEditing={openSearch}
              style={homeStyles.numberInput}
            />
          </View>
        </View>

        <Button
          mode="contained"
          icon="magnify"
          disabled={!selectedOption}
          onPress={openSearch}
          style={homeStyles.searchButton}
          contentStyle={homeStyles.searchButtonContent}
          buttonColor={selectedOption?.company.color || colors.primary}
          textColor={colors.white}
        >
          Search
        </Button>
        {/* </View> */}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={Styles.innerContainer}>
          <View style={homeStyles.recentSection}>
            <View style={homeStyles.recentHeader}>
              <Text style={homeStyles.recentTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SearchHistory')}>
                <Text style={homeStyles.viewAll}>View all</Text>
              </TouchableOpacity>
            </View>
            {recent.length === 0 ? (
              <View style={homeStyles.emptyRecent}>
                <View style={homeStyles.emptyRecentIcon}>
                  <MaterialIcons name="history" size={25} color={colors.primary} />
                </View>
                <View style={homeStyles.emptyRecentCopy}>
                  <Text style={homeStyles.emptyRecentTitle}>No recent searches yet</Text>
                  <Text style={homeStyles.emptyRecentHint}>Your searches will appear here.</Text>
                </View>
                {/* <MaterialIcons name="arrow-forward" size={19} color={colors.subText} /> */}
              </View>
            ) : (
              <View style={homeStyles.recentGrid}>
                {recent.slice(0, 4).map((item) => (
                  <TouchableOpacity
                    key={`${item.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${item.lotteryTitle || item.lottery?.title_en || 'lottery'} result`}
                    style={homeStyles.recentItem}
                    onPress={() => navigation.navigate('lotteryresult', {
                      lottery: item.lottery,
                      type: item.type,
                      selectedDate: item.date || null,
                      drawNumber: item.drawNumber || '',
                      fromHistory: true,
                    })}
                  >
                    <View style={homeStyles.recentCircle}>
                      <Image
                        source={item.lottery?.logo || require('../assets/app/icon.jpg')}
                        style={homeStyles.recentLogo}
                      />

                      {(item.date || item.drawNumber) && (
                        <Text style={homeStyles.recentCircleName}>
                          {item.date || `Draw: ${item.drawNumber}`}
                        </Text>
                      )}

                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={homeStyles.recentTitle}>Explore</Text>
          <View style={[Styles.row, { justifyContent: 'space-between', marginTop: 16 }]}>
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

        </View>

      </ScrollView>

        <View style={{ marginTop: 8, alignItems: 'center' }}>
          <GAMBannerAd unitId={adUnitId} sizes={[BannerAdSize.ANCHORED_ADAPTIVE_BANNER]} />
        </View>
        
      <Modal visible={lotteryPickerOpen} transparent animationType="fade" onRequestClose={() => setLotteryPickerOpen(false)}>
        <Pressable style={homeStyles.modalBackdrop} onPress={() => setLotteryPickerOpen(false)}>
          <Pressable style={homeStyles.pickerSheet} onPress={(event) => event.stopPropagation()}>
            <View style={homeStyles.modalHeader}>
              <Text style={homeStyles.modalTitle}>Choose a lottery</Text>
              <TouchableOpacity accessibilityLabel="Close lottery list" onPress={() => setLotteryPickerOpen(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {[
                { type: 'nlb', title: 'National Lotteries Board' },
                { type: 'dlb', title: 'Development Lotteries Board' },
              ].map((group) => (
                <View key={group.type}>
                  <Text style={homeStyles.groupTitle}>{group.title}</Text>
                  {lotteryOptions.filter((option) => option.type === group.type).map((option) => (
                    <TouchableOpacity
                      key={`${option.type}-${option.lottery.number}`}
                      style={homeStyles.lotteryOption}
                      onPress={() => {
                        setSelectedOption(option)
                        setLotteryPickerOpen(false)
                      }}
                    >
                      <Image source={option.lottery.logo} style={homeStyles.lotteryLogo} />
                      <View style={homeStyles.lotteryOptionText}>
                        <Text style={homeStyles.lotteryName}>{option.lottery.title_en}</Text>
                        <Text style={homeStyles.lotterySubtitle}>{option.lottery.title_si}</Text>
                      </View>
                      {selectedOption?.type === option.type && selectedOption.lottery.number === option.lottery.number && (
                        <MaterialIcons name="check" size={20} color={colors.secondary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={datePickerOpen} transparent animationType="fade" onRequestClose={() => setDatePickerOpen(false)}>
        <Pressable style={homeStyles.modalBackdrop} onPress={() => setDatePickerOpen(false)}>
          <Pressable style={homeStyles.calendarSheet} onPress={(event) => event.stopPropagation()}>
            <View style={homeStyles.modalHeader}>
              <Text style={homeStyles.modalTitle}>Draw date</Text>
              <TouchableOpacity accessibilityLabel="Close date picker" onPress={() => setDatePickerOpen(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={homeStyles.monthControls}>
              <TouchableOpacity
                accessibilityLabel="Previous month"
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              >
                <MaterialIcons name="chevron-left" size={28} color={colors.text} />
              </TouchableOpacity>
              <Text style={homeStyles.monthTitle}>{calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
              <TouchableOpacity
                accessibilityLabel="Next month"
                disabled={calendarMonth.getFullYear() === new Date().getFullYear() && calendarMonth.getMonth() >= new Date().getMonth()}
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              >
                <MaterialIcons name="chevron-right" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={homeStyles.calendarGrid}>
              {weekDays.map((day, index) => <Text key={`${day}-${index}`} style={homeStyles.weekDay}>{day}</Text>)}
              {getMonthDays(calendarMonth).map((date, index) => {
                const today = new Date()
                const disabled = date && date > new Date(today.getFullYear(), today.getMonth(), today.getDate())
                const selected = date && selectedDate && date.toDateString() === selectedDate.toDateString()
                return date ? (
                  <TouchableOpacity
                    key={`day-${index}`}
                    disabled={disabled}
                    style={[homeStyles.dayCell, selected && homeStyles.selectedDay, disabled && homeStyles.disabledDay]}
                    onPress={() => {
                      setSelectedDate(date)
                      setDatePickerOpen(false)
                    }}
                  >
                    <Text style={[homeStyles.dayText, selected && homeStyles.selectedDayText]}>{date.getDate()}</Text>
                  </TouchableOpacity>
                ) : <View key={`blank-${index}`} style={homeStyles.dayCell} />
              })}
            </View>
            <View style={homeStyles.calendarActions}>
              <Button mode="text" onPress={() => { setSelectedDate(null); setDatePickerOpen(false) }}>Clear date</Button>
              <Button mode="text" onPress={() => setDatePickerOpen(false)}>Cancel</Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  )
}

const homeStyles = StyleSheet.create({
  headerSearchContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchPanel: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  searchTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  lotteryDropdown: {
    minHeight: 56,
    paddingHorizontal: 12,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { flex: 1, marginRight: 8 },
  fieldLabel: { color: colors.subText, fontSize: 11, marginBottom: 3 },
  fieldValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  placeholder: { color: colors.subText, fontWeight: '400' },
  searchFieldsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  field: { minHeight: 58, borderColor: colors.border, borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7 },
  dateFieldGroup: { flex: 1, position: 'relative' },
  dateField: { flex: 1, justifyContent: 'center' },
  clearDateButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    // borderTopRightRadius:6
  },
  numberField: { flex: 1 },
  fieldValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  numberInput: { color: colors.text, fontSize: 14, padding: 0, height: 22 },
  searchButton: { marginTop: 10, borderRadius: 6 },
  searchButtonContent: { minHeight: 44 },
  recentSection: { marginBottom: 8 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  recentTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  viewAll: { color: '#007bff', fontSize: 13 },
  emptyRecent: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  emptyRecentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF4DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emptyRecentCopy: { flex: 1 },
  emptyRecentTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  emptyRecentHint: { color: colors.subText, fontSize: 11, marginTop: 3 },
  recentGrid: { flexDirection: 'row'},
  recentItem: { width: '25%', alignItems: 'center' },
  recentCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  recentLogo: { width: 50, height: 30, resizeMode: 'contain' },
  recentCircleName: { color: colors.text, fontSize: 10, fontWeight: '600', lineHeight: 13, textAlign: 'center', marginTop: 2,width:72 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.45)' },
  pickerSheet: { maxHeight: '82%', backgroundColor: colors.white, borderRadius: 8, padding: 16 },
  calendarSheet: { backgroundColor: colors.white, borderRadius: 8, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  groupTitle: { color: colors.subText, fontSize: 12, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  lotteryOption: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 6 },
  lotteryLogo: { width: 46, height: 40, resizeMode: 'contain', marginRight: 10 },
  lotteryOptionText: { flex: 1 },
  lotteryName: { color: colors.text, fontWeight: '600' },
  lotterySubtitle: { color: colors.subText, fontSize: 12, marginTop: 2 },
  monthControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  monthTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekDay: { width: '14.28%', textAlign: 'center', color: colors.subText, fontSize: 12, paddingBottom: 8 },
  dayCell: { width: '14.28%', height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  dayText: { color: colors.text },
  selectedDay: { backgroundColor: colors.primary },
  selectedDayText: { color: colors.white, fontWeight: '700' },
  disabledDay: { opacity: 0.35 },
  calendarActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
})