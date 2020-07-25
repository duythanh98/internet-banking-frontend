<template>
  <div class="app-container">
    <el-tabs v-model="tabs" @tab-click="changeTab">
      <el-tab-pane name="transfer">
        <span slot="label"><svg-icon icon-class="info" /> {{ `Chuyển khoản (${transfer})` }}</span>
        <transfer-transaction ref="transfer" @reload-completed="transferReloadCompleted" />
      </el-tab-pane>
      <el-tab-pane name="reminder">
        <span slot="label"><svg-icon icon-class="info" /> {{ `Thanh toán nợ (${reminder})` }}</span>
        <reminder-transaction ref="reminder" @reload-completed="reminderReloadCompleted" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import TransferTransaction from '@/components/Transaction/Transfers';
import ReminderTransaction from '@/components/Transaction/Reminders';

export default {
  components: { TransferTransaction, ReminderTransaction },
  data() {
    return {
      tabs: 'transfer',
      transfer: 0,
      reminder: 0
    };
  },
  mounted() {
    this.$refs.transfer.load();
    this.$refs.reminder.load();
  },
  methods: {
    changeTab() {
      if (this.$refs[this.tabs]) {
        this.$refs[this.tabs].load();
      }
    },
    transferReloadCompleted() {
      this.transfer = this.$refs.transfer.$data.pagination.total;
    },
    reminderReloadCompleted() {
      this.reminder = this.$refs.reminder.$data.pagination.total;
    }
  }
};
</script>
