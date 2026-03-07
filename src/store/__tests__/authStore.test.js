import { useAuthStore } from '../authStore';

// Reset store between tests
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    loginMode: null,
    loginError: null,
    loading: false,
    mustChangePassword: false,
  });
});

describe('authStore (mock mode)', () => {
  test('initial state has no user', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loginMode).toBeNull();
    expect(state.loginError).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.mustChangePassword).toBe(false);
  });

  test('loginWithCredentials succeeds with valid mock credentials', async () => {
    const result = await useAuthStore.getState().loginWithCredentials('jonp', 'Joy944');
    expect(result).toBe(true);

    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.user.name).toBe('jonp');
    expect(state.user.role).toBe('admin');
    expect(state.loginMode).toBe('mobile');
    expect(state.loginError).toBeNull();
  });

  test('loginWithCredentials fails with invalid credentials', async () => {
    const result = await useAuthStore.getState().loginWithCredentials('jonp', 'wrong');
    expect(result).toBe(false);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loginError).toBe('Invalid name or password. Please try again.');
  });

  test('loginWithPin succeeds with valid PIN', async () => {
    const user = await useAuthStore.getState().loginWithPin('0944');
    expect(user).not.toBeNull();
    expect(user.name).toBe('jonp');

    const state = useAuthStore.getState();
    expect(state.loginMode).toBe('kiosk');
  });

  test('loginWithPin fails with invalid PIN', async () => {
    const user = await useAuthStore.getState().loginWithPin('9999');
    expect(user).toBeNull();

    const state = useAuthStore.getState();
    expect(state.loginError).toBe('PIN not recognized.');
  });

  test('logout clears state', async () => {
    await useAuthStore.getState().loginWithCredentials('jonp', 'Joy944');
    expect(useAuthStore.getState().user).not.toBeNull();

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loginMode).toBeNull();
    expect(state.loginError).toBeNull();
  });

  test('updateUser merges fields into current user', async () => {
    await useAuthStore.getState().loginWithCredentials('jonp', 'Joy944');
    await useAuthStore.getState().updateUser({ title: 'CEO' });

    expect(useAuthStore.getState().user.title).toBe('CEO');
  });

  test('clearLoginError clears error', async () => {
    await useAuthStore.getState().loginWithCredentials('jonp', 'wrong');
    expect(useAuthStore.getState().loginError).not.toBeNull();

    useAuthStore.getState().clearLoginError();
    expect(useAuthStore.getState().loginError).toBeNull();
  });
});
