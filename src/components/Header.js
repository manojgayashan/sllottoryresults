import * as React from 'react';
import { Appbar } from 'react-native-paper';
import Styles from '../constants/Styles';
import colors from '../constants/colors';

const Header = ({
    leftIcon,
    leftIconOnPress,
    title,
    rightIcon,
    rightIconOnPress
}) => (
  <Appbar.Header style={{backgroundColor:colors.white}}>
    {leftIcon &&<Appbar.Action icon={leftIcon} onPress={leftIconOnPress} />}
    <Appbar.Content title={title} />
    {rightIcon &&<Appbar.Action icon={rightIcon} onPress={rightIconOnPress} />}
  </Appbar.Header>
);

export default Header;