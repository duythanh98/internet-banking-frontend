import BaseApi from '../base';

export default class LoginApi extends BaseApi {
  login(username, password, recaptcha) {
    this.setUrl('/auth/login');

    this.setData({
      username, password, recaptcha
    });

    return this.post();
  }
  refresh(refreshToken) {
    this.setUrl('/auth/refresh');

    this.setData({
      refresh_token: refreshToken
    });

    return this.post();
  }
}
