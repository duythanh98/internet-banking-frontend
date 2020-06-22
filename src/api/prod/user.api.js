import BaseApi from '../base';

export default class UserApi extends BaseApi {
  getUser(id = 'me') {
    this.setUrl(`/users/${id}`);

    return this.get();
  }

  getMyAccount() {
    this.setUrl(`/users/me/account`);
    return this.get();
  }
}
