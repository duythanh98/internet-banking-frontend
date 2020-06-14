import mock from './mock';
import Users from './data/user.data';
import Friends from './data/friends.data';
import ResetCodes from './data/reset-code.data';
import UserGames from './data/users-games.data';
import Games from './data/games.data';
import ResponseData from './response';
import * as jsonwebtoken from 'jsonwebtoken';
import { containAllKeys } from '../../helpers/object';
import { isExpiredToken } from '../../helpers/token';
import { isExpiredDate } from '../../helpers/date';
import BackupCodes from './data/backup.code.data';
import CryptoJs from 'crypto-js';
const jwtKey = 'password_!234456789000000';

function makeToken(id, isAccessToken, expiresIn = '10days') {
  return jsonwebtoken.sign(
    { jwtid: id, accesstoken: isAccessToken },
    jwtKey,
    { expiresIn: expiresIn }
  );
}

mock.onPost('/auth/login')
  .reply(async function(config) {
    const postData = JSON.parse(config.data);

    if (!containAllKeys(postData, ['username', 'password'])) {
      return new ResponseData().status(422).error(1).toMockData();
    }

    const user = Users.find(u => u.username === postData.username && postData.password === u.password);

    if (!user) {
      return new ResponseData().status(422).error().toMockData();
    }

    var code = [];
    for (var i = 0; i < BackupCodes.length; i++) {
      if (BackupCodes[i].userid === user.id) {
        code.push(BackupCodes[i].code);
      }
    }

    if (user.f2a_code) {
      if (!postData.f2a_code) {
        return new ResponseData().status(428).error(1).toMockData();
      }

      if (user.f2a_code !== postData.f2a_code) {
        const flag = code.find(u => u === postData.f2a_code);
        if (flag === false) {
          return new ResponseData().status(412).error(1).toMockData();
        } else {
          BackupCodes[BackupCodes.findIndex(u => u.userid === user.id)].code = null;
        }
      }
    }

    const access_token = makeToken(user.id, true);

    const refresh_token = makeToken(user.id, false);

    return new ResponseData().status(200).error(0).toMockData(
      { access_token, refresh_token }
    );
  }
  );

mock.onPost('/auth/refresh')
  .reply(async function(config) {
    const postData = JSON.parse(config.data);

    if (!containAllKeys(postData, ['refresh_token'])) {
      return new ResponseData().status(422).error(1).toMockData();
    }

    const user = Users.find(u => u.refresh_token === postData.refresh_token);

    if (!user) {
      return new ResponseData().status(422).error().toMockData();
    }

    if (isExpiredToken(postData.refresh_token)) {
      return new ResponseData().status(410).error(1).toMockData();
    }

    const access_token = makeToken(user.id, true, '5seconds');

    const refresh_token = makeToken(user.id, false, '1days');

    return new ResponseData().status(200).error(0).toMockData(
      { access_token, refresh_token }
    );
  }
  );

mock.onPost('/auth/reset')
  .reply(async function(config) {
    const postData = JSON.parse(config.data);

    if (!containAllKeys(postData, ['code', 'password', 'email'])) {
      return new ResponseData().status(422).error(1).toMockData();
    }

    const resetcode = ResetCodes.find(r => r.email === postData.email);

    if (!resetcode) {
      return new ResponseData().status(422).error(1).toMockData();
    }
    const user = Users.find(u => u.email === resetcode.email);

    if (!user) {
      return new ResponseData().status(422).error(1).toMockData();
    }

    const i = ResetCodes.findIndex(u => u.email === user.email);
    if (ResetCodes[i].code !== postData.code) {
      return new ResponseData().status(404).error(1).toMockData();
    }

    if (isExpiredDate(ResetCodes[i].expires)) {
      return new ResponseData().status(410).error(1).toMockData();
    }
    const index = Users.findIndex(u => u.email === resetcode.email);

    Users[index].password = postData.password;
    return new ResponseData().status(200).error(0).toMockData();
  }
  );

mock.onGet('/users/me')
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

    if (!user) {
      return new ResponseData().status(204).error(1).toMockData();
    }

    return new ResponseData().status(200).error(0).toMockData(
      user
    );
  });

mock.onGet(/\/users\/\d+/)
  .reply(async function(config) {
    if (!config.headers.Authorization) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const id = parseInt(config.url.split('/')[2]);
    const user = Users.find(u => u.id === id);
    if (!user) {
      return new ResponseData().status(204).error(0).toMockData();
    }

    return new ResponseData().status(200).error(0).toMockData(
      user
    );
  });
