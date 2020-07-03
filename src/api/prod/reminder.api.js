import BaseApi from '../base';

export default class ReminderApi extends BaseApi {
  getReminders(id = 'me', type = 'reminders', status = []) {
    this.setUrl(`/users/${id}/${type}`);

    return this.get();
  }

  createReminder(form) {
    this.setUrl(`/reminders`);
    this.setData(form);

    return this.post();
  }

  deleteReminder({ reminderId, note = '' }) {
    this.setUrl(`/reminders/${reminderId}`);
    this.setData({ note });

    return this.delete();
  }
}
