import BaseApi from '../base';

export default class LoginApi extends BaseApi {
  login(username, password, captchaData) {
    this.setUrl('/auth/login');

    this.setData({
      username, password
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
