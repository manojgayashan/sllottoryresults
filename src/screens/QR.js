import { View, Text, StyleSheet, PermissionsAndroid, Platform, TouchableOpacity, ScrollView, Animated } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import Header from '../components/Header'
import Styles from '../constants/Styles'
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera'
import { WebView } from 'react-native-webview'
import Ionicons from 'react-native-vector-icons/Ionicons'
import DLBlotteryList from '../constants/DLBlotteryList'
import { GAMBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = 'ca-app-pub-9079412151911301/2406311027';

const Ball = ({ value, color }) => (
    <View style={[styles.ball, { backgroundColor: color }]}>
        <Text style={styles.ballText}>{value}</Text>
    </View>
)

const NumberRow = ({ label, series, numbers, color }) => (
    <View style={styles.section}>
        <Text style={styles.sectionLabel}>{label}</Text>
        <View style={styles.ballsRow}>
            {series ? <Ball value={series} color="#5b8dee" /> : null}
            {(numbers || []).map((n, i) => <Ball key={i} value={n} color={color} />)}
        </View>
    </View>
)

export default function QR() {
    const { hasPermission, requestPermission } = useCameraPermission()
    const device = useCameraDevice('back')
    const [focusBox, setFocusBox] = useState(null)
    const [scannedUrl, setScannedUrl] = useState(null)
    const [webVisible, setWebVisible] = useState(false)
    const [webLoading, setWebLoading] = useState(true)
    const [canGoBack, setCanGoBack] = useState(false)
    const [canGoForward, setCanGoForward] = useState(false)
    const [ticketData, setTicketData] = useState(null)
    const [resultData, setResultData] = useState(null)
    const [resultVisible, setResultVisible] = useState(false)
    const slideAnim = useRef(new Animated.Value(800)).current
    const isProcessing = useRef(false)
    const webViewRef = useRef(null)
    const ticketDataRef = useRef(null)
    // Track if auto-trigger already fired so subsequent opens are click-only
    const autoTriggered = useRef(false)

    useEffect(() => {
        const askPermission = async () => {
            if (Platform.OS === 'android') {
                try {
                    await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.CAMERA,
                        {
                            title: 'Camera Permission',
                            message: 'This app needs camera access to scan QR codes.',
                            buttonNeutral: 'Ask Me Later',
                            buttonNegative: 'Cancel',
                            buttonPositive: 'OK',
                        }
                    )
                } catch (err) { console.warn(err) }
            } else {
                await requestPermission()
            }
        }
        askPermission()
    }, [])

    const showResult = (data) => {
        setResultData(data)
        setResultVisible(true)
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start()
    }

    const hideResult = () => {
        Animated.timing(slideAnim, { toValue: 800, duration: 250, useNativeDriver: true })
            .start(() => { setResultVisible(false); setResultData(null) })
    }

    const parseTicketData = (raw) => {
        if (!raw) return null
        try {
            const decoded = decodeURIComponent(raw)
            const match = decoded.match(/^([A-Za-z]+(?:\s[A-Za-z]+)+)\s+(\d{3,5})/)
            const dateMatch = decoded.match(/(\d{4}[.\/]\d{2}[.\/]\d{2})/)
            let series = null
            let myNumbers = []
            const seriesAndNumsMatch = decoded.match(/\s([a-zA-Z])\s+([\d\s]+?)\s+\d{3,}[\s\/]/)
            if (seriesAndNumsMatch) {
                series = seriesAndNumsMatch[1].toUpperCase()
                myNumbers = seriesAndNumsMatch[2]
                    .trim()
                    .split(/\s+/)
                    .filter(n => /^\d{1,2}$/.test(n) && parseInt(n) >= 1 && parseInt(n) <= 70)
            }
            if (!match) return null
            return {
                name: match[1].trim(),
                draw: match[2],
                date: dateMatch ? dateMatch[1] : null,
                series,
                myNumbers,
            }
        } catch (e) { return null }
    }

    const extractUrl = (raw) => {
        if (!raw) return null
        const httpsMatch = raw.match(/(https?:\/\/[^\s]+)/)
        if (httpsMatch) return httpsMatch[1]
        const decoded = decodeURIComponent(raw)
        const matched = DLBlotteryList.find(l => decoded.toLowerCase().includes(l.title_en.toLowerCase()))
        if (matched) return `https://www.dlb.lk/result/${matched.number}`
        const wwwMatch = decoded.match(/(www\.[^\s/]+)/)
        if (wwwMatch) return `https://${wwwMatch[1]}`
        return null
    }

    const isValidUrl = (url) => {
        if (!url) return false
        try { new URL(url); return true } catch { return false }
    }

    // autoTrigger=true  → fires postMessage on load (first time)
    // autoTrigger=false → only fires postMessage on click
    const getInjectedJS = (drawNumber, autoTrigger) => `
        (function() {
            var _autoTrigger = ${autoTrigger ? 'true' : 'false'};
            var _alreadySent = false;

            function extractAndSend(row) {
                var cells = Array.from(row.querySelectorAll('td,th'))
                    .map(function(c) { return (c.innerText || '').trim(); })
                    .filter(Boolean);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'DLB_RESULT', cells: cells
                }));
            }

            function run() {
                try {
                    var rows = document.querySelectorAll('tr');
                    var found = false;
                    rows.forEach(function(row) {
                        var text = (row.innerText || '').trim();
                        if (!found && text.includes('${drawNumber}')) {
                            found = true;
                            row.style.backgroundColor = '#fff9c4';
                            row.style.cursor = 'pointer';
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });

                            // Auto trigger on first load
                            if (_autoTrigger && !_alreadySent) {
                                _alreadySent = true;
                                extractAndSend(row);
                            }

                            // Always attach click listener for re-open
                            row.addEventListener('click', function(e) {
                                e.stopPropagation();
                                extractAndSend(row);
                            });

                            // Also attach to parent card if exists
                            var parent = row.closest('a, [onclick], .result-card, .card, .panel, .box');
                            if (parent) {
                                parent.addEventListener('click', function(e) {
                                    e.preventDefault();
                                    extractAndSend(row);
                                });
                            }
                        }
                    });

                    if (!found) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'DLB_DEBUG',
                            bodyText: (document.body.innerText || '').substring(0, 4000)
                        }));
                    }
                } catch(e) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'DLB_ERROR', error: e.toString()
                    }));
                }
            }

            document.readyState === 'complete' ? run() : window.addEventListener('load', run);
            setTimeout(run, 2000);
        })();
        true;
    `

    const parseDLBResult = (cells, ticket) => {
        if (!ticket) return null
        try {
            const secondCell = cells?.[1] || ''
            const seriesMatch = secondCell.match(/^([A-Z])/m)
            const winningSeries = seriesMatch ? seriesMatch[1] : null
            const winningNumbers = secondCell
                .split(/\s+/)
                .filter(n => /^\d{1,2}$/.test(n) && parseInt(n) >= 1 && parseInt(n) <= 70)
            const count = winningNumbers.length
            const myNumbers = (ticket.myNumbers || []).slice(0, count)
            return {
                winningSeries,
                winningNumbers,
                myNumbers,
                mySeries: ticket.series,
            }
        } catch (e) { return null }
    }

    const codeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned: (codes) => {
            'worklet'
            if (codes.length > 0 && !isProcessing.current) {
                isProcessing.current = true
                const code = codes[0]
                setFocusBox(code.frame
                    ? { x: code.frame.x, y: code.frame.y, width: code.frame.width, height: code.frame.height }
                    : { centered: true }
                )
                const ticket = parseTicketData(code.value)
                const cleanUrl = extractUrl(code.value)
                ticketDataRef.current = ticket
                autoTriggered.current = false  // reset for new scan
                setTicketData(ticket)
                setScannedUrl(cleanUrl)
                setTimeout(() => setWebVisible(true), 50)
            }
        }
    })

    const handleClose = () => {
        setWebVisible(false)
        setScannedUrl(null)
        setFocusBox(null)
        setWebLoading(true)
        setCanGoBack(false)
        setCanGoForward(false)
        setTicketData(null)
        ticketDataRef.current = null
        autoTriggered.current = false
        hideResult()
        setTimeout(() => { isProcessing.current = false }, 800)
    }

    if (!hasPermission || device == null) {
        return (
            <View style={Styles.container}>
                <Header title={'Scan QR'} />
                <View style={styles.centered}>
                    <Text style={styles.message}>
                        {!hasPermission ? 'Requesting camera permission...' : 'No camera device found.'}
                    </Text>
                </View>
            </View>
        )
    }

    return (
        <View style={{ flex: 1 }}>
            <Header title={'Scan QR'} />
            <View style={styles.cameraContainer}>
                <Camera style={StyleSheet.absoluteFill} device={device} isActive={!webVisible} codeScanner={codeScanner} />
                {focusBox && !webVisible && (
                    <View style={[
                        focusBox.centered ? styles.centeredBox : styles.focusBox,
                        !focusBox.centered && { left: focusBox.x, top: focusBox.y, width: focusBox.width, height: focusBox.height }
                    ]}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                )}
                <View style={styles.hintContainer}>
                    <Text style={styles.hintText}>Point camera at a QR code</Text>
                </View>
            </View>

            {webVisible && (
                <View style={styles.overlayContainer}>
                    <View style={styles.webHeader}>
                        <Text style={styles.webUrl} numberOfLines={1}>
                            {ticketData?.name} | {ticketData?.draw} | {ticketData?.date}
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={25} color={'rgba(0,0,0,0.4)'} />
                        </TouchableOpacity>
                    </View>

                    {webLoading && (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                    )}

                    {scannedUrl && isValidUrl(scannedUrl) ? (
                        <WebView
                            ref={webViewRef}
                            source={{ uri: scannedUrl }}
                            style={styles.webview}
                            onLoadStart={() => setWebLoading(true)}
                            onLoadEnd={() => {
                                setWebLoading(false)
                                // Mark auto trigger done after first load
                                autoTriggered.current = true
                            }}
                            // First load: autoTrigger=true, subsequent reloads: false (click only)
                            injectedJavaScript={ticketData?.draw ? getInjectedJS(ticketData.draw, !autoTriggered.current) : ''}
                            onMessage={(event) => {
                                try {
                                    const data = JSON.parse(event.nativeEvent.data)
                                    const currentTicket = ticketDataRef.current
                                    if (data.type === 'DLB_RESULT') {
                                        const parsed = parseDLBResult(data.cells, currentTicket)
                                        if (parsed) showResult(parsed)
                                    } else if (data.type === 'DLB_DEBUG') {
                                        console.log('DLB DEBUG:', data.bodyText)
                                    } else if (data.type === 'DLB_ERROR') {
                                        console.warn('DLB ERROR:', data.error)
                                    }
                                } catch (e) { console.warn(e) }
                            }}
                            onNavigationStateChange={(s) => { setCanGoBack(s.canGoBack); setCanGoForward(s.canGoForward) }}
                        />
                    ) : (
                        <View style={styles.centered}>
                            <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                    )}

                    <View style={styles.navBar}>
                        <TouchableOpacity onPress={() => webViewRef.current?.goBack()} style={[styles.navButton, !canGoBack && styles.navButtonDisabled]} disabled={!canGoBack}>
                            <Ionicons name="chevron-back" size={24} color={canGoBack ? '#007AFF' : '#ccc'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => webViewRef.current?.goForward()} style={[styles.navButton, !canGoForward && styles.navButtonDisabled]} disabled={!canGoForward}>
                            <Ionicons name="chevron-forward" size={24} color={canGoForward ? '#007AFF' : '#ccc'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => webViewRef.current?.reload()} style={styles.navButton}>
                            <Ionicons name="refresh" size={22} color="#007AFF" />
                        </TouchableOpacity>
                    </View>

                    {resultVisible && resultData && (
                        <Animated.View style={[styles.resultSheet, { transform: [{ translateY: slideAnim }] }]}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.resultHeader}>
                                    <View>
                                        <Text style={styles.resultTitle}>{ticketData?.name}</Text>
                                        <Text style={styles.resultSub}>Draw #{ticketData?.draw} · {ticketData?.date}</Text>
                                    </View>
                                    <TouchableOpacity onPress={hideResult}>
                                        <Ionicons name="close" size={24} color="rgba(0,0,0,0.35)" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.divider} />

                                <NumberRow
                                    label="Your Numbers"
                                    series={resultData.mySeries}
                                    numbers={resultData.myNumbers}
                                    color="#f0a500"
                                />

                                <View style={styles.divider} />

                                <NumberRow
                                    label="Winning Numbers"
                                    series={resultData.winningSeries}
                                    numbers={resultData.winningNumbers}
                                    color="#e63946"
                                />

                                <View style={styles.divider} />

                                <Text style={styles.disclaimer}>
                                    * the ticket has to be manually verified to be eligible.
                                </Text>
                            </ScrollView>
                        </Animated.View>
                    )}
                </View>
            )}

            <GAMBannerAd unitId={adUnitId} sizes={[BannerAdSize.FULL_BANNER]} />
        </View>
    )
}

