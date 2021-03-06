<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form ref="form" :model="form" :rules="rules" status-icon label-position="top" @submit.native.prevent @validate="validated">
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item prop="username" label="Tên đăng nhập">
              <el-input v-model="form.username" maxlength="32" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item prop="password" label="Mật khẩu">
              <el-input :key="passwordType" ref="password" v-model="form.password" :type="passwordType" maxlength="16" />
              <span class="show-pwd" @click="showPwd">
                <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
              </span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item prop="name" label="Họ tên">
              <el-input v-model="form.name" maxlength="150" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item prop="email" label="Email">
              <el-input v-model="form.email" maxlength="150" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item prop="phone" label="Số điện thoại">
              <el-input v-model="form.phone" />
            </el-form-item>
          </el-col>
          <!-- <el-col :md="12" :xs="24">
            <el-form-item prop="permission" label="Quyền">
              <el-input :value="permissions[permission]" readonly />
            </el-form-item>
          </el-col> -->
        </el-row>

        <div style="text-align: center; margin-top: 20px">
          <el-button :disabled="formInvalid || submitting" :loading="submitting" type="primary" @click="save">Tạo tài khoản</el-button>
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
    const uniqueUsername = (rule, value, cb) => {
      if (value && this.duplicatedUsername.indexOf(value) >= 0) {
        return cb(new Error('Tên đăng nhập đã tồn tại'));
      }
      cb();
    };
    const uniqueEmail = (rule, value, cb) => {
      if (value && this.duplicatedEmail.indexOf(value) >= 0) {
        return cb(new Error('Email đã tồn tại'));
      }
      cb();
    };

    const validPhoneNumber = (rule, value, cb) => {
      if (value && !/^\+?\d{10,12}$/.test(value)) {
        return cb(new Error('Số điện thoại không đúng định dạng'));
      }
      cb();
    };

    return {
      form: {
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        permission: 'customer'
      },
      formValidateResult: {
        username: false,
        password: false,
        name: false,
        email: false,
        phone: false,
        permission: true
      },
      submitting: false,
      duplicatedEmail: [],
      duplicatedUsername: [],
      passwordType: 'password',
      rules: {
        username: [
          {
            required: true,
            message: 'Tên đăng nhập không được để trống',
            trigger: ['change']
          },
          {
            min: 6,
            max: 32,
            message: 'Tên đăng nhập phải từ 6 đến 32 kí tự',
            trigger: ['change']
          },
          {
            validator: uniqueUsername,
            trigger: ['change']
          }
        ],
        password: [
          {
            required: true,
            message: 'Mật khẩu không được để trống',
            trigger: ['change']
          },
          {
            min: 6,
            max: 16,
            message: 'Mật khẩu phải từ 6 đến 16 kí tự',
            trigger: ['change']
          }
        ],
        name: [
          {
            required: true,
            message: 'Tên người dùng không được để trống',
            trigger: ['change']
          },
          {
            min: 1,
            max: 150,
            message: 'Tên người dùng phải từ 1 đến 150 kí tự',
            trigger: ['change']
          }
        ],
        email: [
          {
            required: true,
            message: 'Email không được để trống',
            trigger: ['change']
          },
          {
            type: 'email',
            message: 'Email không đúng định dạng',
            trigger: ['change']
          },
          {
            validator: uniqueEmail,
            trigger: ['change']
          }
        ],
        phone: [
          {
            required: true,
            message: 'Số điện thoại không được để trống',
            trigger: ['change']
          },
          {
            validator: validPhoneNumber,
            trigger: ['change']
          }
        ],
        permission: [
          {
            required: true,
            message: 'Quyền Không được bỏ trống',
            trigger: ['change', 'blur']
          }
        ]
      },
      permissions: {
        'admin': 'Quản trị viên',
        'employee': 'Giao dịch viên',
        'customer': 'Khách hàng'
      },
      permission: this.$route.meta.permission || 'customer'
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
  created() {
    this.form.permission = this.permission || 'customer';
  },
  methods: {
    async save() {
      this.submitting = true;

      try {
        await this.$store.dispatch('user/createNewUser', this.form);
        this.reset('form');

        this.$notify.success({ message: 'Thêm mới thành công', position: 'bottom-right' });
        this.$router.push({ name: 'UserList' });
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
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
