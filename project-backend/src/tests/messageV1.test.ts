import { getTime } from '../other';
import {
  requestRegisterV3,
  requestChannelsCreateV3,
  requestMessageUnreactV1,
  requestDmCreateV2,
  requestClearV1,
  requestMessageSendLaterV1,
  requestChannelMessagesV3,
  requestMessageEditV2,
  requestSendLaterDm,
  requestMessagePinV1,
  requestMessageUnpinV1,
  requestChannelAddOwnerV2,
  requestChannelJoinV3,
  requestUserProfileV3,
  requestMessagesDm,
  requestSendDm,
  requestMessageSendV2,
  requestMessageReactV1,
  requestChannelInviteV3,
  requestMessageShareV1,
  requestMessageRemoveV2
} from './testRequestRoutes';

function pause(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

describe('message/share/v1', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });
  test('Invalid Token', () => {
    const invalidToken = '-1';
    const token = requestRegisterV3('user1@test.com', 'password', 'Test1', 'User1');
    const token2 = requestRegisterV3('user2@test.com', 'password', 'Test2', 'User2');
    const channel1 = requestChannelsCreateV3(token.token, 'channel1', true);
    const channel2 = requestChannelsCreateV3(token.token, 'channel2', true);
    const message1 = requestMessageSendV2(token.token, channel1.channelId, 'This is good');
    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    // Attempt to share to a channel
    expect(requestMessageShareV1(invalidToken, message1.messageId, 'OptionalString', channel2.channelId, -1)).toEqual(403);
    // Attempt to share to a dm
    expect(requestMessageShareV1(invalidToken, message1.messageId, 'OptionalString', -1, dm1.dmId)).toEqual(403);
  });
  test('Invalid channelId and invalid dmId', () => {
    const invalidId = -5;
    const token = requestRegisterV3('user1@test.com', 'password', 'Test1', 'User1');
    const token2 = requestRegisterV3('user2@test.com', 'password', 'Test2', 'User2');
    const token3 = requestRegisterV3('user3@test.com', 'password', 'Test3', 'User3');
    const channel1 = requestChannelsCreateV3(token.token, 'channel1', true);
    const channel2 = requestChannelsCreateV3(token2.token, 'channel2', true);
    const message1 = requestMessageSendV2(token.token, channel1.channelId, 'This is good');
    const dm1 = requestDmCreateV2(token2.token, [token3.authUserId]);

    expect(requestMessageShareV1(token.token, message1.messageId, 'OptionalString', invalidId, invalidId)).toEqual(400);
    expect(requestMessageShareV1(token.token, message1.messageId, 'OptionalString', invalidId, -1)).toEqual(400);
    expect(requestMessageShareV1(token.token, message1.messageId, 'OptionalString', -1, invalidId)).toEqual(400);
    // Both Ids are -1
    expect(requestMessageShareV1(token.token, message1.messageId, 'OptionalString', -1, -1)).toEqual(400);
    // Invalid dmId, and authUser not in channel
    expect(requestMessageShareV1(token.token, message1.messageId, 'OptionalString', channel2.channelId, invalidId)).toEqual(400);
    // Invalid channelId, and authUser not in Dm
    expect(requestMessageShareV1(token.token, message1.messageId, 'OptionalString', invalidId, dm1.dmId)).toEqual(400);
  });
  test('Neither channelId nor dmId are equal to -1', () => {
    const token = requestRegisterV3('user1@test.com', 'password', 'Test1', 'User1');
    const token2 = requestRegisterV3('user2@test.com', 'password', 'Test2', 'User2');
    const channel1 = requestChannelsCreateV3(token.token, 'channel1', true);
    const channel2 = requestChannelsCreateV3(token.token, 'channel2', true);
    const message1 = requestMessageSendV2(token.token, channel1.channelId, 'This is good');
    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);

    // Attempt to share to a channel and dm
    expect(requestMessageShareV1(token.token, message1.messageId, 'OptionalString', channel2.channelId, dm1.dmId)).toEqual(400);
  });
  test('Invalid ogMessageId', () => {
    const invalidMessageId = -1;
    const token = requestRegisterV3('user1@test.com', 'password', 'Test1', 'User1');
    const token2 = requestRegisterV3('user2@test.com', 'password', 'Test2', 'User2');
    const token3 = requestRegisterV3('user3@test.com', 'password', 'Test3', 'User3');
    const channel1 = requestChannelsCreateV3(token.token, 'channel1', true);
    const channel2 = requestChannelsCreateV3(token2.token, 'channel2', true);
    const message1 = requestMessageSendV2(token.token, channel1.channelId, 'This is good');
    const dm1 = requestDmCreateV2(token2.token, [token3.authUserId]);
    const dmMessage = requestSendDm(token2.token, dm1.dmId, 'Message');

    // User is not part of channel with the message they want to share
    expect(requestMessageShareV1(token2.token, message1.messageId, '', channel2.channelId, -1)).toEqual(400);
    // User is not part of dm with the message they want to share
    expect(requestMessageShareV1(token.token, dmMessage.messageId, '', channel1.channelId, -1)).toEqual(400);
    // invalid general messageId
    expect(requestMessageShareV1(token2.token, invalidMessageId, '', channel2.channelId, -1)).toEqual(400);
    expect(requestMessageShareV1(token2.token, invalidMessageId, '', -1, dm1.dmId)).toEqual(400);
  });
  test('Optional Message is more than 1000 characters', () => {
    const token = requestRegisterV3('user1@test.com', 'password', 'Test1', 'User1');
    const token2 = requestRegisterV3('user2@test.com', 'password', 'Test2', 'User2');
    const channel1 = requestChannelsCreateV3(token.token, 'channel1', true);
    const channel2 = requestChannelsCreateV3(token.token, 'channel2', true);
    const message1 = requestMessageSendV2(token.token, channel1.channelId, 'This is good');
    const dm1 = requestDmCreateV2(token.token, [token.authUserId, token2.authUserId]);

    // Attempt to share to a channel and dm
    const message = 't';
    expect(requestMessageShareV1(token.token, message1.messageId, message.repeat(1001), channel2.channelId, -1)).toEqual(400);
    expect(requestMessageShareV1(token.token, message1.messageId, message.repeat(1001), -1, dm1.dmId)).toEqual(400);
  });
  test("User has not joined the channel or DM they're trying to share the message to", () => {
    const token = requestRegisterV3('user1@test.com', 'password', 'Test1', 'User1');
    const token2 = requestRegisterV3('user2@test.com', 'password', 'Test2', 'User2');
    const token3 = requestRegisterV3('user3@test.com', 'password', 'Test3', 'User3');
    const channel1 = requestChannelsCreateV3(token.token, 'channel1', true);
    const channel2 = requestChannelsCreateV3(token2.token, 'channel2', true);
    const message = requestMessageSendV2(token.token, channel1.channelId, 'This is good');
    const dm1 = requestDmCreateV2(token2.token, [token3.authUserId]);

    // User tries to share to a channel they're not part of
    expect(requestMessageShareV1(token.token, message.messageId, 'OptionalMessage', channel2.channelId, -1)).toEqual(403);
    // User tries to share to a dm they're not part of
    expect(requestMessageShareV1(token.token, message.messageId, 'OptionalMessage', -1, dm1.dmId)).toEqual(403);
  });
  test('Successful share', () => {
    const token = requestRegisterV3('user1@test.com', 'password', 'Test1', 'User1');
    const token2 = requestRegisterV3('user2@test.com', 'password', 'Test2', 'User2');
    const channel1 = requestChannelsCreateV3(token.token, 'channel1', true);
    const channel2 = requestChannelsCreateV3(token.token, 'channel2', true);
    requestChannelJoinV3(token2.token, channel1.channelId);
    const message = requestMessageSendV2(token.token, channel1.channelId, 'This is good');
    const dm0 = requestDmCreateV2(token.token, [token2.authUserId]);
    requestSendDm(token2.token, dm0.dmId, 'Message for coverage');
    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    const dmMessage = requestSendDm(token2.token, dm1.dmId, 'Message');

    expect(requestMessageShareV1(token.token, message.messageId, 'OptionalMessage', channel2.channelId, -1)).toStrictEqual({ shareMessageId: expect.any(Number) });
    expect(requestMessageShareV1(token.token, message.messageId, 'OptionalMessage', -1, dm1.dmId)).toStrictEqual({ shareMessageId: expect.any(Number) });
    expect(requestMessageShareV1(token2.token, message.messageId, '', -1, dm1.dmId)).toStrictEqual({ shareMessageId: expect.any(Number) });
    expect(requestMessageShareV1(token2.token, message.messageId, '', channel1.channelId, -1)).toStrictEqual({ shareMessageId: expect.any(Number) });
    expect(requestMessageShareV1(token2.token, dmMessage.messageId, '', channel1.channelId, -1)).toStrictEqual({ shareMessageId: expect.any(Number) });
    expect(requestMessageShareV1(token2.token, dmMessage.messageId, '', -1, dm1.dmId)).toStrictEqual({ shareMessageId: expect.any(Number) });
  });
});

