import BaseApi from '../base';

export default class ContactApi extends BaseApi {
  createNewContact(accountNumber, bankId, name) {
    this.setUrl('/contacts');
    this.setData({
      account_number: accountNumber,
      bank_id: bankId || 0,
      name
    });

    return this.post();
  }

  getContact(id, page = 1, filter = null) {
    this.setUrl(`/users/${id}/contacts?page=${page}${filter ? `&filter=${filter}` : ''}`);
    return this.get();
  }
}
