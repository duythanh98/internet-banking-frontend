<template>
  <div class="app-container">
    <el-tabs v-model="tabs" @tab-click="changeTab">
      <el-tab-pane name="transfer">
        <span slot="label"><svg-icon icon-class="info" /> {{ `Chuyển khoản (${transfer})` }}</span>
        <transfer-transaction ref="transfer" @reload-completed="transferReloadCompleted" />
      </el-tab-pane>
      <el-tab-pane name="debt">
        <span slot="label"><svg-icon icon-class="info" /> {{ `Thanh toán nợ (${debt})` }}</span>
        <debt-transaction ref="debt" @reload-completed="debtReloadCompleted" />
      </el-tab-pane>
      <el-tab-pane name="deposit">
        <span slot="label"><svg-icon icon-class="info" /> {{ `Nhận tiền (${deposit})` }}</span>
        <deposit-transaction ref="deposit" @reload-completed="depositReloadCompleted" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import TransferTransaction from '@/components/Transaction/Transfers';
import DepositTransaction from '@/components/Transaction/Deposits';
import DebtTransaction from '@/components/Transaction/Debts';

export default {
  components: { TransferTransaction, DebtTransaction, DepositTransaction },
  data() {
    return {
      tabs: 'transfer',
      transfer: 0,
      debt: 0,
      deposit: 0
    };
  },
  mounted() {
    this.$refs.transfer.load();
    this.$refs.debt.load();
    this.$refs.deposit.load();
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
    debtReloadCompleted() {
      this.debt = this.$refs.debt.$data.pagination.total;
    },
    depositReloadCompleted() {
      this.deposit = this.$refs.deposit.$data.pagination.total;
    }
  }
};
</script>