describe('message/reactv1', () => {
  describe('General Error handling', () => {
    beforeEach(() => {
      requestClearV1();
    });

    afterEach(() => {
      requestClearV1();
    });
    test('Invalid Token', () => {
      const token = requestRegisterV3('test12@test.com', 'password', 'Test', 'User');
      requestRegisterV3('test12@test.com', 'password', 'Test', 'User');
      // Case check for channel:
      // create a channel
      const channel = requestChannelsCreateV3(token.token, 'we passing', true);
      // send message
      requestMessageSendV2(token.token, channel.channelId, 'This is good');
      expect(requestMessageReactV1('abc', channel.channelId, 1)).toEqual(403);
    });
    test('messageId is not valid', () => {
      // create a user
      const token = requestRegisterV3('test12@test.com', 'password', 'Test', 'User');
      const token2 = requestRegisterV3('test12@test.com', 'password', 'Test', 'User');
      // Case check for channel:
      // create a channel
      const channel = requestChannelsCreateV3(token.token, 'we passing', true);
      // send message
      requestMessageSendV2(token.token, channel.channelId, 'This is good');
      expect(requestMessageReactV1(token.token, 2, 1)).toEqual(400);

      // Case check for dm:
      // create a dm
      const dm = requestDmCreateV2(token.token, [token2.authUserId]);
      requestSendDm(token.token, dm.channelId, 'This is good');
      expect(requestMessageReactV1(token.token, 2, 1)).toEqual(400);
    });

    test('reactId is not valid', () => {
      // create a user
      const token = requestRegisterV3('test123@test.com', 'password', 'Test', 'User');
      const token2 = requestRegisterV3('test12@test.com', 'password', 'Test', 'User');
      // Case check for channel:
      // create a channel
      const channel = requestChannelsCreateV3(token.token, 'we passing', true);
      // send message
      const message = requestMessageSendV2(token.token, channel.channelId, 'This is good');
      expect(requestMessageReactV1(token.token, message.messageId, 2)).toEqual(400);
      // Case check for dm:
      const dm = requestDmCreateV2(token.token, [token2.authUserId]);
      const messagedm = requestSendDm(token.token, dm.channelId, 'This is good');
      expect(requestMessageReactV1(token.token, messagedm.messageId, 2)).toEqual(400);
    });

    test('Message removed', () => {
      // create a user
      const token = requestRegisterV3('test123@test.com', 'password', 'Test', 'User');
      // Case check for channel:
      // create a channel
      const channel = requestChannelsCreateV3(token.token, 'we passing', true);
      // send message
      const message = requestMessageSendV2(token.token, channel.channelId, 'This is good');
      requestMessageRemoveV2(token.token, message.messageId);
      expect(requestMessageReactV1(token.token, message.messageId, 1)).toEqual(400);
      // Case check for dm:
      const dm = requestDmCreateV2(token.token, []);
      const messagedm = requestSendDm(token.token, dm.channelId, 'This is good');
      requestMessageRemoveV2(token.token, messagedm.messageId);
      expect(requestMessageReactV1(token.token, messagedm.messageId, 1)).toEqual(400);
    });

    test('message already contains a react with ID reactId', () => {
      // create a user
      const token = requestRegisterV3('test12@test.com', 'password', 'Test', 'User');
      const token2 = requestRegisterV3('test124@test.com', 'password', 'Test', 'User');
      /// / case check for channel:
      // create a channel
      const channel = requestChannelsCreateV3(token.token, 'we passing', true);
      // send message
      const message = requestMessageSendV2(token.token, channel.channelId, 'This is good');
      expect(requestMessageReactV1(token.token, message.messageId, 1)).toEqual({});
      expect(requestMessageReactV1(token.token, message.messageId, 2)).toEqual(400);
      requestChannelInviteV3(token.token, channel.channelId, token2.authUserId);
      expect(requestMessageReactV1(token2.token, message.messageId, 1)).toEqual({});

      // Case check for dm:
      const dm = requestDmCreateV2(token.token, [token2.authUserId]);
      const message2 = requestSendDm(token.token, dm.dmId, 'FIRE AND HONEY');
      expect(requestMessageReactV1(token.token, message2.messageId, 1)).toEqual({});
      expect(requestMessageReactV1(token.token, message2.messageId, 1)).toEqual(400);
    });
  });

  describe('react in channel/dm', () => {
    beforeEach(() => {
      requestClearV1();
    });

    afterEach(() => {
      requestClearV1();
    });
    test('Channel:react message with multiple messages of channel', () => {
      // create a user
      const token = requestRegisterV3('test12@test.com', 'password', 'Test', 'User');
      const token2 = requestRegisterV3('aemondtarg@gmail.com', 'Vhagar200', 'Aemond', 'Targaryen');
      // create 2 channel
      const channel1 = requestChannelsCreateV3(token.token, 'we passing', true);
      requestChannelInviteV3(token.token, channel1.channelId, token2.authUserId);
      // send message
      // message send in the first channel
      const message = requestMessageSendV2(token.token, channel1.channelId, 'This is taking too long');
      const message2 = requestMessageSendV2(token2.token, channel1.channelId, 'Really?');
      expect(requestMessageReactV1(token2.token, message.messageId, 1)).toEqual({});
      expect(requestMessageReactV1(token.token, message.messageId, 1)).toEqual({});
      expect(requestChannelMessagesV3(token.token, channel1.channelId, 0)).toStrictEqual({
        messages: [
          {
            messageId: message2.messageId,
            uId: token2.authUserId,
            message: 'Really?',
            timeSent: expect.any(Number),
            reacts: [{
              reactId: 1,
              uIds: [],
              isThisUserReacted: false,
            }],
            isPinned: false
          },
          {
            messageId: message.messageId,
            uId: token.authUserId,
            message: 'This is taking too long',
            timeSent: expect.any(Number),
            reacts: [{
              reactId: 1,
              uIds: [token2.authUserId, token.authUserId],
              isThisUserReacted: true,
            }],
            isPinned: false
          }
        ],
        start: 0,
        end: -1
      });

      // adding another test to check if it is reacted
    });

    test('DM: react message with multiple message inside of dm', () => {
      // create a user
      const token = requestRegisterV3('test12@test.com', 'password', 'Test', 'User');
      const token2 = requestRegisterV3('test123@test.com', 'password', 'Test', 'User');
      // create 2 channel
      const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);

      // send message
      // message send in the first dm
      const message = requestSendDm(token.token, dm1.dmId, 'I\'ve spent too long on this fucking function');
      const message2 = requestSendDm(token2.token, dm1.dmId, 'Really?');
      expect(requestMessageReactV1(token.token, message.messageId, 1)).toEqual({});
      expect(requestMessagesDm(token.token, dm1.dmId, 0)).toStrictEqual({
        messages: [
          {
            messageId: message2.messageId,
            uId: token2.authUserId,
            message: 'Really?',
            timeSent: expect.any(Number),
            reacts: [{
              reactId: 1,
              uIds: [],
              isThisUserReacted: false,
            }],
            isPinned: false
          },
          {
            messageId: message.messageId,
            uId: token.authUserId,
            message: 'I\'ve spent too long on this fucking function',
            timeSent: expect.any(Number),
            reacts: [{
              reactId: 1,
              uIds: [token.authUserId],
              isThisUserReacted: true,
            }],
            isPinned: false
          }],
        start: 0,
        end: -1,
      });
      expect(requestMessageReactV1(token2.token, message.messageId, 1)).toEqual({});
      expect(requestMessageReactV1(token.token, message2.messageId, 1)).toEqual({});
      expect(requestMessagesDm(token2.token, dm1.dmId, 0)).toStrictEqual({
        messages: [
          {
            messageId: message2.messageId,
            uId: token2.authUserId,
            message: 'Really?',
            timeSent: expect.any(Number),
            reacts: [{
              reactId: 1,
              uIds: [token.authUserId],
              isThisUserReacted: false,
            }],
            isPinned: false
          },
          {
            messageId: message.messageId,
            uId: token.authUserId,
            message: 'I\'ve spent too long on this fucking function',
            timeSent: expect.any(Number),
            reacts: [{
              reactId: 1,
              uIds: [token.authUserId, token2.authUserId],
              isThisUserReacted: true,
            }],
            isPinned: false
          }],
        start: 0,
        end: -1,
      });
    });
  });
});

