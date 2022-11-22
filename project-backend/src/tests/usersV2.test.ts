import {
  requestRegisterV3,
  requestUsersAllV2,
  requestClearV1,
  requestAdminUserRemoveV1
} from './testRequestRoutes';

describe('/users/all/v2 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Bad Token Test', () => {
    expect(requestUsersAllV2('---')).toEqual(403);
  });

  test('Success Get 2 Users', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
    requestRegisterV3('test2@test.com', 'password', 'test2', 'user');

    expect(requestUsersAllV2(user1.token)).toEqual(
      {
        users: [
          {
            uId: expect.any(Number),
            email: 'test1@test.com',
            nameFirst: 'test1',
            nameLast: 'user',
            handleStr: 'test1user',
            profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
          },
          {
            uId: expect.any(Number),
            email: 'test2@test.com',
            nameFirst: 'test2',
            nameLast: 'user',
            handleStr: 'test2user',
            profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
          }
        ]
      }
    );
  });

  test('Success Get 3 Users', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
    requestRegisterV3('test2@test.com', 'password', 'test2', 'user');
    requestRegisterV3('test3@test.com', 'password', 'test3', 'user');
    expect(requestUsersAllV2(user1.token)).toEqual(
      {
        users: [
          {
            uId: expect.any(Number),
            email: 'test1@test.com',
            nameFirst: 'test1',
            nameLast: 'user',
            handleStr: 'test1user',
            profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
          },
          {
            uId: expect.any(Number),
            email: 'test2@test.com',
            nameFirst: 'test2',
            nameLast: 'user',
            handleStr: 'test2user',
            profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
          },
          {
            uId: expect.any(Number),
            email: 'test3@test.com',
            nameFirst: 'test3',
            nameLast: 'user',
            handleStr: 'test3user',
            profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
          }
        ]
      }
    );
  });

  test('one of the user is inactive', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
    const user2 = requestRegisterV3('test2@test.com', 'password', 'test2', 'user');
    requestRegisterV3('test3@test.com', 'password', 'test3', 'user');
    requestAdminUserRemoveV1(user1.token, user2.authUserId);
    expect(requestUsersAllV2(user1.token)).toStrictEqual(
      {
        users: [
          {
            uId: 1,
            email: 'test1@test.com',
            nameFirst: 'test1',
            nameLast: 'user',
            handleStr: 'test1user',
            profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
          },
          {
            uId: 3,
            email: 'test3@test.com',
            nameFirst: 'test3',
            nameLast: 'user',
            handleStr: 'test3user',
            profileImgUrl: 'http://localhost:8082/profilePhotos/default.jpg'
          }
        ]
      });
  });
});
