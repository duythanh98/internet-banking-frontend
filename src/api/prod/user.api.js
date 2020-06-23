import BaseApi from '../base';

export default class UserApi extends BaseApi {
  getUser(id = 'me') {
    this.setUrl(`/users/${id}`);

    return this.get();
  }

  getReminders(id = 'me') {
    this.setUrl(`/users/${id}/reminders`);

    return this.get();
  }

  deleteReminder(id = 'me') {
    this.setUrl(`/users/${id}/reminders`);
    this.setData({});

    return this.delete();
  }

  getMyAccount() {
    this.setUrl(`/users/me/account`);
    return this.get();
  }
}
