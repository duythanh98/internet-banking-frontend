export default class Response {
  /**
     *
     * @param {import('axios').AxiosResponse} response
     * @param {import('axios').AxiosError} error
     */
  constructor(response, error) {
    this.response = response;
    this.error = error;

    Object.defineProperty(this, 'isNetworkError', {
      value: error && error.message === 'Network Error',
      writable: false,
      enumerable: true
    });
  }

  /**
     * @returns {boolean}
     */
  isFailed() {
    return typeof this.error !== 'undefined';
  }

  /**
     * @returns {number}
     */
  status() {
    return this.response ? this.response.status : 0;
  }

  /**
     * @returns {any}
     */
  result() {
    return this.response && this.response.data ? this.response.data.result : undefined;
  }

  /**
     * @returns {number}
     */
  errorCode() {
    return this.response ? this.response.data.error_code : 0;
  }

  /**
     * @returns {string}
     */
  errors() {
    return this.response ? this.response.data.errors : {};
  }
}
