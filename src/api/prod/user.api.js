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
    const { username, password, name, email, phone, permission } = data;
    this.setData({ username, password, name, email, phone, permission });

    return this.post();
  }

  changePassword(id = 'me', data) {
    this.setUrl(`users/${id}/password`);
    const { password, newPassword } = data;
    this.setData({ old_password: password, new_password: newPassword });

    return this.put();
  }

  createResetPassword(data) {
    this.setUrl('/reset');
    this.setData(data); // username or email

    return this.post();
  }

  resetPassword(data) {
    this.setUrl('/reset');
    const { password, code, otp } = data;
    this.setData({ password, code, otp });

    return this.put();
  }

  editUser(data) {
    const { id, name, email, phone, permission } = data;
    this.setUrl(`users/${id || 'me'}`);
    this.setData({ name, email, phone, permission });

    return this.put();
  }

  deleteUser(id) {
    this.setUrl(`users/${id}`);

    return this.delete();
  }

  restoreUser(id) {
    this.setUrl(`users/${id}/restore`);

    return this.post();
  }
}
