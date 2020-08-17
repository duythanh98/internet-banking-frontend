import { getToken, setToken, removeToken } from '@/utils/auth';
import router, { resetRouter } from '@/router';
import LoginApi from '@/api/prod/login.api';
import UserApi from '@/api/prod/user.api';
import ReminderApi from '@/api/prod/reminder.api';
import ContactApi from '@/api/prod/contact.api';
import AccountApi from '@/api/prod/account.api';
import TransferApi from '@/api/prod/transfer.api';

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
    console.log(userInfo);
    const { username, password, recaptcha } = userInfo;

    const api = new LoginApi();
    const res = await api.login(username, password, recaptcha);
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
    console.log(res);
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

    if (result.permission !== 1 && result.permission !== 2) {
      await dispatch('getAccountInfo');
    }

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
  // logout({ commit, state, dispatch }) {
  //   return new Promise((resolve, reject) => {
  //     logout(state.token).then(() => {
  //       commit('SET_TOKEN', '');
  //       commit('SET_ROLES', []);
  //       removeToken();
  //       resetRouter();

  //       // reset visited views and cached views
  //       // to fixed https://github.com/PanJiaChen/vue-element-admin/issues/2485
  //       dispatch('tagsView/delAllViews', null, { root: true });

  //       resolve();
  //     }).catch(error => {
  //       reject(error);
  //     });
  //   });
  // },

  logout({ commit, state, dispatch }) {
    commit('SET_TOKEN', '');
    commit('SET_ROLES', []);

    commit('SET_INFO', {});
    commit('SET_ACCOUNT_INFO', {});

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
  },

  async getReminders({ commit, state }, form) {
    const api = new ReminderApi();
    api.setToken(state.token);

    const res = await api.getReminders(form.id, form.type, form.status);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async getReminder({ commit, state }, data) {
    const api = new ReminderApi();
    api.setToken(state.token);

    const res = await api.getReminder(data.id);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async createReminder({ commit, state }, form) {
    const api = new ReminderApi();
    api.setToken(state.token);

    const res = await api.createReminder(form.account_number, form.amount, form.note);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async deleteReminder({ commit, state }, form) {
    const api = new ReminderApi();
    api.setToken(state.token);

    const res = await api.deleteReminder(form.reminderId, form.note);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async getMyAccount({ commit, state }) {
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

    return result;
  },

  async getAccounts({ commit, state }) {
    // const api = new AccountApi();
    // api.setToken(state.token);

    // const res = await api.getAccounts();
    // console.log(res);
    // if (res.isFailed()) {
    //   if (res.status() === 401) {
    //     throw new Error('Phiên đăng nhập hết hạn');
    //   }

    //   throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    // }

    // const result = res.result();

    // return result;
    return [];
  },

  async createNewUser({ commit, state }, form) {
    const api = new UserApi();
    api.setToken(state.token);

    const res = await api.createNewUser(form);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      if (res.status() === 422) {
        const r = res.result();

        if (r && r.phone && Array.isArray(r.phone)) {
          if (r.phone.includes('exists')) {
            throw new Error('Số điện thoại này đã được đăng kí');
          }
        }

        if (r && r.username && Array.isArray(r.username)) {
          if (r.username.includes('exists')) {
            throw new Error('Tên đăng nhập này đã tồn tại');
          }
        }

        if (r && r.email && Array.isArray(r.email)) {
          if (r.email.includes('exists')) {
            throw new Error('Email này đã tồn tại');
          }
        }
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async editUser({ commit, state }, data) {
    const api = new UserApi();
    api.setToken(state.token);

    const res = await api.editUser(data);
    console.log(res);
    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async deleteUser({ commit, state }, data) {
    const api = new UserApi();
    api.setToken(state.token);

    const res = await api.deleteUser(data.id);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async restoreUser({ commit, state }, data) {
    const api = new UserApi();
    api.setToken(state.token);

    const res = await api.restoreUser(data.id);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async getContacts({ commit, state }, form) {
    const api = new ContactApi();
    api.setToken(state.token);

    const res = await api.getContacts(form.id);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async createContact({ commit, state }, form) {
    const api = new ContactApi();
    api.setToken(state.token);

    const res = await api.createNewContact(form.account_number, form.bankId, form.name);
    console.log(res);
    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async getContact({ commit, state }, data) {
    const api = new ContactApi();
    api.setToken(state.token);

    const res = await api.getEachContact(data.id);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async editContact({ commit, state }, data) {
    const api = new ContactApi();
    api.setToken(state.token);

    const res = await api.editContact(data.id, data.name);
    console.log(res);
    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async deleteContact({ commit, state }, form) {
    const api = new ContactApi();
    api.setToken(state.token);

    const res = await api.deleteContact(form.contactId);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async getTransactions({ commit, state }, data) {
    const api = new TransferApi();
    api.setToken(state.token);

    const res = await api.getTransactions(data);

    console.log(res);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async deposit({ commit, state }, form) {
    const api = new AccountApi();
    api.setToken(state.token);

    const res = await api.deposit(form);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async payDebt({ commit, state }, form) {
    const api = new ReminderApi();
    api.setToken(state.token);

    const res = await api.pay(form.reminderId);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      if (res.status() === 422) {
        const r = res.result();

        if (r && r.reminder && Array.isArray(r.reminder)) {
          if (r.reminder.includes('paid')) {
            throw new Error('Nhắc nợ này đã được thanh toán');
          }

          if (r.reminder.includes('canceled')) {
            throw new Error('Nhắc nợ này đã bị huỷ');
          }
        }

        if (r && r.amount && Array.isArray(r.amount)) {
          if (r.amount.includes('not_enough')) {
            throw new Error('Bạn không đủ tiền thực hiện giao dịch này');
          }
        }
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async getUsers({ commit, state }, data) {
    const api = new UserApi();
    api.setToken(state.token);

    const res = await api.getUsers(data);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async getUserInfo({ commit, state }, id) {
    const api = new UserApi();
    api.setToken(state.token);

    const res = await api.getUser(id);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async changePassword({ commit, state }, data) {
    const api = new UserApi();
    api.setToken(state.token);

    const res = await api.changePassword('me', data);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      if (res.status() === 422) {
        const r = res.result();

        if (r && r.old_password) {
          if (r.old_password === 'incorrect') {
            throw new Error('Mật khẩu không đúng');
          }
        }
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async createResetPassword({ commit, state }, data) {
    const api = new UserApi();
    api.setToken(state.token);

    const res = await api.createResetPassword(data);

    console.log(res);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  },

  async resetPassword({ commit, state }, data) {
    const api = new UserApi();
    api.setToken(state.token);

    const res = await api.resetPassword(data);

    console.log(res);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      if (res.status() === 410) {
        throw new Error('Đường dẫn này không tồn tại hoặc đã hết hạn');
      }

      if (res.status() === 422) {
        const r = res.result();

        if (r && r.otp) {
          if (r.otp === 'invalid') {
            throw new Error('Mã otp không đúng');
          }
        }
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    if (res.status() === 204) {
      if (data.isFromUrl) {
        throw new Error('Đường dẫn này không tồn tại hoặc đã hết hạn');
      }
      throw new Error('Mã otp không đúng');
    }

    const result = res.result();

    return result;
  },

  async getBankTransactions({ commit, state }, data) {
    const api = new TransferApi();
    api.setToken(state.token);

    const res = await api.getBankTransactions(data);

    console.log(res);

    if (res.isFailed()) {
      if (res.status() === 401) {
        throw new Error('Phiên đăng nhập hết hạn');
      }

      throw new Error('Có lỗi xảy ra, hãy thử lại sau');
    }

    const result = res.result();

    return result;
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions
};