const CORNER_SIZE = 20
const CORNER_THICKNESS = 3
const CORNER_COLOR = '#00FF00'

const styles = StyleSheet.create({
    cameraContainer: { flex: 1, overflow: 'hidden', borderRadius: 12, margin: 16 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    message: { fontSize: 16, textAlign: 'center', color: '#333', paddingHorizontal: 24 },
    focusBox: { position: 'absolute' },
    centeredBox: { position: 'absolute', width: 200, height: 200, alignSelf: 'center', top: '50%', marginTop: -100 },
    corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
    topLeft: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
    topRight: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
    hintContainer: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    hintText: { color: '#fff', fontSize: 14 },
    overlayContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', padding: 24, zIndex: 999, paddingTop: 70 },
    webHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f8f8f8', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    webUrl: { flex: 1, fontSize: 15, color: '#000', paddingHorizontal: 10, paddingVertical: 5, fontWeight: '700' },
    webview: { flex: 1, marginTop: -180 },
    loadingContainer: { position: 'absolute', top: 150, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
    loadingText: { color: '#888', fontSize: 14 },
    navBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#f8f8f8', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#e0e0e0', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    navButton: { padding: 8, alignItems: 'center', justifyContent: 'center' },
    navButtonDisabled: { opacity: 0.4 },
    resultSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%', zIndex: 9999, elevation: 20 },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    resultTitle: { fontSize: 20, fontWeight: '800', color: '#111' },
    resultSub: { fontSize: 13, color: '#888', marginTop: 3 },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 14 },
    section: { marginBottom: 4 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
    ballsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
    ball: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    ballText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    disclaimer: { fontSize: 11, color: '#aaa', textAlign: 'center', marginBottom: 8 },
})