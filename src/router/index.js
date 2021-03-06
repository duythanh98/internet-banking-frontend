import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

/* Layout */
import Layout from '@/layout';

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    noCache: true                if set true, the page will no be cached(default is false)
    affix: true                  if set true, the tag will affix in the tags-view
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/reset-password',
    hidden: true,
    name: 'ResetPassword',
    component: () => import('@/views/authentication/reset-password'),
    meta: {
      title: 'Đặt lại mật khẩu'
    }
  },
  {
    path: '/auth-redirect',
    component: () => import('@/views/login/auth-redirect'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error-page/401'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/index'),
        name: 'Dashboard',
        meta: { title: 'Tổng quan', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/profile',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '',
        component: () => import('@/views/profile/index'),
        name: 'Profile',
        meta: { title: 'Hồ sơ' }
      }
    ]
  }
];

/**
 * asyncRoutes
 * the routes that need to be dynamically loaded based on user roles
 */
export const asyncRoutes = [
  {
    path: '/accounts',
    component: Layout,
    meta: {
      title: 'Tài khoản',
      icon: 'user',
      roles: ['customer']
    },
    children: [
      {
        path: '',
        name: 'Account',
        component: () => import('@/views/accounts/page'),
        meta: {
          title: 'Tài khoản',
          icon: 'user'
        }
      }
    ]
  },
  {
    path: '/users',
    component: Layout,
    meta: {
      title: 'Người dùng',
      icon: 'user',
      roles: ['admin', 'employee']
    },
    children: [
      {
        path: '',
        name: 'UserList',
        component: () => import('@/views/users/page'),
        meta: {
          title: 'Danh sách người dùng',
          // icon: 'list',
          roles: ['admin', 'employee']
        }
      },
      {
        path: 'admin/new',
        name: 'AddAdmin',
        component: () => import('@/views/users/add'),
        hidden: true,
        meta: {
          title: 'Thêm mới quản trị viên',
          permission: 'admin',
          roles: ['admin']
        }
      },
      {
        path: 'employee/new',
        name: 'AddEmployee',
        component: () => import('@/views/users/add'),
        hidden: true,
        meta: {
          title: 'Thêm mới nhân viên',
          permission: 'employee',
          roles: ['admin']
        }
      },
      {
        path: 'customer/new',
        name: 'AddCustomer',
        component: () => import('@/views/users/add'),
        hidden: true,
        meta: {
          title: 'Thêm mới khách hàng',
          permission: 'customer',
          roles: ['admin', 'employee']
        }
      },
      {
        path: ':id',
        name: 'ViewUser',
        component: () => import('@/views/users/view'),
        hidden: true,
        meta: {
          title: 'Thông tin người dùng',
          roles: ['admin', 'employee']
        }
      }
    ]
  },
  {
    path: '/change-password',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '',
        name: 'ChangePassword',
        component: () => import('@/views/authentication/change-password'),
        meta: {
          title: 'Đổi mật khẩu'
        }
      }
    ]
  },
  {
    path: '/transfer',
    component: Layout,
    meta: {
      title: 'Chuyển khoản',
      icon: 'lock',
      roles: ['customer']
    },
    children: [
      {
        path: '',
        component: () => import('@/views/transfer'),
        name: 'Transfer',
        meta: {
          title: 'Chuyển khoản',
          icon: 'lock'
        }
      }
    ]
  },
  {
    path: '/reminders',
    component: Layout,
    meta: {
      title: 'Nhắc nợ',
      icon: 'payment',
      roles: ['customer']
    },
    children: [
      {
        path: '',
        component: () => import('@/views/reminders/page'),
        name: 'ReminderList',
        meta: {
          title: 'Danh sách nhắc nợ'
        }
      },
      {
        path: 'new',
        component: () => import('@/views/reminders/add'),
        name: 'AddReminder',
        meta: {
          title: 'Thêm nhắc nợ'
        }
      }
    ]
  },
  {
    path: '/reminders/:id',
    component: Layout,
    hidden: true,
    meta: {
      title: 'Nhắc nợ',
      icon: 'payment',
      roles: ['customer', 'admin']
    },
    children: [
      {
        path: '',
        component: () => import('@/views/reminders/view'),
        name: 'ViewReminder',
        hidden: true,
        meta: {
          title: 'Chi tiết nhắc nợ'
        }
      }
    ]
  },
  {
    path: '/deposit',
    component: Layout,
    meta: {
      title: 'Nạp tiền',
      icon: 'money',
      roles: ['employee']
    },
    children: [
      {
        path: '',
        component: () => import('@/views/deposits/page'),
        name: 'Deposit',
        meta: {
          title: 'Nạp tiền',
          icon: 'money'
        }
      }
    ]
  },
  {
    path: '/contacts',
    component: Layout,
    meta: {
      title: 'Liên hệ',
      icon: 'contact',
      roles: ['customer']
    },
    children: [
      {
        path: '',
        component: () => import('@/views/contacts/page'),
        name: 'ContactList',
        meta: {
          title: 'Danh sách liên hệ'
        }
      },
      {
        path: 'new',
        component: () => import('@/views/contacts/add'),
        name: 'AddContact',
        meta: {
          title: 'Thêm liên hệ'
        }
      },
      {
        path: ':id',
        component: () => import('@/views/contacts/edit'),
        name: 'EditContact',
        hidden: true,
        meta: {
          title: 'Chỉnh sửa liên hệ'
        }
      }
    ]
  },
  {
    path: '/contacts/:id',
    component: Layout,
    hidden: true,
    meta: {
      title: 'Liên hệ',
      icon: 'contact',
      roles: ['admin']
    },
    children: [
      {
        path: '',
        component: () => import('@/views/contacts/view'),
        name: 'ViewContact',
        hidden: true,
        meta: {
          title: 'Chi tiết liên hệ'
        }
      }
    ]
  },
  {
    path: '/transactions',
    component: Layout,
    meta: {
      title: 'Giao dịch',
      icon: 'transaction',
      roles: ['customer', 'admin']
    },
    children: [
      {
        path: '',
        component: () => import('@/views/transactions/page'),
        name: 'TransactionList',
        meta: {
          title: 'Lịch sử giao dịch',
          roles: ['customer']
        }
      },
      {
        path: '',
        component: () => import('@/views/transactions/banks'),
        name: 'BankTransaction',
        meta: {
          title: 'Lịch sử giao dịch',
          roles: ['admin']
        }
      }
    ]
  },
  // {
  //   path: '/permission',
  //   component: Layout,
  //   redirect: '/permission/page',
  //   alwaysShow: true, // will always show the root menu
  //   name: 'Permission',
  //   meta: {
  //     title: 'Permission',
  //     icon: 'lock',
  //     roles: ['admin', 'editor'] // you can set roles in root nav
  //   },
  //   children: [
  //     {
  //       path: 'page',
  //       component: () => import('@/views/permission/page'),
  //       name: 'PagePermission',
  //       meta: {
  //         title: 'Page Permission',
  //         roles: ['admin'] // or you can only set roles in sub nav
  //       }
  //     },
  //     {
  //       path: 'directive',
  //       component: () => import('@/views/permission/directive'),
  //       name: 'DirectivePermission',
  //       meta: {
  //         title: 'Directive Permission'
  //         // if do not set roles, means: this page does not require permission
  //       }
  //     },
  //     {
  //       path: 'role',
  //       component: () => import('@/views/permission/role'),
  //       name: 'RolePermission',
  //       meta: {
  //         title: 'Role Permission',
  //         roles: ['admin']
  //       }
  //     }
  //   ]
  // },

  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404', hidden: true }
];

const createRouter = () => new Router({
  mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
});

const router = createRouter();

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter();
  router.matcher = newRouter.matcher; // reset router
}

export default router;