describe('message/Unreact/v1', () => {
  describe('General Error handling', () => {
    beforeEach(() => {
      requestClearV1();
    });

    afterEach(() => {
      requestClearV1();
    });
    test('Invalid Token', () => {
      const token = requestRegisterV3('test12@test.com', 'password', 'Test', 'User');
      requestRegisterV3('test12@test.com', 'password', 'Test', 'User');
      // Case check for channel:
      // create a channel
      const channel = requestChannelsCreateV3(token.token, 'we passing', true);
      // send message
      requestMessageSendV2(token.token, channel.channelId, 'This is good');
      expect(requestMessageUnreactV1('abc', channel.channelId, 1)).toEqual(403);
    });
    test('messageId is not valid', () => {
      // create a user
      const token = requestRegisterV3('test1@test.com', 'password', 'Test', 'User');
      const token2 = requestRegisterV3('test2@test.com', 'password', 'Test', 'User');
      // Case check for channel:
      // create a channel
      const channel = requestChannelsCreateV3(token.token, 'we passing', true);
      // send message
      requestMessageSendV2(token.token, channel.channelId, 'This is good');
      expect(requestMessageUnreactV1(token.token, 2, 1)).toEqual(400);

      // Case check for dm:
      // create a dm
      const dm = requestDmCreateV2(token.token, [token2.authUserId]);
      requestSendDm(token.token, dm.channelId, 'This is good');
      expect(requestMessageUnreactV1(token.token, 2, 1)).toEqual(400);
    });

    test('reactId is not valid', () => {
      // create a user
      const token = requestRegisterV3('test1@test.com', 'password', 'Test', 'User');
      const token2 = requestRegisterV3('test2@test.com', 'password', 'Test', 'User');
      // Case check for channel:
      // create a channel
      const channel = requestChannelsCreateV3(token.token, 'we passing', true);
      // send message
      const message = requestMessageSendV2(token.token, channel.channelId, 'This is good');
      expect(requestMessageUnreactV1(token.token, message.messaegId, 2)).toEqual(400);
      // Case check for dm:
      const dm = requestDmCreateV2(token.token, [token2.authUserId]);
      const messagedm = requestSendDm(token.token, dm.channelId, 'This is good');
      expect(requestMessageUnreactV1(token.token, messagedm.messaegId, 2)).toEqual(400);
    });

    test('message do not contain a react with ID from authorised user', () => {
      // create a user
      const token = requestRegisterV3('test12@test.com', 'password', 'Test', 'User');
      const token2 = requestRegisterV3('test12@test.com', 'password', 'Test', 'User');
      /// / case check for channel:
      // create a channel
      const channel = requestChannelsCreateV3(token.token, 'we passing', true);
      // send message
      const message = requestMessageSendV2(token.token, channel.channelId, 'This is good');
      const message2 = requestMessageSendV2(token.token, channel.channelId, 'This is good yeah');
      requestMessageReactV1(token.token, message.messaegId, 1);
      expect(requestMessageUnreactV1(token.token, message2.messaegId, 1)).toEqual(400);

      // Case check for dm:
      const dm = requestDmCreateV2(token.token, [token2.authUserId]);
      requestSendDm(token.token, dm.channelId, 'This is good');
      const messagedm2 = requestMessageSendV2(token.token, channel.channelId, 'This is good yeah');
      requestMessageReactV1(token.token, message.messaegId, 1);
      expect(requestMessageUnreactV1(token.token, messagedm2.messaegId, 1)).toEqual(400);
    });

    describe('Unreact in channel/dm', () => {
      beforeEach(() => {
        requestClearV1();
      });

      afterEach(() => {
        requestClearV1();
      });
      test('Channel:Unreact message with multiple message inside 1 of the 2 channel', () => {
        // create a user
        const token = requestRegisterV3('test12@test.com', 'password', 'Test', 'User');
        // create 2 channel
        const channel1 = requestChannelsCreateV3(token.token, 'we passing', true);
        const channel2 = requestChannelsCreateV3(token.token, 'Hello', true);
        // send message
        // message send in the first channel
        const message = requestMessageSendV2(token.token, channel1.channelId, 'This is taking too long');
        requestMessageSendV2(token.token, channel1.channelId, 'I agreed');
        // message send in the secodn channel
        requestMessageSendV2(token.token, channel2.channelId, '2.Really?');
        requestMessageSendV2(token.token, channel2.channelId, '2.Really?');
        // react the message
        expect(requestMessageReactV1(token.token, message.messageId, 1)).toEqual({});
        expect(requestMessageUnreactV1(token.token, message.messageId, 1)).toEqual({});
        // adding another test to check if it is reacted
      });

      test('DM: react message with multiple message inside 1 of the 2 dm', () => {
        // create a user
        const token = requestRegisterV3('test1@test.com', 'password', 'Test', 'User');
        const token2 = requestRegisterV3('test2@test.com', 'password', 'Test', 'User');
        // create 2 channel
        const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
        const dm2 = requestDmCreateV2(token.token, [token2.authUserId]);
        // send message
        // message send in the first dm
        const message = requestSendDm(token.token, dm1.dmId, 'This is good');
        requestSendDm(token.token, dm1.dmId, 'Really?');
        requestSendDm(token.token, dm1.dmId, 'I agreed');
        // message send in the secodn dm
        requestSendDm(token.token, dm2.dmId, '2.Really?');
        requestSendDm(token.token, dm2.dmId, '2.Really?');
        // react the message
        expect(requestMessageReactV1(token.token, message.messageId, 1)).toEqual({});
        // unreact
        expect(requestMessageUnreactV1(token.token, message.messageId, 1)).toEqual({});
        // adding another test to check if it is reacted
      });
    });
  });
});

