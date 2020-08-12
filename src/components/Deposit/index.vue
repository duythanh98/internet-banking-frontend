<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form ref="filter" :model="filter" :rules="filterRules" @submit.native.prevent @validate="filterValidated">
        <el-row :gutter="20">
          <el-col :md="8" :xs="24">
            <el-form-item prop="account_number">
              <el-input
                v-model="filter.account_number"
                class="filter-item"
                placeholder="Số tài khoản"
                maxlength="16"
                @keyup.enter.native="handleFilter"
              />
            </el-form-item>
          </el-col>

          <el-col :md="2" :xs="24" style="text-align: center; padding: 10px 0">
            <div>hoặc</div>
          </el-col>

          <el-col :md="8" :xs="24">
            <el-form-item prop="username">
              <el-input
                v-model="filter.username"
                class="filter-item"
                placeholder="Tên đăng nhập"
                maxlength="32"
                @keyup.enter.native="handleFilter"
              />
            </el-form-item>
          </el-col>

          <el-col :md="6" :xs="24">
            <el-button
              class="filter-item"
              type="primary"
              icon="el-icon-search"
              style="width: 100%"
              :loading="accountLoading"
              :disabled="filterInvalid || accountLoading"
              @click="handleFilter"
            >Tìm kiếm</el-button>
          </el-col></el-row>
      </el-form>

      <el-row v-if="isLoaded" type="flex" class="panel-group">
        <el-col :xs="24" class="card-panel-col">
          <div class="card-panel">
            <div class="card-panel-icon-wrapper icon-people">
              <svg-icon icon-class="peoples" class-name="card-panel-icon" />
            </div>
            <div class="card-panel-description">
              <el-row class="panel-group">
                <el-col :xs="12" :sm="12" :md="8" style="width: 150px;" class="card-panel-col">
                  <div class="card-panel-name">
                    Họ tên
                  </div>
                </el-col>
                <el-col :xs="12" :sm="12" :md="16" class="card-panel-col">
                  <div class="card-panel-name">
                    {{ form.account_name }}
                  </div>
                </el-col>
              </el-row>
              <el-row class="panel-group">
                <el-col :xs="12" :sm="12" :lg="12" :md="12" style="width: 150px;" class="card-panel-col">
                  <div class="card-panel-account">
                    Số tài khoản
                  </div>
                </el-col>
                <el-col :xs="12" :sm="12" :lg="12" :md="12" class="card-panel-col">
                  <div class="card-panel-account">
                    {{ form.account_number }}
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-form v-if="isLoaded" ref="form" :model="form" :rules="rules" status-icon label-position="top" @submit.native.prevent @validate="validated">
        <el-row :gutter="20">
          <el-col :md="24" :xs="24">
            <el-form-item prop="amount" label="Số tiền nạp vào tài khoản">
              <el-input v-model.number="form.amount" max="1000000000" min="1" maxlength="10" />
              <span class="small">Số tiền bạn nhập: <strong>{{ form.amount | toThousandFilter }}đ</strong></span>
            </el-form-item>
          </el-col>
        </el-row>
        <div style="text-align: center; margin-top: 20px">
          <el-button
            :disabled="formInvalid || submitting"
            :loading="submitting"
            type="primary"
            @click="save"
          >Nạp tiền</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import permission from '@/directive/permission';
import AccountApi from '@/api/prod/account.api';

