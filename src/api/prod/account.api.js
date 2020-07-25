import BaseApi from '../base';

export default class AccountApi extends BaseApi {
  getUserNameByAccountNumber(accountNumber) {
    this.setUrl(`/accounts/${accountNumber}`);

    return this.get();
  }

  getUserInfoByUsername(username) {
    this.setUrl(`/users?username=${username}`);

    return this.get();
  }

  getExternalAccount(accountNumber, bankId) {
    this.setUrl(`/banks/${bankId}/${accountNumber}`);

    return this.get();
  }

  createNewAccount(data) {
    this.setUrl('/accounts');
    const { username, password, name, email, phone } = data;
    this.setData({ username, password, name, email, phone });

    return this.post();
  }

  getTransferTransactions(id = 'me') {
    this.setUrl(`/users/${id}/transactions/transfers`);

    return this.get();
  }

  getReminderTransactions(id = 'me') {
    this.setUrl(`/users/${id}/transactions/reminders`);

    return this.get();
  }

  deposit(data) {
    const { account_number, amount } = data;
    this.setUrl(`/accounts/${account_number}/deposit`);

    this.setData({ amount });
    return this.post();
  }
}
