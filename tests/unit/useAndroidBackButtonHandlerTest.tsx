import {renderHook} from '@testing-library/react-native';

import useAndroidBackButtonHandler from '@hooks/useAndroidBackButtonHandler/index.android';

import type {useEffect as UseEffect} from 'react';

import {BackHandler} from 'react-native';

jest.mock('@react-navigation/native', () => {
    const {useEffect} = jest.requireActual<{useEffect: typeof UseEffect}>('react');

    return {
        useFocusEffect: (callback: () => void | (() => void)) => useEffect(callback, [callback]),
    };
});

describe('useAndroidBackButtonHandler', () => {
    const remove = jest.fn();
    const callback = jest.fn(() => true);
    let addEventListenerSpy: jest.SpiedFunction<typeof BackHandler.addEventListener>;

    beforeEach(() => {
        jest.clearAllMocks();
        addEventListenerSpy = jest.spyOn(BackHandler, 'addEventListener').mockReturnValue({remove});
    });

    afterEach(() => {
        addEventListenerSpy.mockRestore();
    });

    it('registers and removes the Android back handler when enabled', () => {
        const {unmount} = renderHook(() => useAndroidBackButtonHandler(callback));

        expect(addEventListenerSpy).toHaveBeenCalledWith('hardwareBackPress', callback);

        unmount();
        expect(remove).toHaveBeenCalledTimes(1);
    });

    it('does not register a handler when disabled', () => {
        const {rerender} = renderHook(({isEnabled}) => useAndroidBackButtonHandler(callback, isEnabled), {
            initialProps: {isEnabled: false},
        });

        expect(addEventListenerSpy).not.toHaveBeenCalled();

        rerender({isEnabled: true});
        expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

        rerender({isEnabled: false});
        expect(remove).toHaveBeenCalledTimes(1);
    });
});
