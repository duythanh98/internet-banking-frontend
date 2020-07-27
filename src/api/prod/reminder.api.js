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

  pay(data) {
    const { reminderId, otp, transfer_id } = data;
    this.setUrl(`/reminders/${reminderId}/pay`);
    this.setData({ otp, transfer_id });

    return this.post();
  }
}
