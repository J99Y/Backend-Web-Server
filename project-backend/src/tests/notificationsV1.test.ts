import {
  requestRegisterV3,
  requestChannelsCreateV3,
  requestChannelJoinV3,
  requestUserProfileV3,
  requestClearV1,
  requestDmCreateV2,
  requestSendDm,
  requestMessageSendV2,
  requestNotificationsV1,
  requestMessageReactV1,
  requestMessageUnreactV1,
  requestMessageShareV1
} from './testRequestRoutes';

describe('notifications/get/v1', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });
  test('Invalid Token', () => {
    const invalidToken = '-1';
    requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    expect(requestNotificationsV1(invalidToken)).toEqual(403);
  });
  test('Tag @ notifications', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies1', 'user1First', 'user1Last');
    const publicChannel1 = requestChannelsCreateV3(token2.token, 'userChannel1', true);
    const privateChannel1 = requestChannelsCreateV3(token2.token, 'userChannel2', false);
    requestChannelJoinV3(token.token, publicChannel1.channelId);

    const userHandleStr = requestUserProfileV3(token.token, token.authUserId).user.handleStr;
    const userHandleStr2 = requestUserProfileV3(token2.token, token2.authUserId).user.handleStr;
    const message1 = requestMessageSendV2(token.token, publicChannel1.channelId, `@${userHandleStr}`);
    requestMessageSendV2(token2.token, publicChannel1.channelId, `@${userHandleStr} loves comp1531`);
    requestMessageSendV2(token2.token, privateChannel1.channelId, `@${userHandleStr} needs to study comp1531`);

    const dm0 = requestDmCreateV2(token.token, [token2.authUserId]);
    requestSendDm(token.token, dm0.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    const dmMessage = requestSendDm(token.token, dm1.dmId, `@${userHandleStr} tutors COMP1531 on Wednesdays`);

    requestMessageShareV1(token.token, message1.messageId, `@${userHandleStr}`, publicChannel1.channelId, -1);
    requestMessageShareV1(token.token, dmMessage.messageId, `@${userHandleStr}`, -1, dm0.dmId);

    expect(requestNotificationsV1(token.token)).toStrictEqual({
      notifications: [
        {
          channelId: -1,
          dmId: dm0.dmId,
          notificationMessage: `${userHandleStr} tagged you in ${userHandleStr2}, ${userHandleStr}: @userfirstuserlast`,
        },
        {
          channelId: publicChannel1.channelId,
          dmId: -1,
          notificationMessage: `${userHandleStr} tagged you in userChannel1: @userfirstuserlast`,
        },
        {
          channelId: -1,
          dmId: dm1.dmId,
          notificationMessage: `${userHandleStr} tagged you in ${userHandleStr2}, ${userHandleStr}: @userfirstuserlast t`,
        },
        {
          channelId: -1,
          dmId: dm1.dmId,
          notificationMessage: `${userHandleStr} added you to ${userHandleStr2}, ${userHandleStr}`,
        },
        {
          channelId: -1,
          dmId: dm0.dmId,
          notificationMessage: `${userHandleStr} added you to ${userHandleStr2}, ${userHandleStr}`,
        },
        {
          channelId: publicChannel1.channelId,
          dmId: -1,
          notificationMessage: `${userHandleStr2} tagged you in userChannel1: @userfirstuserlast l`,
        },
        {
          channelId: publicChannel1.channelId,
          dmId: -1,
          notificationMessage: `${userHandleStr} tagged you in userChannel1: @userfirstuserlast`,
        },
      ]
    });
    /**
     * Create public and private channel: add users
     * tag users in channel messages
     * tag themselves in the channel
     *
     * Create a standup
     * tag users in the standup
     * tag themselves in the standup
     *
     * Create a dm: add users
     * tag users in the dm
     * tag themselves in the dm
     */
  });
  test('React notifications', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies1', 'user1First', 'user1Last');
    const publicChannel1 = requestChannelsCreateV3(token2.token, 'userChannel1', true);
    const privateChannel1 = requestChannelsCreateV3(token2.token, 'userChannel2', false);
    requestChannelJoinV3(token.token, publicChannel1.channelId);

    const messageId1 = requestMessageSendV2(token2.token, publicChannel1.channelId, 'I love comp1531');
    requestMessageReactV1(token.token, messageId1.messageId, 1);
    const messageId2 = requestMessageSendV2(token2.token, privateChannel1.channelId, 'Normal Message');
    requestMessageReactV1(token2.token, messageId2.messageId, 1);

    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    requestSendDm(token2.token, dm1.dmId, 'Puting a message here to pass coverage');
    const messageDm2 = requestSendDm(token2.token, dm1.dmId, 'I love COMP1531 on Wednesdays');
    requestMessageReactV1(token.token, messageDm2.messageId, 1);

    const userHandleStr = requestUserProfileV3(token.token, token.authUserId).user.handleStr;
    const userHandleStr2 = requestUserProfileV3(token2.token, token2.authUserId).user.handleStr;
    expect(requestNotificationsV1(token2.token)).toStrictEqual({
      notifications: [
        {
          channelId: -1,
          dmId: dm1.dmId,
          notificationMessage: `${userHandleStr} reacted to your message in ${userHandleStr2}, ${userHandleStr}`,
        },
        {
          channelId: -1,
          dmId: dm1.dmId,
          notificationMessage: `${userHandleStr} added you to ${userHandleStr2}, ${userHandleStr}`,
        },
        {
          channelId: privateChannel1.channelId,
          dmId: -1,
          notificationMessage: `${userHandleStr2} reacted to your message in userChannel2`,
        },
        {
          channelId: publicChannel1.channelId,
          dmId: -1,
          notificationMessage: `${userHandleStr} reacted to your message in userChannel1`,
        }
      ]
    });
    /**
     * Create a standup
     * react to message in the standup
     */
  });
  test('Show 20 user notifications when they have recieved over 20', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    requestUserProfileV3(token.token, token.authUserId);
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies1', 'user1First', 'user1Last');
    requestUserProfileV3(token2.token, token2.authUserId);
    const publicChannel1 = requestChannelsCreateV3(token2.token, 'userChannel1', true);
    requestChannelJoinV3(token.token, publicChannel1.channelId);

    const messageId1 = requestMessageSendV2(token2.token, publicChannel1.channelId, 'I love comp1531');

    for (let count = 0; count < 21; count++) {
      requestMessageReactV1(token.token, messageId1.messageId, 1);
      requestMessageUnreactV1(token.token, messageId1.messageId, 1);
    }
    expect(requestNotificationsV1(token2.token).notifications.length).toStrictEqual(20);
  });
  test('Invalid Tag @', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user@gmail.com', 'Crunchies1', 'user1First', 'user1Last');
    const publicChannel1 = requestChannelsCreateV3(token.token, 'userChannel1', true);
    const privateChannel1 = requestChannelsCreateV3(token.token, 'userChannel2', false);

    const userHandleStr = requestUserProfileV3(token.token, token.authUserId).user.handleStr;
    const userHandleStr2 = requestUserProfileV3(token2.token, token2.authUserId).user.handleStr;
    requestMessageSendV2(token.token, publicChannel1.channelId, '@randomeuser');
    requestMessageSendV2(token.token, privateChannel1.channelId, `@${userHandleStr} @randomuser needs to study comp1531`);

    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    requestSendDm(token.token, dm1.dmId, '@nope tutors COMP1531 on Wednesdays');
    expect(requestNotificationsV1(token.token)).toStrictEqual({
      notifications: [
        {
          channelId: -1,
          dmId: dm1.dmId,
          notificationMessage: `${userHandleStr} added you to ${userHandleStr2}, ${userHandleStr}`,
        },
        {
          channelId: privateChannel1.channelId,
          dmId: -1,
          notificationMessage: `${userHandleStr} tagged you in userChannel2: @userfirstuserlast @`,
        }
      ]
    });
  });
});
