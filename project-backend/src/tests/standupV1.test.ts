// Tests

import {
  requestChannelJoinV3,
  requestChannelsCreateV3,
  requestClearV1,
  requestRegisterV3,
  requestStandupStartV1,
  requestStandupActiveV1,
  requestStandupSendV1,
  requestChannelMessagesV3
} from './testRequestRoutes';
import { getTime } from '../other';

// Checks the result of a standup in a given channel agaisnt a given expected message
function checkStandupResult(token: string, channelId: number, expectedMessage: string, uId: number) {
  const result = requestChannelMessagesV3(token, channelId, 0);
  expect(result.messages[0].message).toStrictEqual(expectedMessage);
  expect(result.messages[0].uId).toStrictEqual(uId);
}

describe('standupStartV1 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Successful standup start/active/send', async () => {
    const pause = (ms: number) => new Promise(res => setTimeout(res, ms));

    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const user2 = requestRegisterV3('test2@test.com', 'password', 'Jane', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);
    requestChannelJoinV3(user2.token, channel.channelId);

    // 0 seconds
    const standupLength1 = 0;
    const timeFinish1 = requestStandupStartV1(user1.token, channel.channelId, standupLength1);
    // obtains the expected finishing time
    const expectedTimeFinish1 = getTime() + standupLength1;
    // check finishing time (with 1-2 second leeway for lag)
    expect(timeFinish1.timeFinish).toBeLessThanOrEqual(expectedTimeFinish1 + 2);
    expect(timeFinish1.timeFinish).toBeGreaterThanOrEqual(expectedTimeFinish1 - 1);

    expect(requestChannelMessagesV3(user1.token, channel.channelId, 0)).toStrictEqual({ messages: [], start: 0, end: -1 });

    // 2 seconds
    const standupLength2 = 2;
    const timeFinish2 = requestStandupStartV1(user1.token, channel.channelId, standupLength2);
    // obtains the expected finishing time
    const expectedTimeFinish2 = getTime() + standupLength2;
    // check finishing time (with 1-2 second leeway for lag)
    expect(timeFinish2.timeFinish).toBeLessThanOrEqual(expectedTimeFinish2 + 2);
    expect(timeFinish2.timeFinish).toBeGreaterThanOrEqual(expectedTimeFinish2 - 1);
    requestStandupSendV1(user1.token, channel.channelId, 'First Message');
    requestStandupSendV1(user2.token, channel.channelId, 'Second Message');
    requestStandupSendV1(user1.token, channel.channelId, 'Third Message');

    // Checking active status of standup
    expect(requestStandupActiveV1(user1.token, channel.channelId)).toStrictEqual({ isActive: true, timeFinish: timeFinish2.timeFinish });
    // Checking standup output message after finishing (delayed)
    const result = 'johndoe: First Message' + '\n' + 'janedoe: Second Message' + '\n' + 'johndoe: Third Message';

    await pause(standupLength2 * 1000);
    checkStandupResult(user1.token, channel.channelId, result, user1.authUserId);
  });

  test('Testing for invalid channelId', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);

    expect(requestStandupStartV1(user1.token, channel.channelId + 1, 1)).toStrictEqual(400);
  });

  test('Testing for invalid length', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);

    expect(requestStandupStartV1(user1.token, channel.channelId, -10)).toStrictEqual(400);
  });

  test('Testing for already active standup', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);

    requestStandupStartV1(user1.token, channel.channelId, 1);
    expect(requestStandupStartV1(user1.token, channel.channelId, 1)).toStrictEqual(400);
  });

  test('Testing for standup send request from user who is not member of channel', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const user2 = requestRegisterV3('test2@test.com', 'password', 'Jane', 'Doe');
    const channel = requestChannelsCreateV3(user2.token, 'channel1', true);
    expect(requestStandupStartV1(user1.token, channel.channelId, 1)).toStrictEqual(403);
  });

  test('Testing for invalid token', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);

    expect(requestStandupStartV1(user1.token + 1, channel.channelId, 0)).toStrictEqual(403);
  });

  test('Token not a member of channel', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const user2 = requestRegisterV3('trueheir@test.com', 'password', 'Maelys', 'Blackfyre');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);

    expect(requestStandupStartV1(user2.token, channel.channelId, 0)).toStrictEqual(403);
  });
});

describe('standupActiveV1 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Testing for no active standup', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);

    expect(requestStandupActiveV1(user1.token, channel.channelId)).toStrictEqual({ isActive: false, timeFinish: null });
  });

  test('Testing for invalid channelId', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);

    expect(requestStandupActiveV1(user1.token, channel.channelId + 1)).toStrictEqual(400);
  });

  test('Testing for standup active request from user who is not member of channel', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const user2 = requestRegisterV3('test2@test.com', 'password', 'Jane', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);

    expect(requestStandupActiveV1(user2.token, channel.channelId)).toStrictEqual(403);
  });

  test('Testing for invalid token', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);

    expect(requestStandupActiveV1(user1.token + 1, channel.channelId)).toStrictEqual(403);
  });
});

describe('standupSendV1 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Testing for invalid channelId', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);

    expect(requestStandupSendV1(user1.token, channel.channelId + 1, 'Invalid')).toStrictEqual(400);
  });

  test('Testing for invalid message length', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);
    const message = 't';
    expect(requestStandupSendV1(user1.token, channel.channelId, message.repeat(1001))).toStrictEqual(400);
  });

  test('Testing for no active standup', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);

    expect(requestStandupSendV1(user1.token, channel.channelId, 'Invalid')).toStrictEqual(400);
  });

  test('Testing for standup start request from user who is not member of channel', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const user2 = requestRegisterV3('test2@test.com', 'password', 'Jane', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);

    expect(requestStandupSendV1(user2.token, channel.channelId, 'Invalid')).toStrictEqual(403);
  });

  test('Testing for invalid token', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);

    expect(requestStandupSendV1(user1.token + 1, channel.channelId, 'Invalid')).toStrictEqual(403);
  });
});
