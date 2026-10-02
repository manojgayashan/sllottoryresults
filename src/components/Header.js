import * as React from 'react';
import { Appbar } from 'react-native-paper';
import Styles from '../constants/Styles';
import colors from '../constants/colors';

const Header = ({
    leftIcon,
    leftIconOnPress,
    title,
    rightIcon,
    rightIconOnPress,
    backgroundColor,
    bottomContent
}) => (
  <Appbar.Header style={{backgroundColor:backgroundColor?backgroundColor:colors.white,borderBottomWidth:1,borderColor:colors.border}}>
    {leftIcon &&<Appbar.Action icon={leftIcon} onPress={leftIconOnPress} />}
    <Appbar.Content title={title} />
    {rightIcon &&<Appbar.Action icon={rightIcon} onPress={rightIconOnPress} />}
    {bottomContent && bottomContent}
  </Appbar.Header>
);

export default Header;