describe('message/pin/v1', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });
  test('Invalid Token', () => {
    const invalidToken = '-1';
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user@gmail.com', 'Crunchies', 'user2First', 'user2Last');
    const publicChannel1 = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const messageId = requestMessageSendV2(token.token, publicChannel1.channelId, 'Rahul tutors COMP1531 on Wednesdays');

    expect(requestMessagePinV1(invalidToken, messageId.messageId)).toEqual(403);

    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    const messageDm1 = requestSendDm(token.token, dm1.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    expect(requestMessagePinV1(invalidToken, messageDm1.dmId)).toEqual(403);
  });

  test('Invalid Message Id', () => {
    const invalidMessageId = -1;
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const token3 = requestRegisterV3('use3@gmail.com', 'Crunchies3', 'user3First', 'user3Last');
    const publicChannel1 = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const publicChannel2 = requestChannelsCreateV3(token2.token, 'userChannel1', true);
    // Send 2 messages: One for each channel, by their respective channel Owners
    requestMessageSendV2(token.token, publicChannel1.channelId, 'Rahul tutors COMP1531 on Wednesdays');
    const messageId2 = requestMessageSendV2(token2.token, publicChannel2.channelId, 'Rahul tutors COMP1531 on Wednesdays');

    // MessageId is not a valid message within a channel the authorised user is part of
    expect(requestMessagePinV1(token.token, messageId2.messageId)).toEqual(400);
    // MessageId is not a valid messageId (in general)
    expect(requestMessagePinV1(token.token, invalidMessageId)).toEqual(400);

    const dm1 = requestDmCreateV2(token.token, [token3.authUserId]);
    requestSendDm(token.token, dm1.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    expect(requestMessagePinV1(token2.token, dm1.dmId)).toEqual(400);
    expect(requestMessagePinV1(token.token, invalidMessageId)).toEqual(400);
  });

  test('Message is already pinned', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user@gmail.com', 'Crunchies', 'user2First', 'user2Last');
    const publicChannel1 = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    // Send a message by the channel Owner
    const messageId1 = requestMessageSendV2(token.token, publicChannel1.channelId, 'Rahul tutors COMP1531 on Wednesdays');
    requestMessagePinV1(token.token, messageId1.messageId);
    expect(requestMessagePinV1(token.token, messageId1.messageId)).toEqual(400);

    // We currently don't make it here
    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    const messageDm1 = requestSendDm(token.token, dm1.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    requestMessagePinV1(token.token, messageDm1.messageId);
    expect(requestMessagePinV1(token.token, messageDm1.messageId)).toEqual(400);
  });

  test('User does not have owner permissions', () => {
    requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token = requestRegisterV3('user1@gmail.com', 'Crunchies1', 'user1First', 'user1Last');
    const token2 = requestRegisterV3('user2@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);
    const publicChannel1 = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    requestChannelJoinV3(token2.token, publicChannel1.channelId);
    // User who joins the channel sends a message
    const messageId1 = requestMessageSendV2(token2.token, publicChannel1.channelId, 'Rahul tutors COMP1531 on Wednesdays');
    expect(requestMessagePinV1(token2.token, messageId1.messageId)).toEqual(403);
    requestChannelAddOwnerV2(token.token, publicChannel1.channelId, user2.user.uId);
    expect(requestMessagePinV1(token2.token, messageId1.messageId)).toStrictEqual({});

    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    const messageDm1 = requestSendDm(token.token, dm1.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    expect(requestMessagePinV1(token2.token, messageDm1.messageId)).toEqual(403);
  });

  test('Successful Pins', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies1', 'user1First', 'user1Last');
    const publicChannel1 = requestChannelsCreateV3(token2.token, 'userChannel1', true);
    requestChannelJoinV3(token.token, publicChannel1.channelId);
    requestMessageSendV2(token.token, publicChannel1.channelId, 'Message for coverage 1');
    requestMessageSendV2(token2.token, publicChannel1.channelId, 'Message for coverage 2');
    const messageId1 = requestMessageSendV2(token.token, publicChannel1.channelId, 'Rahul tutors COMP1531 on Wednesdays');
    const messageId2 = requestMessageSendV2(token2.token, publicChannel1.channelId, 'I love comp1531');
    expect(requestMessagePinV1(token2.token, messageId1.messageId)).toStrictEqual({});
    // Global Owner should have owner permissions to pin
    expect(requestMessagePinV1(token.token, messageId2.messageId)).toStrictEqual({});

    const dm0 = requestDmCreateV2(token.token, [token2.authUserId]);
    requestSendDm(token.token, dm0.dmId, 'Message for coverage');
    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    requestSendDm(token.token, dm1.dmId, 'Message for coverage');
    const messageDm1 = requestSendDm(token.token, dm1.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    expect(requestMessagePinV1(token.token, messageDm1.messageId)).toStrictEqual({});
  });

  test("User isn't in the dm", () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies1', 'user1First', 'user1Last');
    const token3 = requestRegisterV3('user2@gmail.com', 'Crunchies2', 'user2First', 'user2Last');

    const dm1 = requestDmCreateV2(token2.token, [token3.authUserId]);
    const messageDm1 = requestSendDm(token2.token, dm1.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    expect(requestMessagePinV1(token.token, messageDm1.messageId)).toEqual(400);
  });
});

describe('message/unpin/v1', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });
  test('Invalid Token', () => {
    const invalidToken = '-1';
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user@gmail.com', 'Crunchies', 'user2First', 'user2Last');

    const publicChannel1 = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const messageId = requestMessageSendV2(token.token, publicChannel1.channelId, 'Rahul tutors COMP1531 on Wednesdays');
    requestMessagePinV1(token.token, messageId.messageId);
    expect(requestMessageUnpinV1(invalidToken, messageId.messageId)).toEqual(403);

    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    const messageDm1 = requestSendDm(token.token, dm1.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    requestMessagePinV1(token.token, messageDm1.messageId);
    expect(requestMessageUnpinV1(invalidToken, messageDm1.messageId)).toEqual(403);
  });

  test('Invalid Message Id', () => {
    const invalidMessageId = -1;
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const token3 = requestRegisterV3('user1@gmail.com', 'Crunchies3', 'user3First', 'user3Last');

    const publicChannel1 = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const publicChannel2 = requestChannelsCreateV3(token2.token, 'userChannel1', true);
    const messageId1 = requestMessageSendV2(token.token, publicChannel1.channelId, 'Rahul tutors COMP1531 on Wednesdays');
    const messageId2 = requestMessageSendV2(token2.token, publicChannel2.channelId, 'Rahul tutors COMP1531 on Wednesdays');
    requestMessagePinV1(token.token, messageId1.messageId);
    requestMessagePinV1(token2.token, messageId2.messageId);
    // MessageId is not a valid message within a channel the authorised user is part of
    expect(requestMessageUnpinV1(token.token, messageId2.messageId)).toEqual(400);

    // MessageId is not a valid messageId (in general)
    expect(requestMessageUnpinV1(token.token, invalidMessageId)).toEqual(400);

    // MessageId is not a valid message within a dm the authorised user is part of
    const dm1 = requestDmCreateV2(token2.token, [token3.authUserId]);
    const messageDm1 = requestSendDm(token2.token, dm1.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    requestMessagePinV1(token2.token, messageDm1.messageId);
    expect(requestMessageUnpinV1(token.token, invalidMessageId)).toEqual(400);
    expect(requestMessageUnpinV1(token.token, messageDm1.messageId)).toEqual(400);
  });

  test('Message is already unpinned', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user@gmail.com', 'Crunchies', 'user2First', 'user2Last');
    const publicChannel1 = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const messageId1 = requestMessageSendV2(token.token, publicChannel1.channelId, 'Rahul tutors COMP1531 on Wednesdays');
    expect(requestMessageUnpinV1(token.token, messageId1.messageId)).toEqual(400);

    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    const messageDm1 = requestSendDm(token.token, dm1.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    expect(requestMessageUnpinV1(token.token, messageDm1.messageId)).toEqual(400);
  });

  test('User does not have user permissions', () => {
    requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token = requestRegisterV3('user1@gmail.com', 'Crunchies1', 'user1First', 'user1Last');
    const token2 = requestRegisterV3('user2@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);
    const publicChannel1 = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    // User who joins the channel sends a message
    requestChannelJoinV3(token2.token, publicChannel1.channelId);
    const messageId1 = requestMessageSendV2(token2.token, publicChannel1.channelId, 'Rahul tutors COMP1531 on Wednesdays');
    // Owner of the channel pins the message
    requestMessagePinV1(token.token, messageId1.messageId);
    expect(requestMessageUnpinV1(token2.token, messageId1.messageId)).toEqual(403);
    requestChannelAddOwnerV2(token.token, publicChannel1.channelId, user2.user.uId);
    expect(requestMessageUnpinV1(token2.token, messageId1.messageId)).toStrictEqual({});

    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    const messageDm1 = requestSendDm(token.token, dm1.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    requestMessagePinV1(token.token, messageDm1.messageId);
    expect(requestMessageUnpinV1(token2.token, messageDm1.messageId)).toEqual(403);
  });

  test('Successful unpins', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies1', 'user1First', 'user1Last');
    const publicChannel1 = requestChannelsCreateV3(token2.token, 'userChannel1', true);
    requestChannelJoinV3(token.token, publicChannel1.channelId);
    requestMessageSendV2(token.token, publicChannel1.channelId, 'Message for coverage 1');
    requestMessageSendV2(token2.token, publicChannel1.channelId, 'Message for coverage 2');
    const messageId1 = requestMessageSendV2(token.token, publicChannel1.channelId, 'Rahul tutors COMP1531 on Wednesdays');
    const messageId2 = requestMessageSendV2(token2.token, publicChannel1.channelId, 'I love comp1531');
    requestMessagePinV1(token2.token, messageId1.messageId);
    requestMessagePinV1(token.token, messageId2.messageId);

    expect(requestMessageUnpinV1(token2.token, messageId2.messageId)).toStrictEqual({});
    expect(requestMessageUnpinV1(token.token, messageId1.messageId)).toStrictEqual({});

    const dm0 = requestDmCreateV2(token.token, [token2.authUserId]);
    requestSendDm(token.token, dm0.dmId, 'Message for coverage');
    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    requestSendDm(token.token, dm1.dmId, 'Message for coverage');
    const messageDm1 = requestSendDm(token.token, dm1.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    requestMessagePinV1(token.token, messageDm1.messageId);
    expect(requestMessageUnpinV1(token.token, messageDm1.messageId)).toStrictEqual({});
  });
  test("User isn't in the dm", () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies1', 'user1First', 'user1Last');
    const token3 = requestRegisterV3('user2@gmail.com', 'Crunchies2', 'user2First', 'user2Last');

    const dm1 = requestDmCreateV2(token2.token, [token3.authUserId]);
    const messageDm1 = requestSendDm(token2.token, dm1.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    expect(requestMessageUnpinV1(token.token, messageDm1.messageId)).toEqual(400);
  });
});

describe('/message/sendlater/v1', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Testing for invalid token', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel1 = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const mesId1 = requestMessageSendLaterV1('RandomToken', channel1.channelId, 'Message Test', getTime() + 1);
    expect(mesId1).toStrictEqual(403);
  });

  test('Testing for invalid channeId', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel1 = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const mesId1 = requestMessageSendLaterV1(authUser.token, channel1.channelId + 1, 'Message Test', getTime() + 1);
    expect(mesId1).toStrictEqual(400);
  });

  test('Testing for invalid timeSent', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel1 = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const mesId1 = requestMessageSendLaterV1(authUser.token, channel1.channelId, 'Message Test', 1);
    expect(mesId1).toStrictEqual(400);
  });

  test('Testing for message length < 1 or > 1000 characters', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel1 = requestChannelsCreateV3(authUser.token, 'channel1', true);
    const message = 't';
    const mesId1 = requestMessageSendLaterV1(authUser.token, channel1.channelId, message.repeat(1001), getTime() + 1);
    expect(mesId1).toStrictEqual(400);

    const mesId2 = requestMessageSendLaterV1(authUser.token, channel1.channelId, '', 1);
    expect(mesId2).toStrictEqual(400);
  });

  test('Testing for valid channelId but authUser is not member of channel', () => {
    const user1 = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const user2 = requestRegisterV3('test.email1@gmail.com', 'password', 'Jane', 'Doe');
    const channel1 = requestChannelsCreateV3(user1.token, 'channel1', true);
    const mesId1 = requestMessageSendLaterV1(user2.token, channel1.channelId, 'Message Test', getTime() + 1);
    expect(mesId1).toStrictEqual(403);
  });

  test('valid inputs', async () => {
    // const pause = ms => new Promise(res => setTimeout(res, ms));

    const user1 = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const channel1 = requestChannelsCreateV3(user1.token, 'channel1', true);
    const first = requestMessageSendLaterV1(user1.token, channel1.channelId, 'first', getTime() + 2);
    // checks that the message hasnt been sent yet
    expect(requestMessageEditV2(user1.token, first.messageId, 'New Message')).toEqual(400);
    expect(requestChannelMessagesV3(user1.token, channel1.channelId, 0)).toStrictEqual({ messages: [], start: 0, end: -1 });

    const second = requestMessageSendV2(user1.token, channel1.channelId, 'second');
    expect(first).toStrictEqual({ messageId: expect.any(Number) });
    await pause(2000);
    const result = requestChannelMessagesV3(user1.token, channel1.channelId, 0);
    expect(result).toStrictEqual({
      messages: [{
        messageId: first.messageId,
        uId: user1.authUserId,
        message: 'first',
        timeSent: expect.any(Number),
        reacts: [{
          reactId: 1,
          uIds: [],
          isThisUserReacted: false
        }],
        isPinned: false
      }, {
        messageId: second.messageId,
        uId: user1.authUserId,
        message: 'second',
        timeSent: expect.any(Number),
        reacts: [{
          reactId: 1,
          uIds: [],
          isThisUserReacted: false
        }],
        isPinned: false
      }],
      start: 0,
      end: -1
    });
  });
});

