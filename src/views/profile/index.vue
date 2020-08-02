<template>
  <div class="app-container">
    <profile ref="profile" />
  </div>
</template>

<script>
import Profile from '@/components/Profile/index';

export default {
  components: { Profile },
  data() {
    return {
    };
  },
  mounted() {
    this.$refs.profile.load();
  }
};
</script>
