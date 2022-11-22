import {
  requestRegisterV3,
  requestChannelsCreateV3,
  requestUserProfileV3,
  requestChannelJoinV3,
  requestChannelInviteV3,
  requestClearV1,
  requestDmCreateV2,
  requestSendDm,
  requestMessageSendV2,
  requestMessageRemoveV2,
  requestSearchV1
} from './testRequestRoutes';

describe('search/v1', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Invalid Token', () => {
    const invalidToken = '-1';
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');

    requestChannelsCreateV3(token.token, 'globalChannel1', true);
    requestChannelsCreateV3(token.token, 'globalChannel2', false);

    expect(requestSearchV1(invalidToken, 'Query String')).toEqual(403);
    expect(requestSearchV1(invalidToken, 'Query String')).toEqual(403);
  });
  test('Search for a valid sub-string in that exists in channels', () => {
    const token = requestRegisterV3('user1@gmail.com', 'Crunchies1', 'user1First', 'user1Last');
    const token2 = requestRegisterV3('user2@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user = requestUserProfileV3(token.token, token.authUserId);
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);

    const publicChannel1 = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const privateChannel1 = requestChannelsCreateV3(token.token, 'globalChannel2', false);
    requestChannelJoinV3(token2.token, publicChannel1.channelId);
    requestChannelInviteV3(token.token, privateChannel1.channelId, user2.user.uId);
    const mesId1 = requestMessageSendV2(token.token, publicChannel1.channelId, 'Rahul tutors COMP1531 on Wednesdays');
    const mesId2 = requestMessageSendV2(token2.token, privateChannel1.channelId, 'I love studying comp1531 at UNSW');
    expect(requestSearchV1(token.token, 'comp1531')).toStrictEqual({
      messages: [
        {
          messageId: mesId1.messageId,
          uId: user.user.uId,
          message: 'Rahul tutors COMP1531 on Wednesdays',
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [],
            }
          ],
          isPinned: false,
        },
        {
          messageId: mesId2.messageId,
          uId: user2.user.uId,
          message: 'I love studying comp1531 at UNSW',
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [],
            }
          ],
          isPinned: false,
        }
      ]
    });
  });

  test('Search for a valid sub-string in that exists in dms', () => {
    const token = requestRegisterV3('user1@gmail.com', 'Crunchies1', 'user1First', 'user1Last');
    const token2 = requestRegisterV3('user2@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const token3 = requestRegisterV3('user3@gmail.com', 'Crunchies3', 'user3First', 'user3Last');
    const user = requestUserProfileV3(token.token, token.authUserId);
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);

    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    const dm2 = requestDmCreateV2(token2.token, [token3.authUserId]);

    const messagedm1 = requestSendDm(token.token, dm1.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    const messagedm2 = requestSendDm(token2.token, dm2.dmId, 'I love studying comp1531 at UNSW');
    expect(requestSearchV1(token2.token, 'comp1531')).toStrictEqual({
      messages: [
        {
          messageId: messagedm1.messageId,
          uId: user.user.uId,
          message: 'Rahul tutors COMP1531 on Wednesdays',
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [],
            }
          ],
          isPinned: false,
        },
        {
          messageId: messagedm2.messageId,
          uId: user2.user.uId,
          message: 'I love studying comp1531 at UNSW',
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [],
            }
          ],
          isPinned: false,
        }
      ]
    });
  });

  test('Invalid querStr', () => {
    const token = requestRegisterV3('user1@gmail.com', 'Crunchies1', 'user1First', 'user1Last');

    const publicChannel1 = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    requestMessageSendV2(token.token, publicChannel1.channelId, 'I enjoy COMP1531 on Wednesdays');

    const message = 'l';
    expect(requestSearchV1(token.token, '')).toEqual(400);
    expect(requestSearchV1(token.token, message.repeat(1001))).toEqual(400);
  });

  test('No matching strings', () => {
    const token = requestRegisterV3('user1@gmail.com', 'Crunchies1', 'user1First', 'user1Last');
    const token2 = requestRegisterV3('user2@gmail.com', 'Crunchies2', 'user2First', 'user2Last');

    const publicChannel1 = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    requestMessageSendV2(token.token, publicChannel1.channelId, 'I enjoy COMP1531 on Wednesdays');
    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    requestSendDm(token.token, dm1.dmId, 'Rahul tutors subjects on Wednesdays');

    expect(requestSearchV1(token.token, 'Comp1511')).toStrictEqual({ messages: [] });
  });

  test('Search for a removed message or dm', () => {
    const token = requestRegisterV3('user1@gmail.com', 'Crunchies1', 'user1First', 'user1Last');
    const token2 = requestRegisterV3('user2@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user = requestUserProfileV3(token.token, token.authUserId);
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);

    const publicChannel1 = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const privateChannel1 = requestChannelsCreateV3(token.token, 'globalChannel2', false);
    requestChannelJoinV3(token2.token, publicChannel1.channelId);
    requestChannelInviteV3(token.token, privateChannel1.channelId, user2.user.uId);
    const mesId1 = requestMessageSendV2(token.token, publicChannel1.channelId, 'I enjoy COMP1531 on Wednesdays');
    const mesId2 = requestMessageSendV2(token2.token, privateChannel1.channelId, 'I love studying comp1531 at UNSW');

    const dm1 = requestDmCreateV2(token.token, [token2.authUserId]);
    const dm2 = requestDmCreateV2(token2.token, [token.authUserId]);
    const messagedm1 = requestSendDm(token.token, dm1.dmId, 'Rahul tutors COMP1531 on Wednesdays');
    const messagedm2 = requestSendDm(token.token, dm2.dmId, 'I wish I was studying comp1531 at UNSW');

    requestMessageRemoveV2(token.token, mesId1.messageId);
    requestMessageRemoveV2(token.token, messagedm1.messageId);

    expect(requestSearchV1(token.token, 'comp1531')).toStrictEqual({
      messages: [
        {
          messageId: mesId2.messageId,
          uId: user2.user.uId,
          message: 'I love studying comp1531 at UNSW',
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [],
            }
          ],
          isPinned: false,
        },
        {
          messageId: messagedm2.messageId,
          uId: user.user.uId,
          message: 'I wish I was studying comp1531 at UNSW',
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [],
            }
          ],
          isPinned: false,
        }
      ]
    });
  });
});
// Potential Additions
// Search for a message in a dm / channel that is removed, dm / channel they're no longer part of.
