<template>
  <view-reminder :reminding="reminding" />
</template>

<script>
import ViewReminder from '@/components/Reminder/View';

export default {
  components: {
    ViewReminder
  },
  data() {
    return {
      reminding: !!this.$route.params.reminding || false
    };
  }
};
</script>
