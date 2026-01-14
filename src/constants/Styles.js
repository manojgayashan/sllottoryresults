import { Dimensions, StyleSheet } from "react-native";
import colors from "./colors";

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const Styles = StyleSheet.create({
    container:{
        backgroundColor:colors.background,
        flex:1
    },
    innerContainer:{
        padding:16,
    },
    row:{
        flexDirection:'row',
        
    },
    homeCard:{
        borderRadius:12,
        backgroundColor:colors.white,
        padding:16,
        paddingHorizontal:12,
        width:(windowWidth/2)-24,
        alignItems:'center'
    },
    lotteryCard:{
        paddingHorizontal:16,
        paddingVertical:10,
        borderRadius:8,
        marginBottom:8,
        flexDirection:'row',
        alignItems:'center'
    }
})

export default Styles