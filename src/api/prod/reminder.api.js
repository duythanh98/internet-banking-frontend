import BaseApi from '../base';

export default class ReminderApi extends BaseApi {
  getReminders(id = 'me', type = 'reminders', status = []) {
    this.setUrl(`/users/${id}/${type}`);

    return this.get();
  }

  createReminder(accountNumber = '', amount = '', note = '') {
    this.setUrl(`/reminders`);
    this.setData({ account_number: accountNumber, amount, note });

    return this.post();
  }

  deleteReminder(reminderId, note = '') {
    this.setUrl(`/reminders/${reminderId}`);
    this.setData({ note });

    return this.delete();
  }

  pay(reminderId) {
    this.setUrl(`/reminders/${reminderId}/pay`);

    return this.post();
  }
}
