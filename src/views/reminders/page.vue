<template>
  <div class="app-container">
    <el-tabs v-model="tabs" @tab-click="changeTab">
      <el-tab-pane name="debt">
        <span slot="label"><svg-icon icon-class="info" />{{ `Nhắc nợ đã nhận (${debt})` }}</span>
        <reminder ref="debt" @reload-completed="debtReloadCompleted" />
      </el-tab-pane>
      <el-tab-pane name="reminder">
        <span slot="label"><svg-icon icon-class="info" />{{ `Nhắc nợ đã gửi (${reminder})` }}</span>
        <reminder ref="reminder" :reminding="true" @reload-completed="reminderReloadCompleted" />
      </el-tab-pane>
      <el-tab-pane name="unpaidDebt">
        <span slot="label"><svg-icon icon-class="info" />{{ `Nhắc nợ chưa thanh toán (${unpaid})` }}</span>
        <reminder ref="unpaidDebt" :filter-status="unpaidStatus" @reload-completed="unpaidDebtReloadCompleted" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import Reminder from '@/components/Reminder/List';

export default {
  components: { Reminder },
  data() {
    return {
      tabs: 'debt',
      debt: 0,
      reminder: 0,
      unpaid: 0,
      unpaidStatus: ['created']
    };
  },
  mounted() {
    if (this.$route.params.targetedTab) {
      this.tabs = this.$route.params.targetedTab;
    }
    this.$refs.debt.load();
    this.$refs.reminder.load();
    this.$refs.unpaidDebt.load();
  },
  methods: {
    changeTab() {
      if (this.$refs[this.tabs]) {
        this.$refs[this.tabs].load();
      }
    },
    debtReloadCompleted() {
      this.debt = this.$refs.debt.$data.pagination.total;
    },
    reminderReloadCompleted() {
      this.reminder = this.$refs.reminder.$data.pagination.total;
    },
    unpaidDebtReloadCompleted() {
      this.unpaid = this.$refs.unpaidDebt.$data.pagination.total;
    }
  }
};
</script>
