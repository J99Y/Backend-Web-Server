import {
  requestRegisterV3,
  requestChannelsCreateV3,
  requestUserProfileV3,
  requestChannelJoinV3,
  requestChannelInviteV3,
  requestChannelDetailsV3,
  requestClearV1,
  requestAdminUserRemoveV1,
} from './testRequestRoutes';

describe('channelDetailsV3 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Token Invalid', () => {
    // add alison's channels create http route to here for testing
    const token = requestRegisterV3('nunanll@gmail.com', 'Rahul&LokAreTheBest', 'Michael', 'Myers');
    const channel = requestChannelsCreateV3(token.token, 'ChannelName', true);
    const result = requestChannelDetailsV3('InvalidToken', channel.channelId);
    expect(result).toEqual(403);
  });

  test('ChannelId invalid', () => {
    // register gives an authuserId object
    const token = requestRegisterV3('nunanll@gmail.com', 'Rahul&LokAreTheBest', 'Michael', 'Myers');
    // login will give a token which will need to be validated
    const result = requestChannelDetailsV3(token.token, 42);
    expect(result).toEqual(400);
  });

  test('ChannelId and token Valid, but user not part of channel', () => {
    const token = requestRegisterV3('nunanll@gmail.com', 'Rahul&LokAreTheBest', 'Michael', 'Myers');
    const token2 = requestRegisterV3('ajnsjkn@gmail.com', 'TutorsWorkSoHard', 'Brim', 'Stone');
    const channel = requestChannelsCreateV3(token.token, 'RahulIsTheBestTutor', false);
    const result = requestChannelDetailsV3(token2.token, channel.channelId);
    expect(result).toEqual(403);
  });

  test('Valid Input - single channel', () => {
    const token = requestRegisterV3('email@gmail.com', 'Rahul&LokAreTheBest', 'Michael', 'Myers');
    const user = requestUserProfileV3(token.token, token.authUserId);
    const channel = requestChannelsCreateV3(token.token, 'RahulIsTheBestTutor', false);
    const result = requestChannelDetailsV3(token.token, channel.channelId);
    expect(result).toStrictEqual(
      {
        name: 'RahulIsTheBestTutor',
        isPublic: false,
        ownerMembers: [user.user],
        allMembers: [user.user]
      });
  });

  test('Valid Input - multiple users in channel', () => {
    // create first user
    const token = requestRegisterV3('email@gmail.com', 'Rahul&LokAreTheBest', 'Michael', 'Myers');
    const user = requestUserProfileV3(token.token, token.authUserId);
    const channel = requestChannelsCreateV3(token.token, 'RahulIsTheBestTutor', false);
    // create 2nd user
    const token2 = requestRegisterV3('thisIsAn@gmail.com', 'ExtraMarksPls', 'firstname', 'lastname');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);
    requestChannelInviteV3(token.token, channel.channelId, token2.authUserId);
    const result = requestChannelDetailsV3(token.token, channel.channelId);
    expect(result).toStrictEqual(
      {
        name: 'RahulIsTheBestTutor',
        isPublic: false,
        ownerMembers: [user.user],
        allMembers: [user.user, user2.user],
      });
  });
});

