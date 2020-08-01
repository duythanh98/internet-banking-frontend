<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form ref="form" :model="form" :rules="rules" status-icon label-position="top" @submit.native.prevent @validate="validated">
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
          <el-col :md="12" :xs="24">
            <el-form-item prop="permission" label="Quyền">
              <el-select v-model="form.permission" placeholder="Chọn quyền" style="width: 100%">
                <el-option
                  v-for="(title, value) in permissions"
                  :key="value"
                  :label="title"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <div v-if="hasChanged" style="text-align: center; margin-top: 20px">
          <el-button :disabled="formInvalid || submitting" :loading="submitting" type="primary" @click="save">Lưu lại</el-button>
          <el-button :disabled="submitting" type="danger" @click="reset">Đặt lại</el-button>
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
        name: '',
        email: '',
        phone: '',
        permission: 'customer'
      },
      formValidateResult: {
        name: false,
        email: false,
        phone: false,
        permission: true
      },
      originalData: {},
      submitting: false,
      duplicatedEmail: [],
      id: this.$route.params.id || 0,
      rules: {
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
      }
    };
  },
  computed: {
    formInvalid() {
      return Object.values(this.formValidateResult).some(t => t === false);
    },
    hasChanged() {
      return Object.keys(this.form).some(k => this.form[k] !== this.originalData[k]);
    }
  },
  methods: {
    async load() {
      try {
        const result = await this.$store.dispatch('user/getUserInfo', this.id);
        this.originalData = result;
        switch (result.permission) {
          case 1: this.originalData.permission = 'admin'; break;
          case 2: this.originalData.permission = 'employee'; break;
          default: this.originalData.permission = 'customer'; break;
        }
        Object.keys(this.form).forEach(k => {
          this.form[k] = this.originalData[k];
        });
      } catch (err) {
        this.$notify.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      }
    },
    async save() {
      this.submitting = true;

      try {
        await this.$store.dispatch('user/editUser', { id: this.id, ...this.form });
        Object.keys(this.form).forEach(k => {
          this.originalData[k] = this.form[k];
        });

        this.$notify.success({ message: 'Chỉnh sửa thành công', position: 'bottom-right' });
      } catch (err) {
        this.$notify.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        this.submitting = false;
      }
    },
    reset() {
      Object.keys(this.form).forEach(k => {
        this.form[k] = this.originalData[k];
      });
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