export default {
  directives: { permission },

  data() {
    const amountValidator = (rule, value, cb) => {
      if (typeof value !== 'number' || value < 1 || value > 1000000000) {
        return cb(new Error('Số tiền từ 1 - 1,000,000,000'));
      }

      return cb();
    };

    const accountNumberValidator = (rule, value, cb) => {
      if (!value || !/^\d{16}$/.test(value)) {
        return cb(new Error('Số tài khoản gồm 16 chữ số'));
      }

      return cb();
    };

    return {
      form: {
        amount: '',
        account_name: '',
        account_number: '',
        balance: ''
      },
      isLoaded: false,
      submitting: false,
      accountLoading: false,
      formValidateResult: {
        amount: false,
        account_name: false
      },
      rules: {
        amount: [
          {
            required: true,
            trigger: 'change',
            validator: amountValidator
          }
        ]
      },
      filter: {
        account_number: '',
        username: ''
      },
      filterValidateResult: {
        account_number: false,
        username: false
      },
      filterRules: {
        account_number: [
          {
            trigger: 'change',
            validator: accountNumberValidator
          }
        ],
        username: [
          {
            min: 6,
            max: 32,
            message: 'Tên đăng nhập từ 6 tới 32 kí tự',
            trigger: 'change'
          }
        ]
      }
    };
  },
  computed: {
    formInvalid() {
      return Object.values(this.formValidateResult).some(t => t === false);
    },
    filterInvalid() {
      return Object.values(this.filterValidateResult).every(t => t === false);
    },
    hasChanged() {
      return Object.keys(this.form).some(k => this.form[k] !== '');
    }
  },
  methods: {
    async handleFilter() {
      const isValid = (this.filter.account_number && /^\d{16}$/.test(this.filter.account_number)) ||
        (this.filter.username.length >= 6 && this.filter.username.length <= 32);
      this.formValidateResult.account_name = false;

      if (!isValid) {
        return false;
      }

      this.isLoaded = false;
      this.accountLoading = true;

      const api = new AccountApi();
      api.setToken(this.$store.state.user.token);

      let res = null;
      this.accountLoading = false;

      if (this.filterValidateResult.account_number && this.filter.account_number) {
        res = await api.getUserNameByAccountNumber(this.filter.account_number);
      } else {
        res = await api.getUserInfoByUsername(this.filter.username);
      }

      if (!res.isFailed()) {
        const result = res.result();

        if (!result) {
          this.validForm = false;
          this.$notify.error({ message: 'Không tìm thấy tài khoản', position: 'bottom-right' });
          return;
        }

        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
          this.form.account_name = result.data[0].name;
          this.form.account_number = result.data[0].account.account_number;
        } else {
          this.form.account_name = result.name;
          this.form.account_number = this.filter.account_number;
        }
        this.formValidateResult.account_name = true;
        this.filterValidateResult.account_number = false;
        this.isLoaded = true;
        this.submitting = false;

        return this.reset('filter');
      }
      this.submitting = false;
      this.$notify.error({ message: 'Có lỗi xảy ra', position: 'bottom-right' });
    },
    async save() {
      this.submitting = true;

      try {
        await this.$store.dispatch('user/deposit',
          { account_number: this.form.account_number, amount: this.form.amount });
        this.reset('form');

        this.$notify.success({ message: 'Nạp tiền thành công', position: 'bottom-right' });
        this.reset('form');
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      } finally {
        this.submitting = false;
      }
    },
    reset(formName) {
      this.$refs[formName].resetFields();
    },
    validated(name, valid) {
      this.formValidateResult[name] = valid !== false;
    },
    filterValidated(name, valid) {
      this.filterValidateResult[name] = valid !== false;
    }
  }
};
</script>

<style lang="scss" scoped>
.card-panel {
    display: flex;
    height: 108px;
    width: 100%;
    cursor: pointer;
    font-size: 12px;
    position: relative;
    overflow: hidden;
    color: #666;
    background: #fff;
    box-shadow: 4px 4px 40px rgba(0, 0, 0, .05);
    border-color: rgba(0, 0, 0, .05);

    &:hover {
      .card-panel-icon-wrapper {
        color: #fff;
      }

      .icon-people {
        background: #40c9c6;
      }
    }

    .icon-people {
      color: #40c9c6;
    }

    .card-panel-icon-wrapper {
      margin: 14px 0 0 14px;
      padding: 16px;
      transition: all 0.38s ease-out;
      border-radius: 6px;
    }

    .card-panel-icon {
      font-size: 48px;
    }

    .card-panel-description {
      flex: 1 1 auto;
      font-weight: bold;
      margin: 26px;

      .panel-group {
        width: 100%;
      }

      .card-panel-text {
        line-height: 18px;
        color: black;
        font-size: 18px;
        margin-bottom: 12px;
        text-align: right;
      }

      .card-panel-name {
        font-size: 16px;
        margin-bottom: 10px;
      }

      .card-panel-account {
        font-size: 16px;
        margin-bottom: 10px;
      }
    }
  }
</style>
