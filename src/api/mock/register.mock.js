import mock from './mock';
import Users from './data/user.data';
import ResponseData from './response';
import { containAllKeys } from '../../helpers/object';

mock.onPost('/auth/register')
  .reply(async function(config) {
    const postData = JSON.parse(config.data);
    console.log(postData);

    if (!containAllKeys(postData, ['username', 'password', 'email'])) {
      return new ResponseData().status(422).error(1).toMockData();
    }

    const user = Users.find(u => u.username === postData.username || u.email === postData.email);

    if (user) {
      if (user.username === postData.username) {
        return new ResponseData().status(422).error(1).addMoreData({ errors: { username: ['unique'] }}).toMockData();
      }
      return new ResponseData().status(422).error(1).addMoreData({ errors: { email: ['unique'] }}).toMockData();
    }

    const newUser = {
      id: Users.length + 1,
      username: postData.username,
      password: postData.password,
      name: null,
      email: postData.email,
      f2a_code: null
    };
    Users.push(newUser);
    console.log(Users);

    return new ResponseData().status(200).error(0).toMockData();
  }
  );
