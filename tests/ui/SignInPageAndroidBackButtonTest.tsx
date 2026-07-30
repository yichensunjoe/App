import {render} from '@testing-library/react-native';

import useAndroidBackButtonHandler from '@hooks/useAndroidBackButtonHandler';

import Navigation from '@libs/Navigation/Navigation';

import {SignInPage} from '@pages/signin/SignInPage';

import {clearSignInData} from '@userActions/Session';

import ONYXKEYS from '@src/ONYXKEYS';

import type {useImperativeHandle as UseImperativeHandle} from 'react';

import React from 'react';

const mockOnyxValues = new Map<string, unknown>();
const mockValidateCodeClearSignInData = jest.fn();

jest.mock(
    '@components/ColorSchemeWrapper',
    () =>
        ({children}: {children: React.ReactNode}) =>
            children,
);
jest.mock('@components/CustomStatusBarAndBackground', () => () => null);
jest.mock(
    '@components/HTMLEngineProvider',
    () =>
        ({children}: {children: React.ReactNode}) =>
            children,
);
jest.mock(
    '@components/ScreenWrapper',
    () =>
        ({children}: {children: React.ReactNode}) =>
            children,
);
jest.mock(
    '@components/ThemeProvider',
    () =>
        ({children}: {children: React.ReactNode}) =>
            children,
);
jest.mock(
    '@components/ThemeStylesContextProvider',
    () =>
        ({children}: {children: React.ReactNode}) =>
            children,
);
jest.mock('@hooks/useAndroidBackButtonHandler', () => jest.fn());
jest.mock('@hooks/useDocumentTitle', () => jest.fn());
jest.mock('@hooks/useLocalize', () => () => ({
    formatPhoneNumber: (value: string) => value,
    translate: (key: string) => key,
}));
jest.mock('@hooks/useOnyx', () => (key: string) => [mockOnyxValues.get(key)]);
jest.mock('@hooks/useResponsiveLayout', () => () => ({
    shouldUseNarrowLayout: false,
}));
jest.mock('@libs/ActiveClientManager', () => ({
    isClientTheLeader: () => true,
    isReady: () => Promise.resolve(),
}));
jest.mock('@libs/Log', () => ({
    warn: jest.fn(),
}));
jest.mock('@libs/Navigation/Navigation', () => ({
    goBack: jest.fn(),
    isNavigationReady: () => Promise.resolve(),
    navigate: jest.fn(),
}));
jest.mock('@libs/Visibility', () => ({
    isVisible: () => true,
}));
jest.mock('@pages/signin/ChooseSSOOrValidateCode', () => () => null);
jest.mock('@pages/signin/EmailDeliveryFailurePage', () => () => null);
jest.mock('@pages/signin/LoginForm', () => () => null);
jest.mock('@pages/signin/SignInLoginContext', () => ({
    LoginProvider: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock(
    '@pages/signin/SignInPageLayout',
    () =>
        ({children}: {children: React.ReactNode}) =>
            children,
);
jest.mock('@pages/signin/SignUpWelcomeForm', () => () => null);
jest.mock('@pages/signin/SMSDeliveryFailurePage', () => () => null);
jest.mock('@pages/signin/UnlinkLoginForm', () => () => null);
jest.mock('@pages/signin/ValidateCodeForm', () => {
    const {useImperativeHandle} = jest.requireActual<{useImperativeHandle: typeof UseImperativeHandle}>('react');

    return ({ref}: {ref?: React.Ref<{clearSignInData: () => void}>}) => {
        useImperativeHandle(ref, () => ({clearSignInData: mockValidateCodeClearSignInData}));
        return null;
    };
});
jest.mock('@userActions/Session', () => ({
    clearSignInData: jest.fn(),
    isSupportalSession: () => false,
}));

describe('SignInPage Android back button', () => {
    const mockedUseAndroidBackButtonHandler = jest.mocked(useAndroidBackButtonHandler);
    const mockedClearSignInData = jest.mocked(clearSignInData);

    beforeEach(() => {
        jest.clearAllMocks();
        mockOnyxValues.clear();
        mockOnyxValues.set(ONYXKEYS.ACTIVE_CLIENTS, ['client']);
    });

    it('keeps the standalone initial SignInPage back handler enabled', () => {
        render(<SignInPage />);

        const [navigateBack, isEnabled] = mockedUseAndroidBackButtonHandler.mock.lastCall ?? [];
        expect(isEnabled).toBe(true);
        expect(navigateBack?.()).toBe(false);
        expect(Navigation.goBack).toHaveBeenCalledTimes(1);
    });

    it('does not register a nested handler when rendered inside SignInModal', () => {
        render(<SignInPage shouldHandleAndroidBackButton={false} />);

        expect(mockedUseAndroidBackButtonHandler).toHaveBeenLastCalledWith(expect.any(Function), false);
    });

    it('returns to the initial form from an intermediate sign-up step', () => {
        mockOnyxValues.set(ONYXKEYS.CREDENTIALS, {login: 'new-user@example.com'});
        mockOnyxValues.set(ONYXKEYS.ACCOUNT, {
            accountExists: false,
            domainControlled: false,
            validated: false,
        });

        render(<SignInPage />);

        const [navigateBack] = mockedUseAndroidBackButtonHandler.mock.lastCall ?? [];
        expect(navigateBack?.()).toBe(true);
        expect(mockedClearSignInData).toHaveBeenCalledTimes(1);
        expect(Navigation.goBack).not.toHaveBeenCalled();
    });

    it('returns to the initial form from the validate-code step', () => {
        const login = 'existing-user@example.com';
        mockOnyxValues.set(ONYXKEYS.CREDENTIALS, {login});
        mockOnyxValues.set(ONYXKEYS.ACCOUNT, {
            accountExists: true,
            primaryLogin: login,
            validated: false,
        });

        render(<SignInPage />);

        const [navigateBack] = mockedUseAndroidBackButtonHandler.mock.lastCall ?? [];
        expect(navigateBack?.()).toBe(true);
        expect(mockValidateCodeClearSignInData).toHaveBeenCalledTimes(1);
        expect(Navigation.goBack).not.toHaveBeenCalled();
    });
});
