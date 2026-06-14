import React, { useMemo, useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native'
import { WebView } from 'react-native-webview'
import Header from '../components/Header'
import Styles from '../constants/Styles'
import colors from '../constants/colors'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Button } from 'react-native-paper'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import * as Animatable from 'react-native-animatable'

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const buildCalendarDays = (monthDate, today) => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay()
  const monthDays = new Date(year, month + 1, 0).getDate()

  const days = []
  for (let blank = 0; blank < startDay; blank += 1) {
    days.push({ empty: true })
  }

  for (let day = 1; day <= monthDays; day += 1) {
    const date = new Date(year, month, day)
    const disabled = date > today
    days.push({ day, date, disabled })
  }

  while (days.length % 7 !== 0) {
    days.push({ empty: true })
  }

  return days
}

const formatDate = (date) => {
  if (!date) return ''
  const yy = date.getFullYear()
  const mm = `${date.getMonth() + 1}`.padStart(2, '0')
  const dd = `${date.getDate()}`.padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export default function LotteryResult() {
  const navigation = useNavigation()
  const route = useRoute()
  const lottery = route.params?.lottery
  const data = route.params?.data
  const type = route.params?.type

  const today = useMemo(() => new Date(), [])
  const [selectedDate, setSelectedDate] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [drawNumber, setDrawNumber] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [shouldTriggerModal, setShouldTriggerModal] = useState(false)
  const webviewRef = useRef(null)

  const [webKey, setWebKey] = useState(0)

  const isDlb = type === 'dlb'
  const getDlbInjectScript = (dateValue, drawValue, lotteryId) => `
    (function(){
      try {
        const lotId = ${lotteryId || 0};
        const dateVal = ${dateValue ? `'${dateValue}'` : "''"};
        const drawVal = ${drawValue ? `'${drawValue}'` : "''"};

        if (lotId) {
          const dateInput = document.querySelector('#datepicker2A' + lotId);
          if (dateInput && dateVal) {
            dateInput.value = dateVal;
            dateInput.dispatchEvent(new Event('input', { bubbles: true }));
            dateInput.dispatchEvent(new Event('change', { bubbles: true }));
          }

          const drawInput = document.querySelector('#drawNo' + lotId);
          if (drawInput && drawVal) {
            drawInput.value = drawVal;
            drawInput.dispatchEvent(new Event('input', { bubbles: true }));
            drawInput.dispatchEvent(new Event('change', { bubbles: true }));
          }

          const checkNowAnchor = document.querySelector('a[onclick*="check_result(' + lotId + ')"]');
          const runCheck = () => {
            if (typeof window.check_result === 'function') {
              window.check_result(lotId);
            } else if (typeof check_result === 'function') {
              check_result(lotId);
            } else {
              console.log('DLB check_result not ready yet');
              window.setTimeout(runCheck, 300);
            }
          }
          if (checkNowAnchor) {
            checkNowAnchor.click();
          } else {
            runCheck();
          }

          const disableTouchAndClicks = () => {
            const cancel = (event) => {
              event.preventDefault();
              event.stopPropagation();
              return false;
            };
            const interactive = document.querySelectorAll('a, button, input, select, textarea, label');
            interactive.forEach((el) => {
              el.style.pointerEvents = 'none';
              el.onclick = null;
              el.onmousedown = null;
              el.onmouseup = null;
              el.ontouchstart = null;
              el.ontouchend = null;
              el.ontouchmove = null;
            });
            ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'touchmove', 'pointerdown', 'pointerup', 'pointermove'].forEach((evt) => {
              document.addEventListener(evt, cancel, true);
            });
          };
          disableTouchAndClicks();

          const styleModal = () => {
            const modal = document.querySelector('.bs-example-modal-lg001, #lotterymodel');
            if (modal) {
              modal.style.marginTop = '480px';
            } else {
              const style = document.createElement('style');
              style.innerHTML = '.bs-example-modal-lg001 { margin-top: 480px !important; } #lotterymodel { margin-top: 480px !important; }';
              document.head.appendChild(style);
            }
          };
          styleModal();
        }
      } catch(e) {
        console.log('DLB inject error', e);
      }
      true;
    })();
  `

  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth, today), [calendarMonth, today])

  const lotteryTitle = lottery?.title_en || 'Lottery Result'
  const lotterySubtitle = lottery?.title_si ? `(${lottery.title_si})` : ''

  // Initialize with all results
  useEffect(() => {
    if (type === 'nlb') {
      const name = lottery?.name || ''
      setResultUrl(`https://www.nlb.lk/results/${name}`)
    } else {
      const number = lottery?.number || ''
      setResultUrl(`https://www.dlb.lk/result/${number}`)
    }
  }, [lottery, type])

  const onSearch = () => {
    setLoading(true)
    setWebKey(webKey + 1) // Force WebView to remount and reset any previous state
    // if (!selectedDate && !drawNumber) return
    let url = ''

    if (type === 'nlb') {
      const name = lottery?.name || ''
      if (selectedDate && !drawNumber) {
        // Date only
        const formattedDate = formatDate(selectedDate)
        url = `https://www.nlb.lk/results/${name}/${formattedDate}`
        setLoading(false)
      } else if (!selectedDate && drawNumber) {
        // Draw number only
        url = `https://www.nlb.lk/results/${name}/${drawNumber}`
        setLoading(false)
      } else if (selectedDate && drawNumber) {
        // Both date and draw number
        const formattedDate = formatDate(selectedDate)
        url = `https://www.nlb.lk/results/${name}/${formattedDate}/${drawNumber}`
        setLoading(false)
      }
      else {
        url = `https://www.nlb.lk/results/${name}`
        setLoading(false)
      }
    } else {
      const number = lottery?.number || ''
      if (selectedDate && !drawNumber) {
        // Date only
        const formattedDate = formatDate(selectedDate)
        url = `https://www.dlb.lk/result/${number}?date=${formattedDate}`
        setLoading(false)
      } else if (!selectedDate && drawNumber) {
        // Draw number only
        url = `https://www.dlb.lk/result/${number}?draw=${drawNumber}`
        setLoading(false)
      } else {
        // Both
        const formattedDate = formatDate(selectedDate)
        url = `https://www.dlb.lk/result/${number}?date=${formattedDate}&draw=${drawNumber}`
        setLoading(false)
      }
    }
    // If this is a DLB search with either date or draw, mark to trigger modal after load
    if (type === 'dlb' && (selectedDate || drawNumber)) {
      url = `https://www.dlb.lk/lottery/en`
      setShouldTriggerModal(true)
    }
    console.log('Navigating to URL:', url)
    setResultUrl(url)
  }

  return (
    <View style={Styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle={'dark-content'} />
      <Header
        title={lotteryTitle}
        leftIcon={'arrow-left'}
        leftIconOnPress={() => navigation.goBack()}
      />
      {
        loading &&
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', flex: 1, zIndex: 10 }]}>
          <Animatable.Image source={require('../assets/app/logo.png')} style={{ width: 100, height: 100 }} animation={'flash'} duration={5000} iterationCount="infinite" />
        </View>
      }
      <Animatable.View animation="fadeInUp" duration={400}>
        <View style={localStyles.card}>

          <View style={localStyles.searchPanel}>
            <TouchableOpacity style={localStyles.dropdownInput} onPress={() => setCalendarOpen(!calendarOpen)}>
              {/* <Text style={localStyles.smallLabel}>Draw Date</Text> */}
              <View style={localStyles.dropdownInner}>
                <Text style={localStyles.inputText}>{selectedDate ? formatDate(selectedDate) : 'Draw date'}</Text>
                <MaterialIcons name={calendarOpen ? 'arrow-drop-up' : 'arrow-drop-down'} size={22} color={colors.text} />
              </View>
            </TouchableOpacity>

            <View style={localStyles.textInputWrapper}>
              {/* <Text style={localStyles.smallLabel}>Draw #</Text> */}
              <TextInput
                value={drawNumber}
                onChangeText={setDrawNumber}
                placeholder="Draw No."
                keyboardType="numeric"
                style={localStyles.inputCompact}
              />
            </View>

            <Button
              mode="contained"
              onPress={onSearch}
              // disabled={!selectedDate && !drawNumber}
              style={[localStyles.searchButtonCompact,{backgroundColor: type === 'nlb' ? '#12D1E0' : '#D42E2B'}]}
            >
              Go
            </Button>
          </View>
        </View>
      </Animatable.View>
      <View style={{ flex: 1}}>
        {resultUrl ? (
          <View style={{ flex: 1 }}>
            <WebView
              ref={webviewRef}
              key={webKey}
              source={{ uri: resultUrl }}
              style={{ flex: 1, marginTop: type === 'nlb' ? -240 : -480  }}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
              mixedContentMode="always"
              scalesPageToFit={true}
              bounces={false}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => {
                setLoading(false)
                if (isDlb && webviewRef.current && shouldTriggerModal) {
                  try {
                    const dateParam = selectedDate ? formatDate(selectedDate) : ''
                    const drawParam = drawNumber || ''
                    // setWebKey(webKey + 1) // Force WebView to remount and run the new script
                    webviewRef.current.injectJavaScript(getDlbInjectScript(dateParam, drawParam, lottery?.number))
                  } catch (e) {
                    console.log('inject error', e)
                  }
                  setShouldTriggerModal(false)
                }
              }}
              onError={(e) => {
                console.log('WebView onError', e.nativeEvent || e)
                setLoading(false)
                setShouldTriggerModal(false)
                Alert.alert('Load error', 'Failed to load the page. Please try again.')
              }}
              onHttpError={(e) => {
                console.log('WebView onHttpError', e.nativeEvent || e)
                setLoading(false)
                setShouldTriggerModal(false)
                Alert.alert('HTTP error', `HTTP ${e.nativeEvent.statusCode}`)
              }}
            />
          </View>
        ) : (
          <View style={localStyles.placeholderContainer}>
            <Text style={localStyles.placeholderText}>Enter draw date and draw number, then tap Search to see the result page.</Text>
          </View>
        )}
      </View>

      {calendarOpen && (
        <View style={localStyles.calendarOverlay}>
          <TouchableOpacity style={localStyles.calendarBackground} activeOpacity={1} onPress={() => setCalendarOpen(false)} />
          <View style={localStyles.calendarDropdownOverlay}>
            <View style={localStyles.calendarHeader}>
              <Button
                mode="text"
                compact
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              >
                Prev
              </Button>
              <Text style={localStyles.calendarMonth}>{calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
              <Button
                mode="text"
                compact
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              >
                Next
              </Button>
            </View>

            <View style={localStyles.calendarWeekRow}>
              {dayNames.map((day) => (
                <Text key={day} style={localStyles.calendarWeekDay}>{day}</Text>
              ))}
            </View>
            <View style={localStyles.calendarGrid}>
              {calendarDays.map((item, index) => {
                if (item.empty) {
                  return <View key={index} style={localStyles.calendarCell} />
                }
                const isSelected = selectedDate && item.date.toDateString() === selectedDate.toDateString()
                return (
                  <TouchableOpacity
                    key={index}
                    disabled={item.disabled}
                    style={[
                      localStyles.calendarCell,
                      item.disabled && localStyles.disabledDay,
                      isSelected && localStyles.selectedDay,
                    ]}
                    onPress={() => {
                      setSelectedDate(item.date)
                      setCalendarOpen(false)
                    }}
                  >
                    <Text style={[localStyles.calendarDayLabel, item.disabled && localStyles.disabledText]}>{item.day}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const localStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    color: colors.text,
    marginBottom: 6,
    fontWeight: '600',
  },
  value: {
    marginBottom: 12,
    color: colors.text,
    fontSize: 16,
  },
  dateSelector: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateText: {
    color: colors.text,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: '700',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calendarWeekDay: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    color: colors.text,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  calendarCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderRadius: 4,
  },
  calendarDayLabel: {
    color: colors.text,
  },
  selectedDay: {
    backgroundColor: colors.primary,
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledText: {
    color: colors.border,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: colors.text,
  },
  searchButton: {
    marginTop: 4,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderText: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 16,
  },
  searchPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownInput: {
    flex: 1.4,
    backgroundColor: colors.background,
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginRight: 8,
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginRight: 8,
  },
  dropdownInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smallLabel: {
    color: colors.text,
    fontSize: 12,
    marginBottom: 4,
  },
  inputText: {
    color: colors.text,
  },
  inputCompact: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 40,
    color: colors.text,
  },
  searchButtonCompact: {
    height: 40,
    justifyContent: 'center',
    width: 70,
  },
  calendarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  calendarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  calendarDropdownOverlay: {
    position: 'absolute',
    top: 72,
    left: 16,
    right: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
})
