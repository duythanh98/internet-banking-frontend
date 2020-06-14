import mock from './mock';
import Users from './data/user.data';
import BackupCodes from './data/backup.code.data';
import ResponseData from './response';
import { containAllKeys } from '../../helpers/object';
import CryptoJs from 'crypto-js';
import twoFactor from 'node-2fa';

mock.onGet('/users/me/settings/2fa')
  .reply(async function(config) {
    if (!config.headers.Authorization) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }

    const userApi = config.headers.Authorization.split(' ');

    const authUser = JSON.parse(CryptoJs.enc.Base64.parse(userApi[1].split('.')[1]).toString(CryptoJs.enc.Utf8));

    const user = Users.find(u => u.id === authUser.jwtid);

    const secret = user.code2fa;
    const hash = 'dhfhfh%4655Gvvv';

    return new ResponseData().status(200).error(0).toMockData({ secret, hash });
  });

mock.onPost('/users/me/settings/2fa')
  .reply(async function(config) {
    const postData = JSON.parse(config.data);

    console.log(postData);

    if (!containAllKeys(postData, ['secret', 'hash', 'password'])) {
      return new ResponseData().status(422).error(1).toMockData();
    }

    const userApi = config.headers.Authorization.split(' ');

    const authUser = JSON.parse(CryptoJs.enc.Base64.parse(userApi[1].split('.')[1]).toString(CryptoJs.enc.Utf8));

    const user = Users.find(u => u.id === authUser.jwtid);
    if (!user.code2fa) {
      return new ResponseData().status(409).error(1).toMockData();
    }
    user.code2fa = postData.secret;
    console.log(user.id);
    if (!user) {
      return new ResponseData().status(403).error(-1).toMockData();
    }

    if (user.password !== postData.password) {
      return new ResponseData().status(422).error(1).toMockData();
    }

    var code = [];
    for (var i = 0; i < BackupCodes.length; i++) {
      if (BackupCodes[i].userid === user.id) {
        if (BackupCodes[i].code !== null) {
          code.push(BackupCodes[i].code);
        }
      }
    }
    console.log(code);
    return new ResponseData().status(200).error(0).toMockData({ code });
  });

mock.onDelete('/users/me/settings/2fa')
  .reply(async function(config) {
    const postData = JSON.parse(config.data);

    if (!containAllKeys(postData, ['password', 'code'])) {
      return new ResponseData().status(422).error(1).toMockData();
    }

    if (!config.headers.Authorization) {
      return new ResponseData().status(403).error(-1).toMockData();
    }

    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const userApi = config.headers.Authorization.split(' ');

    const authUser = JSON.parse(CryptoJs.enc.Base64.parse(userApi[1].split('.')[1]).toString(CryptoJs.enc.Utf8));

    const user = Users.find(u => u.id === authUser.jwtid);

    if (!user) {
      return new ResponseData().status(403).error(-1).toMockData();
    }

    if (!user.code2fa) {
      return new ResponseData().status(409).error(1).toMockData();
    }

    const token = twoFactor.verifyToken(user.code2fa, postData.code);

    if (token.delta !== 0) {
      return new ResponseData().status(422).error(1).addMoreData({ errors: { code: ['incorrect'] }}).toMockData();
    }

    if (user.password !== postData.password) {
      return new ResponseData().status(422).error(1).addMoreData({ errors: { password: ['incorrect'] }}).toMockData();
    }

    return new ResponseData().status(200).error(0).toMockData();
  });
