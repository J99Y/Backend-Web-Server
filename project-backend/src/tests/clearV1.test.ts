import {
  requestRegisterV3,
  requestLoginV3,
  requestClearV1,
  requestChannelDetailsV3,
  requestChannelsCreateV3
} from './testRequestRoutes';

describe('Testing route /clear/v1', () => {
  test('Test successful clearing of database', () => {
    const user = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(user.token, 'testChannel', false);

    const result1 = requestLoginV3('test.email@gmail.com', 'password');
    expect(result1.authUserId).toEqual(user.authUserId);

    expect(requestClearV1()).toStrictEqual({});

    const result2 = requestLoginV3('test.email@gmail.com', 'password');
    expect(result2).toStrictEqual(400);

    const result3 = requestChannelDetailsV3(user.token, channel.channelId);
    expect(result3).toStrictEqual(403);
  });
});
