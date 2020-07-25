<template>
  <div class="app-container">
    <el-tabs v-model="tabs" @tab-click="changeTab">
      <el-tab-pane name="transfer">
        <span slot="label"><svg-icon icon-class="info" /> {{ `Chuyển tiền (${transfer})` }}</span>
        <transfer-transaction ref="transfer" @reload-completed="reloadCompleted" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import TransferTransaction from '@/components/Transaction/Transfers';

export default {
  components: { TransferTransaction },
  data() {
    return {
      tabs: 'transfer',
      transfer: 0
    };
  },
  mounted() {
    this.$refs.transfer.load();
  },
  methods: {
    changeTab() {
      if (this.$refs[this.tabs]) {
        this.$refs[this.tabs].load();
      }
    },
    reloadCompleted() {
      this.transfer = this.$refs.transfer.$data.pagination.total;
    }
  }
};
</script>
