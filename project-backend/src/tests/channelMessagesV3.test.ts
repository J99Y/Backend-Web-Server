import {
  requestRegisterV3,
  requestChannelsCreateV3,
  requestChannelMessagesV3,
  requestChannelInviteV3,
  requestChannelAddOwnerV2,
  requestMessageSendV2,
  requestMessageEditV2,
  requestMessageRemoveV2,
  requestClearV1,
  requestDmCreateV2,
  requestMessagesDm,
  requestSendDm,
} from './testRequestRoutes';
import { getTime } from '../other';
import { Message } from '../dataStore';

// Helper functions

function checkMessageObject(message1 : Message, message2: Message) {
  expect(message1.timeSent).toBeGreaterThanOrEqual(message2.timeSent - 1);
  expect(message1.timeSent).toBeLessThanOrEqual(message2.timeSent + 3);
  expect(message1.messageId).toStrictEqual(message2.messageId);
  expect(message1.message).toStrictEqual(message2.message);
  expect(message1.uId).toStrictEqual(message2.uId);
}

// Tests

describe('channelMessagesV2 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Successful return of channel messages and correct start/end', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(authUser.token, 'channel1', true);

    const messageArray = [];
    const timeArray = [];
    const result1 = [];
    const result2 = [];
    for (let i = 59; i >= 0; i--) {
      messageArray.unshift(requestMessageSendV2(authUser.token, channel.channelId, `Should appear in position #${59 - i}`));
      timeArray.unshift(getTime());
      // Creates an array which creates 50 messages from index 0-49 (end should be 50)
      if (i < 50) {
        result1.unshift({
          messageId: messageArray[0].messageId,
          uId: authUser.authUserId,
          message: `Should appear in position #${59 - i}`,
          timeSent: timeArray[0],
          reacts: [{
            reactId: 1,
            uIds: [],
            isThisUserReacted: false
          }],
          isPinned: false,
        });
      }
      // Creates an array which creates 45 messages from index 15-59 (end should be -1)
      if (i >= 15 && i < 60) {
        result2.unshift({
          messageId: messageArray[0].messageId,
          uId: authUser.authUserId,
          message: `Should appear in position #${59 - i}`,
          timeSent: timeArray[0],
          reacts: [{
            reactId: 1,
            uIds: [],
            isThisUserReacted: false
          }],
          isPinned: false,
        });
      }
    }

    const input1 = requestChannelMessagesV3(authUser.token, channel.channelId, 0);
    for (let i = 0; i < input1.messages.length; i++) {
      checkMessageObject(input1.messages[i], result1[i]);
    }
    expect(input1.start).toStrictEqual(0);
    expect(input1.end).toStrictEqual(50);

    const input2 = requestChannelMessagesV3(authUser.token, channel.channelId, 15);
    for (let i = 0; i < input2.messages.length; i++) {
      checkMessageObject(input2.messages[i], result2[i]);
    }
    expect(input2.start).toStrictEqual(15);
    expect(input2.end).toStrictEqual(-1);
  });

  test('Testing for empty channel messages', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const start = 0;

    const input = requestChannelMessagesV3(authUser.token, channel.channelId, start);
    expect(input).toStrictEqual({
      messages: [],
      start: 0,
      end: -1,
    });
  });

  test('Testing for invalid channelId', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const start = 0;

    const input = requestChannelMessagesV3(authUser.token, channel.channelId + 1, start);
    expect(input).toStrictEqual(400);
  });

  test('Testing for invalid start value', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const start = 1;

    const input = requestChannelMessagesV3(authUser.token, channel.channelId, start);
    expect(input).toStrictEqual(400);
  });

  test('Testing for valid channelId but authUser is not member of channel', () => {
    const authUser1 = requestRegisterV3('test.email1@gmail.com', 'password', 'John', 'Doe');
    const authUser2 = requestRegisterV3('test.email2@gmail.com', 'password', 'Jane', 'Kelly');
    const channel = requestChannelsCreateV3(authUser1.token, 'channel1', true);
    const start = 0;

    const input = requestChannelMessagesV3(authUser2.token, channel.channelId, start);
    expect(input).toStrictEqual(403);
  });

  test('Testing invalid token', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const start = 0;

    const input = requestChannelMessagesV3('randomToken', channel.channelId, start);
    expect(input).toStrictEqual(403);
  });
});