describe('message/sendlaterdm/v1 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('token invalid', () => {
    expect(requestSendLaterDm('invalidToken', 1, 'so sleepy', getTime() + 1)).toEqual(403);
  });
  test('dmId not valid', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const result = requestSendLaterDm(user.token, 1, 'when will this be over?', getTime() + 1);
    expect(result).toEqual(400);
  });
  test('dmId valid, user not a member', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const user2 = requestRegisterV3('someotheremail@gmail.com', 'PassTheWord', 'Baelor', 'Targaryen');
    const dm = requestDmCreateV2(user.token, []);
    const result = requestSendLaterDm(user2.token, dm.dmId, 'I gotta studdyt for math', getTime() + 1);
    expect(result).toEqual(403);
  });
  test('Empty message', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const user2 = requestRegisterV3('someotheremail@gmail.com', 'PassTheWord', 'Baelor', 'Targaryen');
    const dm = requestDmCreateV2(user.token, [user2.authUserId]);
    const result = requestSendLaterDm(user.token, dm.dmId, '', getTime() + 1);
    expect(result).toEqual(400);
  });
  test('Testing for invalid timeSent', () => {
    const authUser = requestRegisterV3('test.email@gmail.com', 'password', 'John', 'Doe');
    const dm = requestDmCreateV2(authUser.token, []);
    const mesId1 = requestSendLaterDm(authUser.token, dm.dmId, 'Message Test', 1);
    expect(mesId1).toStrictEqual(400);
  });
  test('message greater than 1000 characters', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const user2 = requestRegisterV3('someotheremail@gmail.com', 'PassTheWord', 'Baelor', 'Targaryen');
    const dm = requestDmCreateV2(user.token, [user2.authUserId]);
    const result = requestSendLaterDm(user.token, dm.dmId, 'BLAHHHHHHHHH'.repeat(110), getTime() + 1);
    expect(result).toEqual(400);
  });
  test('Valid input', async () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const dm = requestDmCreateV2(user.token, []);

    const first = requestSendLaterDm(user.token, dm.dmId, 'first - sent later', getTime() + 2);

    const second = requestSendDm(user.token, dm.dmId, 'second - sent immediately');
    expect(requestMessagesDm(user.token, dm.dmId, 0)).toStrictEqual({
      messages: [{
        messageId: second.messageId,
        uId: user.authUserId,
        message: 'second - sent immediately',
        timeSent: expect.any(Number),
        reacts: [{
          reactId: 1,
          uIds: [],
          isThisUserReacted: false
        }],
        isPinned: false,
      }],
      start: 0,
      end: -1
    });

    expect(first).toEqual({ messageId: expect.any(Number) });
    await pause(2000);
    const third = requestSendDm(user.token, dm.dmId, 'after await');
    const result2 = requestMessagesDm(user.token, dm.dmId, 0);
    expect(result2).toStrictEqual({
      messages: [
        {
          messageId: third.messageId,
          uId: user.authUserId,
          message: 'after await',
          timeSent: expect.any(Number),
          reacts: [{
            reactId: 1,
            uIds: [],
            isThisUserReacted: false
          }],
          isPinned: false,
        },
        {
          messageId: first.messageId,
          uId: user.authUserId,
          message: 'first - sent later',
          timeSent: expect.any(Number),
          reacts: [{
            reactId: 1,
            uIds: [],
            isThisUserReacted: false
          }],
          isPinned: false,
        },
        {
          messageId: second.messageId,
          uId: user.authUserId,
          message: 'second - sent immediately',
          timeSent: expect.any(Number),
          reacts: [{
            reactId: 1,
            uIds: [],
            isThisUserReacted: false
          }],
          isPinned: false,
        }],
      start: 0,
      end: -1
    });
  });
});
