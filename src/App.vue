<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      OneSignal: null
    };
  },
  computed: {
    notificationId() {
      return this.$store.getters.notification_id;
    }
  },
  watch: {
    notificationId(newVal) {
      if (this.OneSignal) {
        if (newVal) {
          return this.OneSignal.sendTags({
            notification_id: newVal,
            user_id: this.$store.getters.userInfo.id
          });
        }

        return this.OneSignal.deleteTags(['notification_id', 'user_id']);
      }
    }
  },
  beforeCreate() {
    const head = document.getElementsByTagName('head')[0];
    const script = document.createElement('script');
    script.setAttribute('src', 'https://cdn.onesignal.com/sdks/OneSignalSDK.js');
    script.setAttribute('async', true);
    head.appendChild(script);
  },
  created() {
    window.OneSignal = window.OneSignal || [];
    window.OneSignal.push(() => {
      const OneSignal = window.OneSignal;
      this.OneSignal = OneSignal;

      OneSignal.init({
        appId: process.env.VUE_APP_ONESIGNAL_API
      });

      if (this.$store.getters.notificationId) {
        OneSignal.sendTags({
          notification_id: this.$store.getters.notificationId,
          user_id: this.$store.getters.userInfo.id
        });
      }
    });
  }
};
</script>
