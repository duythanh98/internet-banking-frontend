import mock from './mock';
import Users from './data/user.data';
import Settings from './data/setting.data';
import Login from './data/login.data';
import BlockedUser from './data/blocked-user.data';
import ResponseData from './response';
import { containAllKeys } from '../../helpers/object';
import CryptoJs from 'crypto-js';

mock.onPost('/users/me')
  .reply(async function(config) {
    const postData = JSON.parse(config.data);

    if (!containAllKeys(postData, ['name', 'birthday'])) {
      return new ResponseData().status(422).error(1).toMockData();
    }

    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const userApi = config.headers.Authorization.split(' ');

    const authUser = JSON.parse(CryptoJs.enc.Base64.parse(userApi[1].split('.')[1]).toString(CryptoJs.enc.Utf8));

    const user = Users.find(u => u.id === authUser.jwtid);
    const index = Users.findIndex(u => u.id === authUser.jwtid);

    if (!user) {
      return new ResponseData().status(204).error(0).toMockData();
    }

    Users[index].name = postData.name;
    Users[index].birthday = `${postData.birthday.year}-${postData.birthday.month}-${postData.birthday.day}`;

    return new ResponseData().status(200).error(0).toMockData(Users[index]);
  }
  );

mock.onGet('/users/me/settings')
  .reply(async function(config) {
    if (!config.headers.Authorization) {
      return new ResponseData().status(403).error(-1).toMockData();
    }

    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const userApi = config.headers.Authorization.split(' ');

    const authUser = JSON.parse(CryptoJs.enc.Base64.parse(userApi[1].split('.')[1]).toString(CryptoJs.enc.Utf8));

    const setting = Settings.find(u => u.id === authUser.jwtid);

    if (!setting) {
      return new ResponseData().status(404).error(1).toMockData();
    }

    return new ResponseData().status(200).error(0).toMockData(setting);
  });

mock.onPut('/users/me/settings')
  .reply(async function(config) {
    const postData = JSON.parse(config.data);

    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const userApi = config.headers.Authorization.split(' ');

    const authUser = JSON.parse(CryptoJs.enc.Base64.parse(userApi[1].split('.')[1]).toString(CryptoJs.enc.Utf8));

    const user = Settings.find(u => u.id === authUser.jwtid);
    const index = Settings.findIndex(u => u.id === authUser.jwtid);

    if (!user) {
      return new ResponseData().status(404).error(1).toMockData();
    }

    Object.keys(postData).forEach(key => {
      Settings[index][key] = postData[key];
    });

    return new ResponseData().status(200).error(0).toMockData();
  });

mock.onGet('/users/me/login')
  .reply(async function(config) {
    if (!config.headers.Authorization) {
      return new ResponseData().status(403).error(-1).toMockData();
    }

    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const userApi = config.headers.Authorization.split(' ');

    const authUser = JSON.parse(CryptoJs.enc.Base64.parse(userApi[1].split('.')[1]).toString(CryptoJs.enc.Utf8));

    const login = Login.find(u => u.id === authUser.jwtid);

    if (!login) {
      return new ResponseData().status(404).error(1).toMockData();
    }

    return new ResponseData().status(200).error(0).toMockData(login);
  });

mock.onGet('/users/me/settings/block')
  .reply(async function(config) {
    if (!config.headers.Authorization) {
      return new ResponseData().status(403).error(-1).toMockData();
    }

    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const userApi = config.headers.Authorization.split(' ');

    const authUser = JSON.parse(CryptoJs.enc.Base64.parse(userApi[1].split('.')[1]).toString(CryptoJs.enc.Utf8));

    const blockedUser = BlockedUser.find(u => u.user_id === authUser.jwtid);

    if (!blockedUser) {
      return new ResponseData().status(404).error(1).toMockData();
    }

    const result = {};

    result.data = blockedUser.data.reduce((acc, blockedUserId) => {
      const user = Users.find(u => u.id === blockedUserId);
      if (user) {
        const { id, name, avatar } = user;
        acc.push({ user_id: id, name: name, avatar: avatar });
      }
      return acc;
    }, []);

    result.limit = blockedUser.data.length;
    result.page = 1;
    result.total = blockedUser.data.length;
    result.lastPage = Math.ceil(blockedUser.total / blockedUser.limit);

    return new ResponseData().status(200).error(0).toMockData(result);
  });

mock.onDelete('/users/me/settings/block')
  .reply(async function(config) {
    if (!config.headers.Authorization) {
      return new ResponseData().status(403).error(-1).toMockData();
    }

    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const userApi = config.headers.Authorization.split(' ');

    const authUser = JSON.parse(CryptoJs.enc.Base64.parse(userApi[1].split('.')[1]).toString(CryptoJs.enc.Utf8));

    const userIndex = BlockedUser.findIndex(u => u.user_id === authUser.jwtid);
    const blockedUser = BlockedUser[userIndex] || [];

    if (!blockedUser) {
      return new ResponseData().status(404).error(1).toMockData();
    }

    const postData = JSON.parse(config.data);

    const index = blockedUser.data.findIndex(id => id == postData.user_id);
    BlockedUser[userIndex].data.splice(index, 1);

    return new ResponseData().status(200).error(0).toMockData();
  });
