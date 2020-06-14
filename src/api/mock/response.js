export default class ResponseData {
  constructor() {
    this._status = 200;
    this._error = 0;
    this._addMore = {};
  }

  error(error) {
    this._error = error;
    return this;
  }

  status(status) {
    this._status = status;
    return this;
  }

  addMoreData(data = {}) {
    this._addMore = { ...this.addMoreData, ...data };
    return this;
  }

  toMockData(data = null) {
    return [
      this._status,
      {
        ...{
          result: data,
          status: this._status,
          error_code: this._error
        },
        ...this._addMore
      }
    ];
  }
}
