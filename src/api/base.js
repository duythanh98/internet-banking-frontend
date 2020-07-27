import { EventEmitter } from 'events';
import axios from 'axios';
import Response from './response';
import { CancelAction } from '@/plugins/cancel-action';

export default class BaseApi extends EventEmitter {
    static defaultEvent = new EventEmitter();

    constructor() {
      super();

      this.headers = {};
      /**
        * @type {{[fieldName: string]: any}}
        */
      this.data = {};

      this.url = '/';
      this.baseUrl = process.env.VUE_APP_BASE_API;
      /**
        * @type {FormData}
        */
      this.form = null;

      this.token = null;

      this.cancel = null;
    }

    /**
     *
     * @param {{[fieldName: string]: any}} data
     */
    setData(data) {
      this.data = data;
    }

    /**
     *
     * @param {{[fieldName: string]: any}} data
     */
    appendData(data) {
      this.data = { ...this.data, ...data };
    }

    /**
     *
     * @param {{[key: string]: any}} headers
     */
    addHeaders(headers) {
      this.headers = { ...this.headers, ...headers };
    }

    /**
     *
     * @param {string} name
     * @param {string} value
     */
    addHeader(name, value) {
      this.addHeaders({ [name]: value });
    }

    /**
     *
     * @param {string} url
     * @returns {this}
     */
    setUrl(url) {
      this.url = url;
      return this;
    }

    /**
     * @returns {string}
     */
    getUrl() {
      return this.url;
    }

    /**
     *
     * @param {{[key: string]: any}} data
     * @returns {FormData}
     */
    prepareMultipartForm(data) {
      this.form = new FormData();

      for (const [key, value] of Object.entries(data)) {
        this.addToForm(this.form, key, value);
      }

      return this.form;
    }

    /**
     *
     * @param {string} token
     */
    setToken(token) {
      this.token = token;
    }

    /**
     *
     * @param {string} key
     * @param {any} value
     * @returns {FormData}
     */
    addToForm(key, value) {
      if (!this.form) {
        this.form = new FormData();
      }

      if (value !== null) {
        if (Array.isArray(value)) {
          for (const [index, v] of value.entries()) {
            this.addToForm(`${key}[${index}]`, v);
          }
        } else {
          this.form.append(key, value);
        }
      }

      return this.form;
    }

    /**
     *
     * @param {{ [fieldName: string]: any }} data
     * @returns {FormData}
     */
    convertDataForm(data) {
      for (const [f, v] of Object.entries(data)) {
        this.addToForm(f, v);
      }

      return this.form;
    }

    /**
     *
     * @param {string} name
     * @param {File | Blob} file
     * @returns {FormData}
     */
    addFile(name, file) {
      if (!this.form) {
        this.form = new FormData();
      }

      this.form.append(name, file);
      return this.form;
    }

    /**
     *
     * @param {string} method
     * @returns {Promise<Response>}
     */
    send(method) {
      if (this.token && typeof this.token === 'string') {
        this.addHeader('Authorization', `Bearer ${this.token}`);
      }

      method = method || 'get';

      this.constructor.defaultEvent.emit('beforesend', this);
      this.emit('beforesend', this);

      const data = this.form ? this.convertDataForm(this.data) : this.data;

      return axios({
        method: method,
        baseURL: this.baseUrl,
        headers: this.headers,
        data,
        url: this.url,
        cancelToken: new axios.CancelToken((c) => { this.cancelToken = c; })
      })
        .then(res => new Response(res, null), (err) => {
          if (this.isCancel(err)) {
            throw err;
          }

          const response = new Response(err.response, err);

          if (err && err.response) {
            this.constructor.defaultEvent.emit('requesterror', this, response);
            this.emit('requesterror', this, response);
            console.error('Base Request', err);
            return response;
          }

          if (this.listenerCount('othererror')) {
            this.emit('othererror', this, response);
            return response;
          }

          if (this.constructor.defaultEvent.listenerCount('othererror')) {
            this.constructor.defaultEvent.emit('othererror', this, response);
            return response;
          }
        });
    }

    cancelRequest(message) {
      if (this.cancelToken) {
        this.cancelToken(message);
      }
    }

    isCancel(err) {
      return err instanceof CancelAction || axios.isCancel(err);
    }

    isRequestCancel(err) {
      return axios.isCancel(err);
    }

    post() {
      return this.send('post');
    }

    put() {
      return this.send('put');
    }

    get() {
      return this.send('get');
    }

    delete() {
      return this.send('delete');
    }
}
