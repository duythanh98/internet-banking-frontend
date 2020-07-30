<template>
  <div class="reset-container">
    <el-form v-if="step === 1" ref="form" :model="form" :rules="resetRules" class="create-reset-form" autocomplete="on" label-position="left" @submit.native.prevent @validate="validated">
      <div class="title-container">
        <h3 class="title">Đặt lại mật khẩu</h3>
      </div>

      <el-row>
        <el-form-item>
          <el-input
            ref="formText"
            v-model="form.formText"
            class="filter-item"
            placeholder="Tên đăng nhập hoặc email"
            maxlength="150"
            tabindex="1"
            focus
            @input="inputFormText"
          />
        </el-form-item>
      </el-row>

      <el-row style="display: none">
        <el-col :md="11" :xs="24">
          <el-form-item prop="username">
            <el-input
              ref="username"
              v-model="form.username"
              class="filter-item"
              placeholder="Tên đăng nhập"
              maxlength="32"
              tabindex="1"
              focus
            />
          </el-form-item>
        </el-col>

        <el-col :md="11" :xs="24">
          <el-form-item prop="email">
            <el-input
              ref="email"
              v-model="form.email"
              class="filter-item"
              placeholder="Email"
              maxlength="150"
              tabindex="2"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :xs="24" :md="12">
          <el-button :loading="submitting" :disabled="invalidForm" type="primary" style="width:100%;margin-bottom:30px;" @click.native.prevent="submit">Đặt lại</el-button>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-button type="danger" style="width:100%;margin-bottom:30px;" @click.native.prevent="$router.push({path: '/login'})">Quay lại</el-button>
        </el-col>
      </el-row>
    </el-form>

    <el-form v-if="step === 2" ref="resettingForm" :model="resettingForm" :rules="resettingRules" class="reset-form" autocomplete="on" label-position="left" @submit.native.prevent @validate="resettingValidated">
      <div class="title-container">
        <h3 class="title">Đặt lại mật khẩu</h3>
      </div>

      <p v-if="!havingValidOtp" style="color: #eee">Nhập OTP ứng với mã giao dịch: <strong>{{ resettingForm.code || 'Không có' }}</strong></p>
      <el-col v-if="!havingValidOtp" :xs="24">
        <el-form-item prop="otp">
          <el-input
            v-model="resettingForm.otp"
            class="filter-item"
            placeholder="Nhập OTP"
            maxlength="6"
            tabindex="1"
            focus
          />
        </el-form-item>
      </el-col>

      <p style="color: #eee">Nhập mật khẩu mới:</p>
      <el-col :xs="24">
        <el-form-item prop="password">
          <el-input
            v-model="resettingForm.password"
            class="filter-item"
            type="password"
            placeholder="Mật khẩu"
            maxlength="16"
            tabindex="1"
            focus
          />
        </el-form-item>
      </el-col>

      <el-col :xs="24">
        <el-form-item prop="repassword">
          <el-input
            v-model="resettingForm.repassword"
            class="filter-item"
            type="password"
            placeholder="Nhập lại mật khẩu"
            maxlength="16"
            tabindex="1"
            focus
          />
        </el-form-item>
      </el-col>

      <el-button :loading="submitting" :disabled="invalidResettingForm" type="primary" style="width:100%;margin-bottom:30px;" @click.native.prevent="resetPassword">Đặt lại</el-button>
    </el-form>
  </div>
</template>

