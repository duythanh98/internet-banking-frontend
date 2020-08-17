import BaseApi from '../base';

export default class TransferApi extends BaseApi {
  getFee() {
    this.setUrl(`/transfer/fee`);

    return this.get();
  }

  internalTransfer(from, to, data) {
    this.setUrl(`/transfers/internal`);
    const { amount, note, sender_pay_fee } = data;
    this.setData({ amount, note, sender_pay_fee, from_account: from, to_account: to });
    return this.post();
  }

  externalTransfer(from, to, bankId, data) {
    this.setUrl(`/transfers/external`);
    const { amount, note, sender_pay_fee } = data;
    this.setData({
      amount, note,
      sender_pay_fee,
      from_account: from,
      to_account: to,
      bank_id: bankId
    });
    return this.post();
  }

  acceptTransfer(id, otp, transferCode) {
    this.setUrl(`/transfers/${id}`);
    this.setData({ otp_code: otp, transfer_code: transferCode });
    return this.post();
  }

  getBanks() {
    this.setUrl(`/banks`);
    return this.get();
  }

  getTransactions(data) {
    const { id, from, to, type, pagination, sortBy, orderBy } = data;
    this.setUrl(`/users/${id}/transactions?page=${pagination.current_page || 1}&limit=${pagination.per_page || 10}&from=${from || ''}&to=${to || ''}${type ? ('&type=' + type) : ''}&sort=${sortBy || 'created_at'}&order=${orderBy || 'desc'}`);

    return this.get();
  }

  getBankTransactions(data) {
    const { from, to, bankId, type, pagination, sortBy, orderBy } = data;
    this.setUrl(`/transactions/banks${bankId !== '' ? ('/' + bankId) : ''}?from=${from}&to=${to}${bankId >= 0 ? ('&bank_id=' + bankId) : ''}${type !== '' ? ('&type=' + type) : ''}&page=${pagination.current_page || 1}&limit=${pagination.per_page || 10}&sort=${sortBy || 'created_at'}&order=${orderBy || 'desc'}`);
    return this.get();
  }
}
