<template>
  <div class="app-container">
    <div class="filter-container">
      <table style="width:100%">
        <tr>
          <th>Số tài khoản:</th>
          <td>{{ form.account_number }}</td>
        </tr>
        <tr>
          <th>Tên tài khoản:</th>
          <td>{{ form.account_name }}</td>
        </tr>
        <tr>
          <th>Tên gợi nhớ:</th>
          <td>{{ form.name }}</td>
        </tr>
        <tr>
          <th>Ngân hàng:</th>
          <td>{{ form.bank_name }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
import AccountApi from '@/api/prod/account.api';
import permission from '@/directive/permission';
import TransferApi from '@/api/prod/transfer.api';

export default {
  directives: { permission },

  data() {
    return {
      form: {
        account_number: '',
        name: '',
        bank_id: '0',
        bank_name: ''
      },
      originalData: {
        name: ''
      },
      isLoaded: false,
      submitting: false,
      accountLoading: false,
      banks: { 0: 'TeaBank' },
      id: this.$route.params.id || 0
    };
  },
  computed: {
    isCurrentCustomer() {
      const roles = [...this.$store.getters.roles];
      return roles.includes('customer');
    }
  },
  created() {
    this.getBanks();
    this.reload();
  },
  methods: {
    async reload() {
      try {
        const result = await this.$store.dispatch('user/getContact', { id: this.id });

        Object.keys(this.form).forEach(k => {
          this.form[k] = result[k];
        });
        this.onAccountChange(this.form.account_number);
        this.originalData.name = result.name;
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      }
    },
    async onAccountChange(accountNumber) {
      const isValid = accountNumber && /^\d+$/.test(accountNumber) && accountNumber !== this.currentAccount;

      if (!isValid) {
        this.form.account_name = '';
        return false;
      }

      this.form.account_name = '';

      this.accountLoading = true;
      const api = new AccountApi();
      api.setToken(this.$store.state.user.token);
      let res = null;

      if (this.form.bank_id === '0' || !this.form.bank_id) {
        res = await api.getUserNameByAccountNumber(accountNumber);
      } else {
        res = await api.getExternalAccount(accountNumber, this.form.bank_id);
      }

      this.accountLoading = false;

      if (!res.isFailed()) {
        const result = res.result();

        if (!result) {
          this.validForm = false;
          this.form.account_name = '';
          return;
        }

        this.form.account_name = (typeof result === 'string' ? result : result.name);
        this.form = { ...this.form };
      }
    },
    async getBanks() {
      const api = new TransferApi();
      api.setToken(this.$store.state.user.token);

      const res = await api.getFee();

      const result = res.result();
      if (result.external) {
        result.external.forEach(b => {
          this.banks[b.bank_id] = b.bank_name;
        });
        this.banks = { ...this.banks };
      }
    }
  }
};
</script>

<style lang="scss" scoped>
table {
  width: 100%;
  font-size: 14px;
  color: #606266;
  background-color: #fff;
  border-collapse: collapse;
  border: 1px solid #dfe6ec;

  th {
    width: 40%;
    text-align: left;
    padding: 10px 20px;
    border-collapse: collapse;
    border: 1px solid #dfe6ec;
  }

  td {
    width: 60%;
    text-align: left;
    padding: 10px 20px;
    border-collapse: collapse;
    border: 1px solid #dfe6ec;
  }
}
</style>
