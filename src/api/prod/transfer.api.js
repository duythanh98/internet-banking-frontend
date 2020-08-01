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

  getBankTransactions(data) {
    const { from, to, bankId, current_page, per_page } = data;
    this.setUrl(`/transactions${bankId >= 0 ? '/bank' : ''}?from=${from}&to=${to}${bankId >= 0 ? ('&bank_id=' + bankId) : ''}&page=${current_page || 1}&limit=${per_page || 10}`);
    return this.get();
  }
}
