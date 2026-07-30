import {useFocusEffect} from '@react-navigation/native';
import {useCallback} from 'react';
import {BackHandler} from 'react-native';

import type UseAndroidBackButtonHandlerCallback from './type';

export default function useAndroidBackButtonHandler(callback: UseAndroidBackButtonHandlerCallback, isEnabled = true) {
    useFocusEffect(
        useCallback(() => {
            if (!isEnabled) {
                return;
            }

            const backHandler = BackHandler.addEventListener('hardwareBackPress', callback);
            return () => backHandler.remove();
        }, [callback, isEnabled]),
    );
}