describe('messageSendV1 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Testing for invalid channeId', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel1 = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const mesId1 = requestMessageSendV2(authUser.token, channel1.channelId + 1, 'Message Test');
    expect(mesId1).toStrictEqual(400);
  });

  test('Testing for message length < 1 or > 1000 characters', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel1 = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const message = 't';
    const mesId1 = requestMessageSendV2(authUser.token, channel1.channelId, message.repeat(1001));
    expect(mesId1).toStrictEqual(400);

    const mesId2 = requestMessageSendV2(authUser.token, channel1.channelId, '');
    expect(mesId2).toStrictEqual(400);
  });

  test('Testing for valid channelId but authUser is not member of channel', () => {
    const user1 = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const user2 = requestRegisterV3('test.email1@gmail.com', 'password', 'Jane', 'Doe');
    const channel1 = requestChannelsCreateV3(user1.token, 'channel1', true);
    const mesId1 = requestMessageSendV2(user2.token, channel1.channelId, 'Message Test');
    expect(mesId1).toStrictEqual(403);
  });

  test('Testing for invalid token', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel1 = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const mesId1 = requestMessageSendV2('RandomToken', channel1.channelId, 'Message Test');
    expect(mesId1).toStrictEqual(403);
  });
});

describe('messageEditV1 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  test('Testing successful message edits (channel/dm)', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const dm = requestDmCreateV2(authUser.token, []);

    const mesId1 = requestMessageSendV2(authUser.token, channel.channelId, 'Message Test');
    const result1: Message = {
      messageId: mesId1.messageId,
      uId: authUser.authUserId,
      message: 'Edited message test',
      timeSent: getTime(),
      reacts: [{
        reactId: 1,
        uIds: [],
      }],
      isPinned: false,
    };
    const mesId2 = requestSendDm(authUser.token, dm.dmId, 'Message Test');
    const result2: Message = {
      messageId: mesId2.messageId,
      uId: authUser.authUserId,
      message: 'Edited message test',
      timeSent: getTime(),
      reacts: [{
        reactId: 1,
        uIds: [],
      }],
      isPinned: false,
    };

    expect(requestMessageEditV2(authUser.token, mesId1.messageId, 'Edited message test')).toStrictEqual({});
    const input1 = requestChannelMessagesV3(authUser.token, channel.channelId, 0);
    checkMessageObject(input1.messages[0], result1);

    expect(requestMessageEditV2(authUser.token, mesId1.messageId, '')).toStrictEqual({});
    const input2 = requestChannelMessagesV3(authUser.token, channel.channelId, 0);
    expect(input2).toStrictEqual({
      messages: [],
      start: 0,
      end: -1,
    });

    expect(requestMessageEditV2(authUser.token, mesId2.messageId, 'Edited message test')).toStrictEqual({});
    const input3 = requestMessagesDm(authUser.token, dm.dmId, 0);
    checkMessageObject(input3.messages[0], result2);

    expect(requestMessageEditV2(authUser.token, mesId2.messageId, '')).toStrictEqual({});
    const input4 = requestMessagesDm(authUser.token, dm.dmId, 0);
    expect(input4).toStrictEqual({
      messages: [],
      start: 0,
      end: -1,
    });
  });

  test('Testing for message length > 1000 characters', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const message = 't';
    const mesId1 = requestMessageSendV2(authUser.token, channel.channelId, 'Message Test');
    const result = requestMessageEditV2(authUser.token, mesId1.messageId, message.repeat(1001));
    expect(result).toStrictEqual(400);
  });

  test('Testing for invalid messageID within any channels authUser is in', () => {
    const user1 = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const user2 = requestRegisterV3('test.email1@gmail.com', 'password', 'John', 'Doe');
    const channel1 = requestChannelsCreateV3(user1.token, 'channel1', true);
    const channel2 = requestChannelsCreateV3(user2.token, 'channel2', true);
    const mesId1 = requestMessageSendV2(user1.token, channel1.channelId, 'Message Test');
    requestMessageSendV2(user2.token, channel2.channelId, 'Message Test');

    const result1 = requestMessageEditV2(user2.token, mesId1.messageId, 'Edited message');
    expect(result1).toStrictEqual(400);
    const result2 = requestMessageEditV2(user1.token, mesId1.messageId + 2, 'Edited message');
    expect(result2).toStrictEqual(400);
    const result3 = requestMessageEditV2(user1.token, mesId1.messageId + 512, 'Edited message');
    expect(result3).toStrictEqual(400);
  });

  test('Testing for invalid messageID within any dms authUser is in', () => {
    const user1 = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const user2 = requestRegisterV3('test.email1@gmail.com', 'password', 'John', 'Doe');
    const dm1 = requestDmCreateV2(user1.token, []);
    const dm2 = requestDmCreateV2(user2.token, []);
    const mesId1 = requestSendDm(user1.token, dm1.dmId, 'Message Test');
    requestMessageSendV2(user2.token, dm2.dmId, 'Message Test');

    const result1 = requestMessageEditV2(user2.token, mesId1.messageId, 'Edited message');
    expect(result1).toStrictEqual(400);
    const result2 = requestMessageEditV2(user1.token, mesId1.messageId + 2, 'Edited message');
    expect(result2).toStrictEqual(400);
    const result3 = requestMessageEditV2(user1.token, mesId1.messageId + 512, 'Edited message');
    expect(result3).toStrictEqual(400);
  });

  test('Testing for message edit request from user who did not make message nor has owner permission in channel', () => {
    const globalUser = requestRegisterV3('test1.email@gmail.com', 'password', 'John', 'Doe');
    const user1 = requestRegisterV3('test2.email@gmail.com', 'password', 'Jane', 'Doe');
    const user2 = requestRegisterV3('test3.email@gmail.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);
    requestChannelInviteV3(user1.token, channel.channelId, user2.authUserId);
    requestChannelInviteV3(user1.token, channel.channelId, globalUser.authUserId);
    const mesId1 = requestMessageSendV2(user1.token, channel.channelId, 'Message Test');

    const result1: Message = {
      messageId: mesId1.messageId,
      uId: user1.authUserId,
      message: 'Edited message',
      timeSent: getTime(),
      reacts: [{
        reactId: 1,
        uIds: [],
      }],
      isPinned: false,
    };
    const result2: Message = {
      messageId: mesId1.messageId,
      uId: user1.authUserId,
      message: 'Edited message again',
      timeSent: getTime(),
      reacts: [{
        reactId: 1,
        uIds: [],
      }],
      isPinned: false,
    };

    const input1 = requestMessageEditV2(user2.token, mesId1.messageId, 'Edited message');

    expect(input1).toStrictEqual(403);

    requestMessageEditV2(globalUser.token, mesId1.messageId, 'Edited message');
    const input2 = requestChannelMessagesV3(user1.token, channel.channelId, 0);
    checkMessageObject(input2.messages[0], result1);

    requestChannelAddOwnerV2(user1.token, channel.channelId, user2.authUserId);
    requestMessageEditV2(user2.token, mesId1.messageId, 'Edited message again');
    const input3 = requestChannelMessagesV3(user1.token, channel.channelId, 0);
    checkMessageObject(input3.messages[0], result2);
  });

  test('Testing for message edit request from user who did not make message nor has owner permission in dm', () => {
    const globalUser = requestRegisterV3('test1.email@gmail.com', 'password', 'John', 'Doe');
    const user1 = requestRegisterV3('test2.email@gmail.com', 'password', 'Jane', 'Doe');
    const user2 = requestRegisterV3('test3.email@gmail.com', 'password', 'John', 'Doe');

    const dm = requestDmCreateV2(user1.token, [user2.authUserId, globalUser.authUserId]);
    const mesId1 = requestSendDm(user2.token, dm.dmId, 'Message Test');
    const result1: Message = {
      messageId: mesId1.messageId,
      uId: user2.authUserId,
      message: 'Edited message',
      timeSent: getTime(),
      reacts: [{
        reactId: 1,
        uIds: [],
        isThisUserReacted: false
      }],
      isPinned: false,
    };
    const input1 = requestMessageEditV2(globalUser.token, mesId1.messageId, 'Edited message');
    expect(input1).toStrictEqual(403);

    requestMessageEditV2(user1.token, mesId1.messageId, 'Edited message');
    const input2 = requestMessagesDm(user1.token, dm.dmId, 0);
    checkMessageObject(input2.messages[0], result1);
  });

  test('Testing for invalid token', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const mesId1 = requestMessageSendV2(authUser.token, channel.channelId, 'Message Test');

    const result = requestMessageEditV2('randomToken', mesId1.messageId, 'Edited message');
    expect(result).toStrictEqual(403);
  });
});

