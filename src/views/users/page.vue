<template>
  <div class="app-container">
    <el-tabs v-model="tabs" @tab-click="changeTab">
      <template v-if="isAdmin">
        <el-tab-pane name="admin">
          <span slot="label">{{ `Quản trị viên (${admin})` }}</span>
          <user ref="admin" :permissions="['admin']" @admin-reload-completed="adminReloadCompleted" />
        </el-tab-pane>
        <el-tab-pane name="employee">
          <span slot="label">{{ `Nhân viên (${employee})` }}</span>
          <user ref="employee" :permissions="['employee']" @employee-reload-completed="employeeReloadCompleted" />
        </el-tab-pane>
      </template>

      <el-tab-pane name="customer">
        <span slot="label">{{ `Khách hàng (${customer})` }}</span>
        <user ref="customer" :permissions="['customer']" @customer-reload-completed="customerReloadCompleted" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import permission from '@/directive/permission';
import User from '@/components/User/List';

export default {
  directives: { permission },
  components: { User },
  data() {
    return {
      tabs: 'admin',
      admin: 0,
      employee: 0,
      customer: 0
    };
  },
  computed: {
    isAdmin() {
      const roles = this.$store.getters.roles;
      return roles.includes('admin');
    }
  },
  created() {
    this.tabs = this.isAdmin ? 'admin' : 'customer';
  },
  methods: {
    changeTab() {
      if (this.$refs[this.tabs]) {
        this.$refs[this.tabs].load();
      }
    },
    adminReloadCompleted() {
      this.admin = this.$refs.admin.$data.pagination.total;
    },
    employeeReloadCompleted() {
      this.employee = this.$refs.employee.$data.pagination.total;
    },
    customerReloadCompleted() {
      this.customer = this.$refs.customer.$data.pagination.total;
    }
  }
};
</script>
