<template>
  <div class="app-container">
    <el-tabs v-model="tabs" @tab-click="changeTab">
      <el-tab-pane name="debt">
        <span slot="label"><svg-icon icon-class="info" /> {{ `Nhắc nợ đã nhận (${debt})` }}</span>
        <reminder ref="debt" @reload-completed="reloadCompleted" />
      </el-tab-pane>
      <el-tab-pane name="reminder">
        <span slot="label"><svg-icon icon-class="info" /> {{ `Nhắc nợ đã gửi (${reminder})` }}</span>
        <reminder ref="reminder" :reminding="true" @reload-completed="reloadCompleted" />
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
      reminder: 0
    };
  },
  mounted() {
    this.$refs.debt.load();
    this.$refs.reminder.load();
  },
  methods: {
    changeTab() {
      if (this.$refs[this.tabs]) {
        this.$refs[this.tabs].load();
      }
    },
    reloadCompleted() {
      this.debt = this.$refs.debt.$data.pagination.total;
      this.reminder = this.$refs.reminder.$data.pagination.total;
    }
  }
};
</script>
