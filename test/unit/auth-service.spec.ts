/* eslint-disable no-undef */
import { AuthService } from 'services/auth-service';

describe('AuthService', () => {
    let sut: AuthService;

    beforeEach(() => {
        sut = new AuthService();
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
        fetchMock.resetMocks();
    });

    it('getIdToken returns value', async () => {
        const value = await sut.getIdToken();

        expect(value).toEqual('989duiu787u');
    });

    it('getUserAuthMemo returns memo', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ memo: 'hdkjhsadjkha' }));

        const value = await sut.getUserAuthMemo('beggars');

        expect(value).toBe('hdkjhsadjkha');
    });

    it('getUserAuthMemo fails', async () => {
        fetchMock.mockRejectOnce(new Error('fake error message'));

        await expect(sut.getUserAuthMemo('beggars')).rejects.toThrow('fake error message');
    });

    it('verifyUserAuthMemo returns token', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ token: 'ey8948394jkj93' }));

        const value = await sut.verifyUserAuthMemo('beggars', '12345678');

        expect(value).toBe('ey8948394jkj93');
    });

    it('verifyUserAuthMemo fails', async () => {
        fetchMock.mockRejectOnce(new Error('fake error message'));

        await expect(sut.verifyUserAuthMemo('beggars', '12345678')).rejects.toThrow('fake error message')
    });

});
