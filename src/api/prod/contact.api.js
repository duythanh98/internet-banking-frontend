import BaseApi from '../base';

export default class ContactApi extends BaseApi {
  getContacts(userId = 'me') {
    this.setUrl(`/users/${userId}/contacts`);

    return this.get();
  }

  createNewContact(accountNumber, bankId, name) {
    this.setUrl('/contacts');
    this.setData({
      account_number: accountNumber,
      bank_id: bankId || 0,
      name
    });

    return this.post();
  }

  deleteContact(contactId = 0) {
    this.setUrl(`/contacts/${contactId}`);
    this.setData({});

    return this.delete();
  }

  getContact(id, page = 1, filter = null) {
    this.setUrl(`/users/${id}/contacts?page=${page}${filter ? `&filter=${filter}` : ''}`);
    return this.get();
  }
}
