import { getToken, setToken, removeToken } from '@/utils/auth';
import router, { resetRouter } from '@/router';
import LoginApi from '@/api/prod/login.api';
import UserApi from '@/api/prod/user.api';

const state = {
  token: getToken(),
  refresh_token: getToken(false),
  name: '',
  info: {},
  roles: [],
  accountInfo: {}
};

const mutations = {
  SET_TOKEN: (state, token) => {
    state.token = token;
    setToken(token, true);
  },
  SET_REFRESH_TOKEN: (state, token) => {
    state.refresh_token = token;
    setToken(token, false);
  },
  SET_NAME: (state, name) => {
    state.name = name;
  },
  SET_INFO: (state, info) => {
    state.info = info;
  },
  SET_ACCOUNT_INFO: (state, info) => {
    state.accountInfo = info;
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles;
  }
};

const actions = {
  // user login
  async login({ commit }, userInfo) {
    const { username, password } = userInfo;

    const api = new LoginApi();
    const res = await api.login(username, password);
    if (res.isFailed()) {
      if (res.status() === 422) {
        throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    commit('SET_TOKEN', result.access_token);
    commit('SET_REFRESH_TOKEN', result.refresh_token);

    return true;
  },

  // get user info
  async getInfo({ commit, state, dispatch }) {
    const api = new UserApi();
    api.setToken(state.token);

    const res = await api.getUser('me');
    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    commit('SET_INFO', result);

    switch (result.permission) {
      case 1: commit('SET_ROLES', ['admin']); break;
      case 2: commit('SET_ROLES', ['employee']); break;
      default: commit('SET_ROLES', ['customer']);
    }

    await dispatch('getAccountInfo');

    return result;
  },

  async getAccountInfo({ commit, state }) {
    const api = new UserApi();
    api.setToken(state.token);

    const res = await api.getMyAccount();

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    commit('SET_ACCOUNT_INFO', result);

    return result;
  },

  async refreshToken({ commit, state }) {
    const refreshToken = state.refresh_token;

    const api = new LoginApi();

    const res = await api.refresh(refreshToken);

    if (res.isFailed()) {
      throw new Error('Không thể làm mới phiên đăng nhập');
    }

    const result = res.result();

    commit('SET_TOKEN', result.access_token);

    return result.access_token;
  },

  // user logout
  logout({ commit, state, dispatch }) {
    commit('SET_TOKEN', '');
    commit('SET_ROLES', []);

    dispatch('tagsView/delAllViews', null, { root: true });

    removeToken(true);
    removeToken(false);

    resetRouter();
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '');
      commit('SET_ROLES', []);
      removeToken();
      resolve();
    });
  },

  // dynamically modify permissions
  changeRoles({ commit, dispatch }, role) {
    return new Promise(async resolve => {
      const token = role + '-token';

      commit('SET_TOKEN', token);
      setToken(token);

      const { roles } = await dispatch('getInfo');

      resetRouter();

      // generate accessible routes map based on roles
      const accessRoutes = await dispatch('permission/generateRoutes', roles, { root: true });

      // dynamically add accessible routes
      router.addRoutes(accessRoutes);

      // reset visited views and cached views
      dispatch('tagsView/delAllViews', null, { root: true });

      resolve();
    });
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions
};
