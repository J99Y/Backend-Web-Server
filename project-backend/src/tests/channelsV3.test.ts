import {
  requestRegisterV3,
  requestChannelsCreateV3,
  requestChannelsListV3,
  requestChannelsListAllV3,
  requestLoginV3,
  requestClearV1,
  requestAdminUserRemoveV1
} from './testRequestRoutes';

/// /////////////////////////////////////////////////////////////////
/// TESTING

describe('channels/create/V2 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Success create channels', () => {
    requestRegisterV3('test12@test.com', 'password', 'Test', 'User');
    const token = requestLoginV3('test12@test.com', 'password');
    const result = requestChannelsCreateV3(token.token, 'we passing', true);
    expect(result).toStrictEqual({ channelId: expect.any(Number) });
  });
  test('name is an empty string', () => {
    const register = requestRegisterV3('test@test.com', 'password', 'Test', 'User');
    const isPublic = true;
    const result = requestChannelsCreateV3(register.token, '', isPublic);
    expect(result).toEqual(400);
  });
  test('name is has more than 20 character', () => {
    const register = requestRegisterV3('test@test.com', 'password', 'Test', 'User');
    const isPublic = true;
    const result = requestChannelsCreateV3(register.token, 'namenamenamenamenamename', isPublic);
    expect(result).toEqual(400);
  });
  test('token is invalid', () => {
    const isPublic = true;
    const result = requestChannelsCreateV3('abcdefg', 'name', isPublic);
    expect(result).toEqual(403);
  });
  test('User is inactive', () => {
    //  user 1 is the global owner
    const user1 = requestRegisterV3('test1@test.com', 'password', 'test1', 'user');
    const user2 = requestRegisterV3('test2@test.com', 'password', 'test2', 'user');
    // user2 is inactive
    expect(requestAdminUserRemoveV1(user1.token, user2.authUserId)).toEqual({});
    expect(requestChannelsCreateV3(user2.token, 'name', true)).toEqual(403);
  });
});

describe('channels/list/V2', () => {
  beforeEach(() => {
    requestClearV1();
  });

  test('Token is not valid', () => {
    expect(requestChannelsListV3('abc')).toEqual(403);
  });

  test('AuthUserId does not own any channel ', () => {
    requestRegisterV3('test1@test.com', 'password', 'Testing', 'Usering');
    const token = requestLoginV3('test1@test.com', 'password');
    const result = requestChannelsListV3(token.token);
    expect(result).toStrictEqual({
      channels: [],
    });
  });
  test('AuthUserId belong to any channel', () => {
    requestRegisterV3('test2@test.com', 'password', 'Testing2', 'Usering2');
    const user3 = requestRegisterV3('test3@test.com', 'password', 'Testing3', 'Usering3');
    const user2 = requestRegisterV3('test1@test.com', 'password', 'Testing', 'Usering');
    const token = requestLoginV3('test2@test.com', 'password');
    requestChannelsCreateV3(user2.token, 'name', true);
    requestChannelsCreateV3(user3.token, 'name', true);
    const result = requestChannelsListV3(token.token);
    expect(result).toStrictEqual({
      channels: [],
    });
  });
  test('Success list 1 channels the authorised part of', () => {
    const token = requestRegisterV3('test1@test.com', 'password', 'Test', 'User');
    requestChannelsCreateV3(token.token, 'we passing', true);
    const result = requestChannelsListV3(token.token);
    expect(result).toStrictEqual(
      {
        channels: [
          {
            channelId: expect.any(Number),
            name: 'we passing'
          }
        ]
      });
  });

  test('Authorised user own 2 channels with 1 other channels in dataStore(public)  ', () => {
    const token1 = requestRegisterV3('test1@test.com', 'password', 'Test', 'User');
    requestChannelsCreateV3(token1.token, 'first channel', true);
    requestChannelsCreateV3(token1.token, 'second channel', false);
    const result = requestChannelsListV3(token1.token);
    expect(result).toStrictEqual(
      {
        channels: [
          {
            channelId: expect.any(Number),
            name: 'first channel'
          },
          {
            channelId: expect.any(Number),
            name: 'second channel'
          }
        ],
      });
  });
});

describe('channels/listAll/v3 tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Invalid Token', () => {
    expect(requestChannelsListAllV3('Invalid Token')).toEqual(403);
  });

  test('Valid token - 1 channel', () => {
    const user = requestRegisterV3('thisIsAnEmail@gmail.com', 'B@dPassword', 'Robb', 'Stark');
    const channel = requestChannelsCreateV3(user.token, 'House Stark', true);
    expect(requestChannelsListAllV3(user.token)).toStrictEqual({ channels: [{ channelId: channel.channelId, name: 'House Stark' }] });
  });

  test('Valid token - 2 channel', () => {
    const user = requestRegisterV3('thisIsAnEmail@gmail.com', 'B@dPassword', 'Robb', 'Stark');
    const channel = requestChannelsCreateV3(user.token, 'House Stark', true);
    const user2 = requestRegisterV3('thisIsAnotherEmail@gmail.com', 'G00dPassword', 'Viserys', 'Targaryen');
    const channel2 = requestChannelsCreateV3(user2.token, 'House Targaryen', false);
    expect(requestChannelsListAllV3(user.token)).toStrictEqual({
      channels: [
        {
          channelId: channel.channelId,
          name: 'House Stark'
        },
        {
          channelId: channel2.channelId,
          name: 'House Targaryen'
        }
      ]
    });
  });
});
