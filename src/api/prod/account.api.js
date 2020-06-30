import BaseApi from '../base';

export default class AccountApi extends BaseApi {
  getUserNameByAccountNumber(accountNumber) {
    this.setUrl(`/accounts/${accountNumber}`);

    return this.get();
  }

  getExternalAccount(accountNumber, bankId) {
    this.setUrl(`/banks/${bankId}/${accountNumber}`);

    return this.get();
  }
}
