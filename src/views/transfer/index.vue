<template>
  <div class="app-container">
    <el-tabs v-model="activeName" v-loading="loading">
      <el-tab-pane key="internal" label="Chuyển tiền nội bộ" name="internal">
        <internal :fee="fee" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script>
import internal from './components/internal/index';
import TransferApi from '@/api/prod/transfer.api';

export default {
  components: {
    internal
  },
  data() {
    return {
      activeName: 'internal',
      fee: {

      },
      loading: true
    };
  },
  async created() {
    const api = new TransferApi();
    api.setToken(this.$store.state.user.token);

    const res = await api.getFee();

    const result = res.result();
    this.fee = result;
    this.loading = false;
  }
};
</script>
