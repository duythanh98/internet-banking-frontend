import BaseApi from '../base';

export default class UserApi extends BaseApi {
  getUser(id = 'me') {
    this.setUrl(`/users/${id}`);

    return this.get();
  }

  getUsers(pagination) {
    const { current_page, per_page } = pagination;
    this.setUrl(`/users?page=${current_page || 1}&limit=${per_page || 10}`);

    return this.get();
  }

  getMyAccount() {
    this.setUrl(`/users/me/account`);
    return this.get();
  }

  getAccount(id) {
    this.setUrl(`/users/${id}/account`);
    return this.get();
  }

  createNewUser(data) {
    this.setUrl('/users');
    const { username, password, name, email, phone } = data;
    this.setData({ username, password, name, email, phone });

    return this.post();
  }

  changePassword(id = 'me', data) {
    this.setUrl(`users/${id}/password`);
    const { password, newPassword } = data;
    this.setData({ old_password: password, new_password: newPassword });

    return this.put();
  }

  createResetPassword(data) {
    this.setUrl('/reset-password');
    this.setData(data); // username or email

    return this.post();
  }

  resetPassword(data) {
    this.setUrl('/reset-password');
    const { password, code, email, reset_id } = data;
    this.setData({ password, code, email, reset_id });

    return this.put();
  }
}
