import {render} from '@testing-library/react-native';

import Navigation from '@libs/Navigation/Navigation';

import SignInModal from '@pages/signin/SignInModal';

import type {useImperativeHandle as UseImperativeHandle} from 'react';

import React from 'react';

const mockNavigateBack = jest.fn(() => false);
const mockSignInPageProps = jest.fn();
const mockAndroidBackHandlers: Array<() => boolean> = [];
let mockHeaderBackButtonPress: (() => void) | undefined;
let mockShouldAttachSignInPageRef = true;

jest.mock('@components/HeaderWithBackButton', () => ({onBackButtonPress}: {onBackButtonPress: () => void}) => {
    mockHeaderBackButtonPress = onBackButtonPress;
    return null;
});
jest.mock('@components/OnyxListItemProvider', () => ({
    useSession: () => ({authTokenType: 'anonymousAccount'}),
}));
jest.mock(
    '@components/ScreenWrapper',
    () =>
        ({children}: {children: React.ReactNode}) =>
            children,
);
jest.mock('@hooks/useAndroidBackButtonHandler', () => (callback: () => boolean) => {
    mockAndroidBackHandlers.push(callback);
});
jest.mock('@hooks/useOnyx', () => () => [undefined]);
jest.mock('@hooks/useStyleUtils', () => () => ({
    getBackgroundColorStyle: jest.fn(),
}));
jest.mock('@hooks/useTheme', () => () => ({
    PAGE_THEMES: new Proxy({}, {get: () => ({backgroundColor: '#FFFFFF'})}),
}));
jest.mock('@libs/actions/App', () => ({
    openApp: jest.fn(),
}));
jest.mock('@libs/Browser', () => ({
    isMobileSafari: () => false,
}));
jest.mock('@libs/Log', () => ({
    warn: jest.fn(),
}));
jest.mock('@libs/Navigation/helpers/isReportTopmostSplitNavigator', () => () => false);
jest.mock('@libs/Navigation/Navigation', () => ({
    dismissModal: jest.fn(),
    goBack: jest.fn(),
    navigate: jest.fn(),
}));
jest.mock('@libs/Network/SequentialQueue', () => ({
    waitForIdle: jest.fn(),
}));
jest.mock('@pages/signin/SignInPage', () => {
    const {useImperativeHandle} = jest.requireActual<{useImperativeHandle: typeof UseImperativeHandle}>('react');

    function MockSignInPage({ref, ...props}: {ref?: React.Ref<{navigateBack: () => boolean} | null>}) {
        mockSignInPageProps(props);
        useImperativeHandle<{navigateBack: () => boolean} | null, {navigateBack: () => boolean} | null>(ref, () => (mockShouldAttachSignInPageRef ? {navigateBack: mockNavigateBack} : null));
        return null;
    }

    return {
        __esModule: true,
        default: MockSignInPage,
        SignInPage: MockSignInPage,
    };
});
jest.mock('@src/CONST', () => ({
    __esModule: true,
    default: {
        AUTH_TOKEN_TYPES: {
            ANONYMOUS: 'anonymousAccount',
        },
    },
}));
jest.mock('@src/ONYXKEYS', () => ({
    __esModule: true,
    default: {
        IS_LOADING_APP: 'isLoadingApp',
    },
}));
jest.mock('@src/ROUTES', () => ({
    __esModule: true,
    default: {
        HOME: 'home',
    },
}));
jest.mock('@src/SCREENS', () => ({
    __esModule: true,
    default: {
        RIGHT_MODAL: {
            SIGN_IN: 'signIn',
        },
    },
}));

describe('SignInModal Android back button', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAndroidBackHandlers.length = 0;
        mockHeaderBackButtonPress = undefined;
        mockShouldAttachSignInPageRef = true;
    });

    it('delegates both hardware and header back presses to SignInPage', () => {
        render(<SignInModal />);

        expect(mockSignInPageProps).toHaveBeenLastCalledWith(
            expect.objectContaining({
                shouldHandleAndroidBackButton: false,
                shouldResetTabTitle: false,
            }),
        );
        expect(mockAndroidBackHandlers).toHaveLength(1);

        expect(mockAndroidBackHandlers.at(0)?.()).toBe(true);
        expect(mockNavigateBack).toHaveBeenCalledTimes(1);

        mockHeaderBackButtonPress?.();
        expect(mockNavigateBack).toHaveBeenCalledTimes(2);
        expect(Navigation.goBack).not.toHaveBeenCalled();
    });

    it('falls back to the modal navigation when the SignInPage ref is not ready', () => {
        mockShouldAttachSignInPageRef = false;
        render(<SignInModal />);

        expect(mockAndroidBackHandlers.at(0)?.()).toBe(true);
        expect(Navigation.goBack).toHaveBeenCalledTimes(1);
        expect(mockNavigateBack).not.toHaveBeenCalled();
    });
});
