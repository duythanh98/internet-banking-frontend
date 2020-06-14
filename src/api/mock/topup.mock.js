import mock from './mock';
import Topups from './data/topup.data';
import ResponseData from './response';
import CryptoJs from 'crypto-js';

mock.onGet('/payments')
  .reply(async function(config) {
    if (!config.headers.Authorization) {
      return new ResponseData().status(403).error(-1).toMockData();
    }

    if (config.headers.Authorization.indexOf('Bearer') != 0) {
      return new ResponseData().status(403).error(-1).toMockData();
    }
    const userApi = config.headers.Authorization.split(' ');

    const authUser = JSON.parse(CryptoJs.enc.Base64.parse(userApi[1].split('.')[1]).toString(CryptoJs.enc.Utf8));

    const topup = Topups.filter(u => u.fromId === authUser.jwtid);

    console.log(topup);

    if (!topup) {
      return new ResponseData().status(404).error(1).toMockData();
    }

    // var listtopup = topup.reduce((acc, topupId) => {
    //   const top = Topups.find(u => u.fromId === topupId);
    //   if (top) {
    //     const { id, type, money, createdAt, status } = top;
    //     acc.push({ id: id, type: type, money: money, createdAt: createdAt, status: status });
    //   }
    //   return acc;
    // }, []);

    topup.limit = topup.length;
    topup.page = 1;
    topup.total = topup.length;
    topup.lastPage = Math.ceil(topup.total / topup.limit);

    return new ResponseData().status(200).error(0).toMockData(topup);
  });
