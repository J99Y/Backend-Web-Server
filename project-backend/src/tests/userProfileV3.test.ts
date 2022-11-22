import {
  requestRegisterV3,
  requestUserProfileV3,
  requestLoginV3,
  requestClearV1
} from './testRequestRoutes';

describe('UserProfileV3 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Successful reading of a user profile', () => {
    const user1 = requestRegisterV3('test1.email@gmail.com', 'password', 'John', 'Doe');
    const user2 = requestRegisterV3('test2.email@gmail.com', 'password', 'Jane', 'Doe');
    expect(user1.authUserId === user2.authUserId).toStrictEqual(false);
    expect(user1.token === user2.token).toStrictEqual(false);

    const result = {
      user: {
        uId: user1.authUserId,
        email: 'test1.email@gmail.com',
        nameFirst: 'John',
        nameLast: 'Doe',
        handleStr: 'johndoe',
        profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
      }
    };
    expect(requestUserProfileV3(user1.token, user1.authUserId)).toEqual(result);
  });

  test('Successful reading of multiple user profiles', () => {
    const user1 = requestRegisterV3('test1.email@gmail.com', 'password', 'John', 'Doe');
    const user2 = requestRegisterV3('test2.email@gmail.com', 'password', 'Jane', 'Doe');
    const user3 = requestRegisterV3('test3.email@gmail.com', 'password', 'Don', 'Joe');
    const user4 = requestRegisterV3('test4.email@gmail.com', 'password', 'Don', 'Joe');
    const authUser = requestLoginV3('test2.email@gmail.com', 'password');

    const result1 = {
      user: {
        uId: user1.authUserId,
        email: 'test1.email@gmail.com',
        nameFirst: 'John',
        nameLast: 'Doe',
        handleStr: 'johndoe',
        profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
      }
    };
    const result2 = {
      user: {
        uId: user2.authUserId,
        email: 'test2.email@gmail.com',
        nameFirst: 'Jane',
        nameLast: 'Doe',
        handleStr: 'janedoe',
        profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
      }
    };
    const result3 = {
      user: {
        uId: user3.authUserId,
        email: 'test3.email@gmail.com',
        nameFirst: 'Don',
        nameLast: 'Joe',
        handleStr: 'donjoe',
        profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
      }
    };
    const result4 = {
      user: {
        uId: user4.authUserId,
        email: 'test4.email@gmail.com',
        nameFirst: 'Don',
        nameLast: 'Joe',
        handleStr: 'donjoe0',
        profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
      }
    };

    expect(requestUserProfileV3(authUser.token, user1.authUserId)).toEqual(result1);
    expect(requestUserProfileV3(authUser.token, user2.authUserId)).toEqual(result2);
    expect(requestUserProfileV3(authUser.token, user3.authUserId)).toEqual(result3);
    expect(requestUserProfileV3(authUser.token, user4.authUserId)).toEqual(result4);
  });

  test('Testing for no userId exists', () => {
    requestRegisterV3('test1.email@gmail.com', 'password', 'John', 'Doe');
    const authUser = requestLoginV3('test1.email@gmail.com', 'password');

    expect(requestUserProfileV3(authUser.token, authUser.authuserId + 1)).toStrictEqual(400);
  });

  test('Testing for invalid token', () => {
    expect(requestUserProfileV3('notAToken123', 1)).toStrictEqual(403);
  });
});
