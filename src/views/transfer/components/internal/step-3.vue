<template>
  <el-row type="flex" justify="center">
    <el-col :xs="24" :sm="12" :md="12">
      <el-alert
        title="Chuyển khoản thành công"
        type="success"
        show-icon
      />
      <div style="text-align: center; margin-top: 20px">
        <el-button type="primary" :disabled="saved" :icon="saved ? 'el-icon-check' : ''" :loading="loading" @click="save">
          {{ saved ? 'Đã lưu vào danh bạ': 'Thêm vào danh bạ chuyển khoản' }}
        </el-button>
        <el-button type="success" @click="$emit('new-transaction')">Giao dịch khác</el-button>
      </div>
    </el-col>
  </el-row>
</template>
<script>
import ContactApi from '@/api/prod/contact.api';

export default {
  props: {
    accountNumber: {
      type: String,
      required: false,
      default: ''
    },
    accountName: {
      type: String,
      required: false,
      default: ''
    }
  },
  data() {
    return {
      saved: false,
      loading: false
    };
  },
  computed: {
  },
  watch: {
  },
  methods: {
    async save() {
      this.loading = true;
      const api = new ContactApi();
      api.setToken(this.$store.getters.token);
      const res = await api.createNewContact(this.accountNumber, null, this.accountName);
      this.loading = false;

      if (res.isFailed()) {
        console.log(res.error);
        return this.$notify.error('Có lỗi xảy ra, hãy thử lại sau');
      }

      this.saved = true;
    }
  }
};
</script>
