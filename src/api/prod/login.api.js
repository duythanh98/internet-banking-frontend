import BaseApi from '../base';

export default class LoginApi extends BaseApi {
  login(username, password, captchaData) {
    this.setUrl('/auth/login');

    this.setData({
      username, password
    });

    return this.post();
  }
}