<script>
export default {
  data() {
    const validateUsername = (rule, value, cb) => {
      if (this.form.username && typeof this.form.username !== 'string' || this.form.username.length < 6 || this.form.username.length > 32) {
        cb(new Error('Tên đăng nhập từ 6 - 32 kí tự'));
      } else {
        cb();
      }
    };

    const matchNewPassword = (rule, value, cb) => {
      if (value && value !== this.resettingForm.password) {
        return cb(new Error('Không trùng khớp mật khẩu'));
      }

      return cb();
    };

    return {
      form: {
        formText: '',
        username: '',
        email: ''
      },
      resettingForm: {
        otp: '',
        password: '',
        repassword: ''
      },
      resetRules: {
        username: [{ trigger: 'change', validator: validateUsername }],
        email: [{
          required: true,
          type: 'email',
          message: 'Email không đúng định dạng',
          trigger: ['change']
        }]
      },
      resettingRules: {
        otp: [
          {
            required: true,
            min: 6,
            max: 6,
            message: 'Mã otp dài 6 kí tự',
            trigger: ['change']
          }
        ],
        password: [
          {
            required: true,
            min: 6,
            max: 16,
            message: 'Mật khẩu phải từ 6 đến 16 kí tự',
            trigger: ['change']
          }
        ],
        repassword: [
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
      },
      validationResult: {
        username: false,
        email: false
      },
      resettingValidationResult: {
        otp: false,
        password: false,
        repassword: false
      },
      submitting: false,
      havingValidOtp: false,
      step: 1
    };
  },
  computed: {
    invalidForm() {
      return Object.values(this.validationResult).every(v => v === false);
    },
    invalidResettingForm() {
      return Object.values(this.resettingValidationResult).some(v => v === false);
    }
  },
  created() {
    this.step = 1;
    const { code, otp } = this.$route.query;
    if (code && otp) {
      this.step = 2;
      this.resettingForm.otp = otp;
      this.havingValidOtp = true;
    }
  },
  methods: {
    async submit() {
      const formData = {};
      if (this.validationResult.email) {
        formData.email = this.form.formText;
      } else if (this.validationResult.username) {
        formData.username = this.form.formText;
      } else {
        this.validationResult.email = false;
        this.validationResult.username = false;
        return;
      }
      await this.createResetPassword(formData);
    },
    async createResetPassword(formData) {
      this.submitting = true;
      try {
        const result = await this.$store.dispatch('user/createResetPassword', formData);

        this.resettingForm.code = result.code;
        this.step = 2;
        this.reset('form');
      } catch (err) {
        this.$notify.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        this.submitting = false;
      }
    },
    async resetPassword() {
      this.submitting = true;
      try {
        await this.$store.dispatch('user/resetPassword', this.resettingForm);
        this.$notify.success({ message: 'Đặt lại mật khẩu thành công', position: 'bottom-right' });
        this.reset('resettingForm');
        this.$router.push({ name: 'Dashboard' });
        this.step = 1;
      } catch (err) {
        this.$notify.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        this.submitting = false;
      }
    },
    validated(name, valid) {
      this.validationResult[name] = valid !== false;
    },
    resettingValidated(name, valid) {
      this.resettingValidationResult[name] = valid !== false;
    },
    reset(formName) {
      this.$refs[formName].resetFields();
    },
    inputFormText(value) {
      this.form.username = value;
      this.form.email = value;
    }
  }
};
</script>

<style lang="scss">
$bg:#283443;
$light_gray:#fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .reset-container .el-input input {
    color: $cursor;
  }
}

/* reset element-ui css */
.reset-container {
  .el-input {
    display: inline-block;
    height: 47px;
    width: 100%;

    input {
      background: transparent;
      border: 0px;
      -webkit-appearance: none;
      border-radius: 0px;
      padding: 12px 5px 12px 15px;
      color: $light_gray;
      height: 47px;
      caret-color: $cursor;

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px $bg inset !important;
        -webkit-text-fill-color: $cursor !important;
      }
    }
  }

  .el-form-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    color: #454545;
  }
}
</style>

<style lang="scss" scoped>
$bg:#2d3a4b;
$dark_gray:#889aa4;
$light_gray:#eee;

.reset-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  overflow: hidden;

  .create-reset-form {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 160px 35px 0;
    margin: 0 auto;
    overflow: hidden;
  }

  .reset-form {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 160px 35px 0;
    margin: 0 auto;
    overflow: hidden;
  }

  .tips {
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;

    span {
      &:first-of-type {
        margin-right: 16px;
      }
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: $dark_gray;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .title-container {
    position: relative;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 40px auto;
      text-align: center;
      font-weight: bold;
    }
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 7px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
  }

  .thirdparty-button {
    position: absolute;
    right: 0;
    bottom: 6px;
  }

  @media only screen and (max-width: 470px) {
    .thirdparty-button {
      display: none;
    }
  }
}
</style>
