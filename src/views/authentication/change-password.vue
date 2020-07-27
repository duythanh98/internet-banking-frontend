<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form ref="form" :model="form" :rules="rules" status-icon label-position="top" @submit.native.prevent @validate="validated">

        <el-form-item prop="password" label="Mật khẩu">
          <el-input :key="passwordType" ref="password" v-model="form.password" :type="passwordType" maxlength="16" />
          <span class="show-pwd" @click="showPwd">
            <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
          </span>
        </el-form-item>

        <el-form-item prop="newPassword" label="Mật khẩu mới">
          <el-input v-model="form.newPassword" type="password" maxlength="16" />
        </el-form-item>

        <el-form-item prop="reNewPassword" label="Xác nhận mật khẩu mới">
          <el-input v-model="form.reNewPassword" type="password" maxlength="16" />
        </el-form-item>

        <div style="text-align: center; margin-top: 20px">
          <el-button :disabled="formInvalid" :loading="submitting" type="primary" @click="save">Đổi mật khẩu</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import permission from '@/directive/permission';

export default {
  directives: { permission },

  data() {
    const matchNewPassword = (rule, value, cb) => {
      if (value && value !== this.form.newPassword) {
        return cb(new Error('Không trùng khớp mật khẩu mới'));
      }

      if (!this.form.sender_pay_fee) {
        if (value - this.transferFee <= 0) {
          return cb(new Error(`Số tiền từ ${1 + this.transferFee} - 1,000,000,000`));
        }
      }

      return cb();
    };

    return {
      form: {
        password: '',
        newPassword: '',
        reNewPassword: ''
      },
      formValidateResult: {
        password: false,
        newPassword: false,
        reNewPassword: false
      },
      submitting: false,
      passwordType: 'password',
      rules: {
        password: [
          {
            required: true,
            min: 6,
            max: 16,
            message: 'Mật khẩu phải từ 6 đến 16 kí tự',
            trigger: ['change']
          }
        ],
        newPassword: [
          {
            required: true,
            min: 6,
            max: 16,
            message: 'Mật khẩu phải từ 6 đến 16 kí tự',
            trigger: ['change']
          }
        ],
        reNewPassword: [
          {
            required: true,
            min: 6,
            max: 16,
            message: 'Mật khẩu phải từ 6 đến 16 kí tự',
            trigger: ['change']
          },
          {
            validator: matchNewPassword,
            trigger: ['change']
          }
        ]
      }
    };
  },
  computed: {
    formInvalid() {
      return Object.values(this.formValidateResult).some(t => t === false);
    },
    hasChanged() {
      return Object.keys(this.form).some(k => this.form[k] !== '');
    }
  },
  methods: {
    async save() {
      this.submitting = true;

      try {
        await this.$store.dispatch('user/changePassword', this.form);
        this.reset('form');

        this.$notify.success({ message: 'Đổi mật khẩu thành công', position: 'bottom-right' });
      } catch (err) {
        this.$notify.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        this.submitting = false;
      }
    },
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = '';
      } else {
        this.passwordType = 'password';
      }
      this.$nextTick(() => {
        this.$refs.password.focus();
      });
    },
    reset(formName) {
      this.$refs[formName].resetFields();
    },
    validated(name, valid) {
      this.formValidateResult[name] = valid !== false;
    }
  }
};
</script>

<style scoped>
.show-pwd {
  position: absolute;
  right: 30px;
  top: 2px;
  font-size: 16px;
  cursor: pointer;
  user-select: none;
}
</style>
