import BaseApi from '../base';

export default class ReminderApi extends BaseApi {
  getReminders(id = 'me') {
    this.setUrl(`/users/${id}/reminders`);

    return this.get();
  }

  createReminder({ userId = 'me', form }) {
    this.setUrl(`/users/${userId}/reminders`);
    this.setData(form);

    return this.post();
  }

  deleteReminder({ userId = 'me', reminderId }) {
    this.setUrl(`/users/${userId}/reminders/${reminderId}`);
    this.setData({});

    return this.delete();
  }
}