describe('channel/join/v3 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Valid join request for a public channel', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    expect(requestChannelJoinV3(token2.token, globalPublicChannel.channelId)).toStrictEqual({});
  });

  test('User is inactive', () => {
    //  user 1 is the global owner
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    expect(requestAdminUserRemoveV1(token.token, token2.authUserId)).toEqual({});
    // user2 is now inactive
    expect(requestChannelJoinV3(token2.token, globalPublicChannel.channelId)).toStrictEqual(403);
  });
  test('Valid join request for a private channel where user is a global owner', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const privateChannel = requestChannelsCreateV3(token2.token, 'Channel2', false);
    expect(requestChannelJoinV3(token.token, privateChannel.channelId)).toStrictEqual({});
  });

  test('Invalid Session Token', () => {
    const invalidToken = '-1';
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const publicChannel = requestChannelsCreateV3(token2.token, 'Channel1', true);
    const privateChannel = requestChannelsCreateV3(token2.token, 'Channel2', false);
    expect(requestChannelJoinV3(invalidToken, publicChannel.channelId)).toEqual(403);
    expect(requestChannelJoinV3(invalidToken, privateChannel.channelId)).toEqual(403);
  });

  test('Invalid channelId', () => {
    const invalidId = -1;
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');

    expect(requestChannelJoinV3(token.token, invalidId)).toEqual(400);
  });

  test('Authorised user is already a member of the channel', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);
    const publicChannel = requestChannelsCreateV3(token2.token, 'Channel1', true);
    const privateChannel = requestChannelsCreateV3(token2.token, 'Channel2', false);
    expect(requestChannelJoinV3(token.token, globalPublicChannel.channelId)).toEqual(400);
    expect(requestChannelJoinV3(token.token, globalPrivateChannel.channelId)).toEqual(400);
    expect(requestChannelJoinV3(token2.token, publicChannel.channelId)).toEqual(400);
    expect(requestChannelJoinV3(token2.token, privateChannel.channelId)).toEqual(400);
  });

  test('Channel is private and user is not a global owner', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);
    expect(requestChannelJoinV3(token2.token, globalPrivateChannel.channelId)).toEqual(403);
  });
});

describe('channel/invite/v3 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Valid Invite request', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);
    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);
    expect(requestChannelInviteV3(token.token, globalPublicChannel.channelId, user2.user.uId)).toStrictEqual({});
    expect(requestChannelInviteV3(token.token, globalPrivateChannel.channelId, user2.user.uId)).toStrictEqual({});
  });

  test('Invalid Session Token', () => {
    const invalidToken = '-1';
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);
    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);
    expect(requestChannelInviteV3(invalidToken, globalPublicChannel.channelId, user2.user.uId)).toEqual(403);
    expect(requestChannelInviteV3(invalidToken, globalPrivateChannel.channelId, user2.user.uId)).toEqual(403);
  });

  test('User is inactive', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    expect(requestAdminUserRemoveV1(token.token, token2.authUserId)).toEqual({});
    expect(requestChannelInviteV3(token.token, globalPublicChannel.channelId, token2.authUserId)).toStrictEqual(403);
  });

  test('Invalid channelId', () => {
    const invalidId = -1;
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const globalOwner = requestUserProfileV3(token.token, token.authUserId);
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);

    expect(requestChannelInviteV3(token.token, invalidId, user2.user.uId)).toEqual(400);
    expect(requestChannelInviteV3(token2.token, invalidId, globalOwner.user.uId)).toEqual(400);
  });

  test('Invalid ulId', () => {
    const invalidId = -1;
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);
    expect(requestChannelInviteV3(token.token, globalPrivateChannel.channelId, invalidId)).toEqual(400);
    expect(requestChannelInviteV3(token.token, globalPublicChannel.channelId, invalidId)).toEqual(400);
  });

  test('uId refers to a user who is already a member of the channel', () => {
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const token3 = requestRegisterV3('user3@gmail.com', 'Crunchies3', 'user3First', 'user3Last');
    const user3 = requestUserProfileV3(token3.token, token3.authUserId);
    const publicChannel = requestChannelsCreateV3(token2.token, 'Channel1', true);
    const privateChannel = requestChannelsCreateV3(token2.token, 'Channel2', false);
    requestChannelInviteV3(token2.token, privateChannel.channelId, user3.user.uId);
    requestChannelJoinV3(token3.token, publicChannel.channelId);
    expect(requestChannelInviteV3(token2.token, privateChannel.channelId, user3.user.uId)).toEqual(400);
    expect(requestChannelInviteV3(token2.token, publicChannel.channelId, user3.user.uId)).toEqual(400);
  });

  test('Authorised user is not a member of the channel', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const globalOwner = requestUserProfileV3(token.token, token.authUserId);
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const token3 = requestRegisterV3('user3@gmail.com', 'Crunchies3', 'user3First', 'user3Last');
    const publicChannel = requestChannelsCreateV3(token2.token, 'Channel1', true);
    const privateChannel = requestChannelsCreateV3(token2.token, 'Channel2', false);
    expect(requestChannelInviteV3(token3.token, privateChannel.channelId, globalOwner.user.uId)).toEqual(403);
    expect(requestChannelInviteV3(token3.token, publicChannel.channelId, globalOwner.user.uId)).toEqual(403);
  });
});
