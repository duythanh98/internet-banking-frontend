<template>
  <div class="app-container">
    <el-tabs v-model="tabs.currentTab" @tab-click="changeTab">
      <el-tab-pane name="edit">
        <span slot="label">Thông tin cá nhân</span>
        <edit-user ref="edit" />
      </el-tab-pane>

      <template v-if="isCustomer && isAuthorized">
        <el-tab-pane name="transaction">
          <span slot="label"><svg-icon icon-class="info" /> {{ 'Giao dịch' }}</span>
          <div id="edit-card">
            <el-tabs v-model="tabs.childrenTab.transaction" type="card" @tab-click="changeTab">
              <el-tab-pane name="transfer">
                <span slot="label"><svg-icon icon-class="info" /> {{ `Chuyển khoản (${transfer})` }}</span>
                <transfer-transaction ref="transfer" @reload-completed="transferReloadCompleted" />
              </el-tab-pane>
              <el-tab-pane name="debt">
                <span slot="label"><svg-icon icon-class="info" /> {{ `Thanh toán nợ (${debt})` }}</span>
                <debt-transaction ref="debt" @reload-completed="debtReminderReloadCompleted" />
              </el-tab-pane>
              <el-tab-pane name="deposit">
                <span slot="label"><svg-icon icon-class="info" /> {{ `Nhận tiền (${deposit})` }}</span>
                <deposit-transaction ref="deposit" @reload-completed="depositReloadCompleted" />
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-tab-pane>

        <el-tab-pane name="reminders">
          <span slot="label"><svg-icon icon-class="info" /> {{ 'Nhắc nợ' }}</span>
          <div id="edit-card">
            <el-tabs v-model="tabs.childrenTab.reminders" type="card" @tab-click="changeTab">
              <el-tab-pane name="debtReminder">
                <span slot="label"><svg-icon icon-class="info" /> {{ `Nhắc nợ đã nhận (${debtReminder})` }}</span>
                <reminder ref="debtReminder" @reload-completed="debtReminderReloadCompleted" />
              </el-tab-pane>
              <el-tab-pane name="reminder">
                <span slot="label"><svg-icon icon-class="info" /> {{ `Nhắc nợ đã gửi (${reminder})` }}</span>
                <reminder ref="reminder" :reminding="true" @reload-completed="reminderReloadCompleted" />
              </el-tab-pane>
              <el-tab-pane name="unpaidDebt">
                <span slot="label"><svg-icon icon-class="info" /> {{ `Nhắc nợ chưa thanh toán (${unpaid})` }}</span>
                <reminder ref="unpaidDebt" :filter-status="unpaidStatus" @reload-completed="unpaidDebtReloadCompleted" />
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-tab-pane>

        <el-tab-pane name="contact">
          <span slot="label"><svg-icon icon-class="info" /> {{ 'Liên hệ' }}</span>
          <contact ref="contact" @reload-completed="contactReloadCompleted" />
        </el-tab-pane>

      </template>
    </el-tabs></div>
</template>

<script>
import EditUser from '@/components/User/Edit';
import Contact from '@/components/Contact/List';
import Reminder from '@/components/Reminder/List';
import DebtTransaction from '@/components/Transaction/Debts';
import DepositTransaction from '@/components/Transaction/Deposits';
import TransferTransaction from '@/components/Transaction/Transfers';

export default {
  name: 'ViewUser',
  components: {
    EditUser, Contact, Reminder, TransferTransaction, DebtTransaction, DepositTransaction
  },

  data() {
    return {
      transfer: 0,
      debt: 0,
      contact: 0,
      deposit: 0,
      reminder: 0,
      unpaid: 0,
      debtReminder: 0,
      unpaidStatus: ['created'],
      isCustomer: false,
      tabs: {
        currentTab: 'edit',
        childrenTab: {
          transaction: 'transfer',
          reminders: 'debtReminder'
        }
      }
    };
  },
  computed: {
    isAuthorized() {
      const roles = [...this.$store.getters.roles];
      return roles.includes('admin');
    }
  },
  async mounted() {
    await this.$refs.edit.load();
    const permission = this.$refs.edit.$data.form.permission;

    if (permission && permission === 'customer') {
      this.isCustomer = true;
    }
  },
  methods: {
    changeTab() {
      const currentTab = this.tabs.currentTab;
      const refTab = this.tabs.childrenTab[currentTab];
      if (refTab) {
        if (this.$refs[refTab]) {
          this.$refs[refTab].load();
        }
      } else {
        if (this.$refs[currentTab]) {
          this.$refs[currentTab].load();
        }
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
    },
    debtReminderReloadCompleted() {
      this.debtReminder = this.$refs.debtReminder.$data.pagination.total;
    },
    reminderReloadCompleted() {
      this.reminder = this.$refs.reminder.$data.pagination.total;
    },
    unpaidDebtReloadCompleted() {
      this.unpaid = this.$refs.unpaidDebt.$data.pagination.total;
    },
    contactReloadCompleted() {
      this.contact = this.$refs.contact.$data.pagination.total;
    }
  }
};
</script>
