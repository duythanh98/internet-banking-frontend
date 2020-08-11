<template>
  <view-reminder :user-id="userId" />
</template>

<script>
import ViewReminder from '@/components/Reminder/View';

export default {
  components: {
    ViewReminder
  },
  data() {
    return {
      userId: this.$route.params.userId || ''
    };
  },
  created() {
    console.log(this.userId);
  }
};
</script>
