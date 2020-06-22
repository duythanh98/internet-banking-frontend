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

  acceptTransfer(id, otp) {
    this.setUrl(`/transfers/${id}`);
    this.setData({ otp_code: otp });
    return this.post();
  }
}