mock.onGet(/\/users\/\d+\/friends\?.*/)
  .reply(async function(config) {
    console.log('getFriends');
    if (!config.headers.Authorization) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const params = config.url.split('?')[1].split('&');
    const limit = parseInt(params[0].split('=')[1]);
    const page = parseInt(params[1].split('=')[1]);

    const id = parseInt(config.url.split('/')[2]);

    let result = Friends.filter(u => u.id === id || u.relate_id === id);
    console.log(result);
    result = result.slice((page - 1) * limit, page * limit);
    console.log(result);
    const data = result.map(u => Users.find(i => (u.relate_id != id && u.relate_id === i.id) || (u.id != id && u.id === i.id)));
    return new ResponseData().status(200).error(0).toMockData(
      data
    );
  });

mock.onGet(/\/users\/me\/friends\?.*/)
  .reply(async function(config) {
    console.log('me get Friends');
    if (!config.headers.Authorization) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const params = config.url.split('?')[1].split('&');
    const limit = parseInt(params[0].split('=')[1]);
    const page = parseInt(params[1].split('=')[1]);

    const userApi = config.headers.Authorization.split(' ');

    const authUser = JSON.parse(CryptoJs.enc.Base64.parse(userApi[1].split('.')[1]).toString(CryptoJs.enc.Utf8));
    let result = Friends.filter(u => u.id === authUser.jwtid || u.relate_id === authUser.jwtid);
    console.log(result);
    result = result.slice((page - 1) * limit, page * limit - 1);
    console.log(result);
    const data = result.map(u => Users.find(i => (u.relate_id != authUser.jwtid && u.relate_id === i.id) || (u.id != authUser.jwtid && u.id === i.id)));
    return new ResponseData().status(200).error(0).toMockData(
      data
    );
  });

mock.onPost('/users/me/friends')
  .reply(async function(config) {
    if (!config.headers.Authorization) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const userApi = config.headers.Authorization.split(' ');

    const postData = JSON.parse(config.data);

    if (!containAllKeys(postData, ['id'])) {
      return new ResponseData().status(422).error(1).toMockData();
    }
    const authUser = JSON.parse(CryptoJs.enc.Base64.parse(userApi[1].split('.')[1]).toString(CryptoJs.enc.Utf8));

    const user = Users.find(u => u.id === postData.id);
    if (!user) {
      return new ResponseData().status(422).error(1).toMockData();
    }
    Friends.push({ 'id': authUser.jwtid, 'relate_id': user.id, 'status': 1 });
    return new ResponseData().status(200).error(0).toMockData();
  });

mock.onGet(/\/users\/\d+\/games\?.*/)
  .reply(async function(config) {
    console.log('getGame');
    if (!config.headers.Authorization) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const params = config.url.split('?')[1].split('&');
    const limit = parseInt(params[0].split('=')[1]);
    const page = parseInt(params[1].split('=')[1]);

    const id = parseInt(config.url.split('/')[2]);

    const games = UserGames.filter(u => u.id === id).map(u => Games.find(g => g.id === u.game_id));

    const result = games.slice((page - 1) * limit, page * limit);

    if (!result) {
      return new ResponseData().status(204).error(1).toMockData();
    }
    const json = {};
    json.data = result;
    return new ResponseData().status(200).error(0).toMockData(json);
  });

mock.onGet(/\/users\/me\/games\?.*/)
  .reply(async function(config) {
    if (!config.headers.Authorization) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const params = config.url.split('?')[1].split('&');
    const limit = parseInt(params[0].split('=')[1]);
    const page = parseInt(params[1].split('=')[1]);
    console.log(limit + ' & ' + page);
    const userApi = config.headers.Authorization.split(' ');

    const authUser = JSON.parse(CryptoJs.enc.Base64.parse(userApi[1].split('.')[1]).toString(CryptoJs.enc.Utf8));

    const games = UserGames.filter(u => u.id === authUser.jwtid).map(u => Games.find(g => g.id === u.game_id));
    console.log(games);
    const result = games.slice((page - 1) * limit, page * limit);
    console.log(result);
    if (!result) {
      return new ResponseData().status(204).error(1).toMockData();
    }

    return new ResponseData().status(200).error(0).toMockData(result);
  });

mock.onGet(/\/users\/me\/relationship\?.*/)
  .reply(async function(config) {
    if (!config.headers.Authorization) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const params = config.url.split('?')[1].split('&');
    const id = parseInt(params[0].split('=')[1]);

    const userApi = config.headers.Authorization.split(' ');

    const authUser = JSON.parse(CryptoJs.enc.Base64.parse(userApi[1].split('.')[1]).toString(CryptoJs.enc.Utf8));
    const result = Friends.find(u => u.id === authUser.jwtid && u.relate_id === id || u.relate_id === authUser.jwtid && u.id === id);

    if (!result) {
      return new ResponseData().status(204).error(1).toMockData();
    }

    return new ResponseData().status(200).error(0).toMockData(
      result
    );
  });
