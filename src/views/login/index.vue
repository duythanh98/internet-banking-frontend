<template>
  <div v-loading="refreshLogin && hasToken" class="login-container" element-loading-text="Đang đăng nhập...">
    <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" autocomplete="on" label-position="left">
      <div class="title-container">
        <h3 class="title">Đăng nhập</h3>
      </div>

      <el-form-item prop="username">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="username"
          v-model="loginForm.username"
          placeholder="Tên đăng nhập"
          name="username"
          type="text"
          tabindex="1"
          autocomplete="on"
        />
      </el-form-item>

      <el-tooltip v-model="capsTooltip" content="Caps lock is On" placement="right" manual>
        <el-form-item prop="password">
          <span class="svg-container">
            <svg-icon icon-class="password" />
          </span>
          <el-input
            :key="passwordType"
            ref="password"
            v-model="loginForm.password"
            :type="passwordType"
            placeholder="Mật khẩu"
            name="password"
            tabindex="2"
            autocomplete="on"
            @keyup.native="checkCapslock"
            @blur="capsTooltip = false"
            @keyup.enter.native="handleLogin"
          />
          <span class="show-pwd" @click="showPwd">
            <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
          </span>
        </el-form-item>
      </el-tooltip>

      <div style="margin-bottom: 10px">
        <vue-recaptcha
          ref="recaptcha"
          :sitekey="siteKey"
          :load-recaptcha-script="true"
          @verify="verifyRecaptcha"
          @expired="verifiedRecaptcha = false"
        />
      </div>

      <div class="forgot-password" @click="$router.push({path: '/reset-password'})">Quên mật khẩu?</div>

      <el-button :loading="loading" :disabled="invalidForm || loading" type="primary" style="width:100%;margin-bottom:30px;" @click.native.prevent="handleLogin">Đăng nhập</el-button>
    </el-form>
  </div>
</template>

<script src="https://www.google.com/recaptcha/api.js?onload=vueRecaptchaApiLoaded&render=explicit" async defer>
</script>
<script>
import router from '@/router';
import VueRecaptcha from 'vue-recaptcha';

export default {
  name: 'Login',
  components: { VueRecaptcha },
  data() {
    const validateUsername = (rule, value, callback) => {
      if (typeof value !== 'string' || value.length < 6 || value.length > 32) {
        callback(new Error('Tên đăng nhập từ 6 - 32 kí tự'));
      } else {
        callback();
      }
    };
    const validatePassword = (rule, value, callback) => {
      if (typeof value !== 'string' || value.length < 6 || value.length > 16) {
        callback(new Error('Mật khẩu từ 6 - 16 kí tự'));
      } else {
        callback();
      }
    };
    return {
      loginForm: {
        username: '',
        password: '',
        recaptcha: ''
      },
      loginRules: {
        username: [{ required: true, trigger: 'change', validator: validateUsername }],
        password: [{ required: true, trigger: 'change', validator: validatePassword }]
      },
      verifiedRecaptcha: false,
      passwordType: 'password',
      capsTooltip: false,
      loading: false,
      showDialog: false,
      redirect: undefined,
      otherQuery: {},
      refreshLogin: false,
      siteKey: ''
    };
  },
  computed: {
    accessToken() {
      return this.$store.state.user.token;
    },
    refreshToken() {
      return this.$store.state.user.refresh_token;
    },
    hasToken() {
      return this.accessToken && this.refreshToken;
    },
    invalidForm() {
      return !this.verifiedRecaptcha;
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        const query = route.query;
        if (query) {
          this.redirect = query.redirect;
          this.otherQuery = this.getOtherQuery(query);
        }
      },
      immediate: true
    }
  },
  created() {
    if (this.hasToken) {
      this.refreshLoginSession();
    }
    this.siteKey = process.env.VUE_APP_SITE_KEY || '';
  },
  mounted() {
    if (this.loginForm.username === '') {
      this.$refs.username.focus();
    } else if (this.loginForm.password === '') {
      this.$refs.password.focus();
    }
  },
  destroyed() {
    // window.removeEventListener('storage', this.afterQRScan)
  },
  methods: {
    refreshLoginSession() {
      this.refreshLogin = true;
      // try to get user info
      this.$store.dispatch('user/getInfo')
        .then(() => this.applyRoute().then(() => this.$router.push({ path: this.redirect || '/', query: this.otherQuery })))
        // if cant, must be refresh and then get again
        .catch(() => this.$store.dispatch('user/refreshToken').then(() => this.refreshLoginSession()))
        // if you cant refresh, clear all data
        .catch(() => this.$store.dispatch('user/resetToken'))
        .finally(() => {
          this.refreshLogin = false;
        });
    },
    checkCapslock(e) {
      const { key } = e;
      this.capsTooltip = key && key.length === 1 && (key >= 'A' && key <= 'Z');
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
    async handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true;
          this.$store.dispatch('user/login', this.loginForm)
            .then(() => this.$store.dispatch('user/getInfo'))
            .then(() => this.applyRoute())
            .then(() => {
              this.$router.push({ path: this.redirect || '/', query: this.otherQuery });
            })
            .catch((err) => {
              this.$notify.error({ message: err.message, position: 'bottom-right' });
              this.reset();
            })
            .finally(() => {
              this.loading = false;
            });
        }
      });
    },
    getOtherQuery(query) {
      return Object.keys(query).reduce((acc, cur) => {
        if (cur !== 'redirect') {
          acc[cur] = query[cur];
        }
        return acc;
      }, {});
    },
    async applyRoute() {
      const accessRoutes = await this.$store.dispatch('permission/generateRoutes', this.$store.state.user.roles);
      router.addRoutes(accessRoutes);
    },
    verifyRecaptcha(res) {
      if (typeof res === 'string') {
        this.loginForm.recaptcha = res;
        this.verifiedRecaptcha = true;
      }
    },
    reset() {
      this.$refs.recaptcha.reset();
    }
  }
};
</script>

<style lang="scss">
/* 修复input 背景不协调 和光标变色 */
/* Detail see https://github.com/PanJiaChen/vue-element-admin/pull/927 */

$bg:#283443;
$light_gray:#fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;
  }
}

/* reset element-ui css */
.login-container {
  .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;

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

.login-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  overflow: hidden;

  .login-form {
    position: relative;
    width: 375px;
    max-width: 100%;
    padding: 160px 35px 0;
    margin: 0 auto;
    overflow: hidden;

    .forgot-password {
      float: right;
      color: #eee;
      cursor: pointer;
      font-size: 14px;
      margin-bottom: 20px;
      text-decoration: underline
    }
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
