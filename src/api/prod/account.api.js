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

  getTransactions(id = 'me', type = 'deposit', pagination) {
    const { current_page, per_page } = pagination;
    this.setUrl(`/users/${id}/transactions?type=${type}&page=${current_page || 1}&limit=${per_page || 10}`);

    return this.get();
  }

  deposit(data) {
    const { account_number, amount } = data;
    this.setUrl(`/accounts/${account_number}/deposit`);

    this.setData({ amount });
    return this.post();
  }
}