describe('messageRemoveV1 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Test successful removal of message', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const mesId1 = requestMessageSendV2(authUser.token, channel.channelId, 'Message Test');
    expect(requestMessageRemoveV2(authUser.token, mesId1.messageId)).toStrictEqual({});

    const result = requestChannelMessagesV3(authUser.token, channel.channelId, 0);
    expect(result).toStrictEqual({
      messages: [],
      start: 0,
      end: -1,
    });
  });

  test('Testing for invalid messageID within any channels authUser is in', () => {
    // create user
    const user1 = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const user2 = requestRegisterV3('test.email2@gmail.com', 'password', 'Jane', 'Doe');
    const channel1 = requestChannelsCreateV3(user1.token, 'channel1', true);
    const channel2 = requestChannelsCreateV3(user2.token, 'channel2', true);
    const mesId1 = requestMessageSendV2(user1.token, channel1.channelId, 'Message Test');
    requestMessageSendV2(user2.token, channel2.channelId, 'Message Test');

    const result = requestMessageRemoveV2(user2.token, mesId1.messageId);
    expect(result).toStrictEqual(400);
  });

  test('Testing for invalid messageID within any dms authUser is in', () => {
    // create users
    const user1 = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const user2 = requestRegisterV3('test.email1@gmail.com', 'password', 'Jane', 'Doe');
    const channel1 = requestChannelsCreateV3(user1.token, 'channel1', true);
    const dm1 = requestDmCreateV2(user2.token, []);
    const mesId1 = requestMessageSendV2(user1.token, channel1.channelId, 'Message Test');
    requestSendDm(user2.token, dm1.dmId, 'Message Test');

    const result1 = requestMessageRemoveV2(user2.token, mesId1.messageId);
    expect(result1).toStrictEqual(400);
    const result2 = requestMessageRemoveV2(user1.token, mesId1.messageId - 1);
    expect(result2).toStrictEqual(400);
  });

  test('Testing for message remove request from user who did not make message nor has owner permission in channel/dm', () => {
    const globalUser = requestRegisterV3('test1.email@gmail.com', 'password', 'John', 'Doe');
    const user1 = requestRegisterV3('test2.email@gmail.com', 'password', 'Jane', 'Doe');
    const user2 = requestRegisterV3('test3.email@gmail.com', 'password', 'John', 'Doe');
    const channel = requestChannelsCreateV3(user1.token, 'channel1', true);
    requestChannelInviteV3(user1.token, channel.channelId, user2.authUserId);
    requestChannelInviteV3(user1.token, channel.channelId, globalUser.authUserId);
    const mesId1 = requestMessageSendV2(user1.token, channel.channelId, 'Message Test1');
    const mesId2 = requestMessageSendV2(user1.token, channel.channelId, 'Message Test2');
    const input1 = requestMessageRemoveV2(user2.token, mesId1.messageId);
    expect(input1).toStrictEqual(403);

    requestMessageRemoveV2(globalUser.token, mesId1.messageId);
    const result1 = requestChannelMessagesV3(user1.token, channel.channelId, 0);
    expect(result1).toStrictEqual({
      messages: [{
        message: 'Message Test2',
        messageId: mesId2.messageId,
        timeSent: expect.any(Number),
        uId: user1.authUserId,
        reacts: [{
          reactId: 1,
          uIds: [],
          isThisUserReacted: false,
        }],
        isPinned: false,
      }],
      start: 0,
      end: -1,
    });

    requestChannelAddOwnerV2(user1.token, channel.channelId, user2.authUserId);
    requestMessageRemoveV2(user2.token, mesId2.messageId);
    const result2 = requestChannelMessagesV3(user1.token, channel.channelId, 0);
    expect(result2).toStrictEqual({
      messages: [],
      start: 0,
      end: -1,
    });
  });

  test('Testing for invalid token', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const dm = requestDmCreateV2(authUser.token, []);
    const mesId1 = requestSendDm(authUser.token, dm.dmId, 'Message Test');

    const result = requestMessageRemoveV2('randomToken', mesId1.messageId);
    expect(result).toStrictEqual(403);
  });
});
