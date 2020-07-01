import BaseApi from '../base';

export default class ContactApi extends BaseApi {
  getContacts() {
    this.setUrl(`/users/contacts`);

    return this.get();
  }

  createContact({ userId = 'me', form }) {
    this.setUrl(`/users/${userId}/contacts`);
    this.setData(form);

    return this.post();
  }

  deleteContact({ userId = 'me', contactId }) {
    this.setUrl(`/users/${userId}/contacts/${contactId}`);
    this.setData({});

    return this.delete();
  }
}
