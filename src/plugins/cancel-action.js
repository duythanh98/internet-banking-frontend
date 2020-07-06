import Vue from 'vue';

const __action__ = Symbol('__action__');

export class CancelAction {

}

Vue.use({
  install(Vue) {
    Vue.prototype.$callAction = function $callAction(actionId, action, cancelCallback) {
      if (!this[__action__]) {
        this[__action__] = {};
      }

      this.$cancelAction(actionId);

      return Promise.race([
        new Promise((resolve, reject) => {
          this[__action__][actionId] = { resolve, cancelCallback, reject };
        }),
        action()
      ]);
    };

    Vue.prototype.$cancelAction = function $callAction(actionId) {
      if (!this[__action__]) {
        this[__action__] = {};
      }

      if (this[__action__][actionId]) {
        if (typeof this[__action__][actionId].cancelCallback === 'function') {
          this[__action__][actionId].cancelCallback();
        }

        if (typeof this[__action__][actionId].reject === 'function') {
          this[__action__][actionId].reject(new CancelAction());
        }
      }
    };
  }
});
