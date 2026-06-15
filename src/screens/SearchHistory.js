import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Button } from 'react-native-paper'
import Header from '../components/Header'

export default function SearchHistory() {
  const navigation = useNavigation()
  const [history, setHistory] = useState([])

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem('search_history')
      const list = raw ? JSON.parse(raw) : []
      setHistory(list)
    } catch (e) {
      console.log('loadHistory error', e)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadHistory()
    }, [])
  )

  const clearHistory = async () => {
    Alert.alert('Clear history', 'Are you sure you want to clear search history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('search_history')
            setHistory([])
          } catch (e) {
            console.log('clearHistory error', e)
          }
        },
      },
    ])
  }

  const onSelect = (item) => {
    // Navigate back to LotteryResult with params from history
    navigation.navigate('LotteryResult', {
      lottery: item.lottery,
      type: item.type,
      selectedDate: item.date || null,
      drawNumber: item.drawNumber || '',
      fromHistory: true,
    })
  }

  const deleteEntry = async (id) => {
    try {
      const raw = await AsyncStorage.getItem('search_history')
      const list = raw ? JSON.parse(raw) : []
      const filtered = list.filter((i) => i.id !== id)
      await AsyncStorage.setItem('search_history', JSON.stringify(filtered))
      setHistory(filtered)
    } catch (e) {
      console.log('deleteEntry error', e)
    }
  }

  const onDelete = (item) => {
    Alert.alert('Delete', 'Remove this search from history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(item.id) },
    ])
  }

  const renderItem = ({ item }) => {
    const when = item.timestamp ? new Date(item.timestamp).toLocaleString() : ''
    return (
      <View style={styles.row}>
        <TouchableOpacity style={styles.leftTouchable} onPress={() => onSelect(item)}>
          <View style={styles.left}>
            <Text style={styles.title}>{item.lotteryTitle || item.lottery?.title_en || item.lottery?.name || 'Lottery'}</Text>
            <Text style={styles.sub}>{item.date ? `Date: ${item.date}` : ''} {item.drawNumber ? `Draw: ${item.drawNumber}` : ''}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.right}>
          <TouchableOpacity onPress={() => onDelete(item)} style={styles.deleteButton}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.time}>{when}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>

              <Header
        title={'Search History'}
        leftIcon={'arrow-left'}
        leftIconOnPress={() => navigation.goBack()}
        rightIcon={'delete'}
      />
      {/* <View style={styles.headerRow}>
        <Text style={styles.header}></Text>
        <Button mode="text" onPress={clearHistory}>Clear</Button>
      </View> */}

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No search history yet.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(i) => `${i.id}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24,paddingHorizontal:12 }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1},
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  header: { fontSize: 18, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666' },
  row: { flexDirection: 'row', paddingVertical: 12, borderWidth: 1, borderColor: '#dedcdc',marginTop:10, borderRadius: 8, paddingHorizontal: 12,backgroundColor:'#fff' },
  leftTouchable: { flex: 1 },
  left: { flex: 1 },
  right: { justifyContent: 'center', paddingLeft: 8,alignItems:'flex-end' },
  title: { fontSize: 16, fontWeight: '600' },
  sub: { color: '#666', marginTop: 4 },
  time: { color: '#999', fontSize: 12, textAlign: 'right' },
  deleteButton: { marginBottom: 6, alignItems: 'center',fontSize:12 },
  deleteText: { color: '#d00', fontSize: 12, fontWeight: '700' },
})