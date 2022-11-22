import {
  requestRegisterV3,
  requestChannelsCreateV3,
  requestChannelLeaveV2,
  requestChannelJoinV3,
  requestUserProfileV3,
  requestChannelRemoveOwnerV2,
  requestChannelInviteV3,
  requestChannelAddOwnerV2,
  requestClearV1,
  requestStandupStartV1
} from './testRequestRoutes';

describe('channel/leave/v2 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Channel Owner succesfully leaves', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    expect(requestChannelLeaveV2(token.token, globalPublicChannel.channelId)).toStrictEqual({});
    expect(requestChannelLeaveV2(token.token, globalPrivateChannel.channelId)).toStrictEqual({});
  });

  test('Joined user succesfully leaves', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    requestChannelJoinV3(token2.token, globalPublicChannel.channelId);
    expect(requestChannelLeaveV2(token2.token, globalPublicChannel.channelId)).toStrictEqual({});
    requestChannelInviteV3(token.token, globalPrivateChannel.channelId, user2.user.uId);
    expect(requestChannelLeaveV2(token2.token, globalPrivateChannel.channelId)).toStrictEqual({});
  });

  test('Invalid authuser / token', () => {
    const invalidToken = '-1';
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    expect(requestChannelLeaveV2(invalidToken, globalPublicChannel.channelId)).toEqual(403);
    expect(requestChannelLeaveV2(invalidToken, globalPrivateChannel.channelId)).toEqual(403);
  });

  test('Invalid channelId', () => {
    const invalidId = -1;
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');

    expect(requestChannelLeaveV2(token.token, invalidId)).toEqual(400);
    expect(requestChannelLeaveV2(token.token, invalidId)).toEqual(400);
  });

  test('authUser is not part of the channel', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    expect(requestChannelLeaveV2(token2.token, globalPublicChannel.channelId)).toEqual(403);
    expect(requestChannelLeaveV2(token2.token, globalPrivateChannel.channelId)).toEqual(403);
  });

  test('authUser is the starter of an active standup', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);
    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);
    requestChannelJoinV3(token2.token, globalPublicChannel.channelId);
    requestChannelInviteV3(token.token, globalPrivateChannel.channelId, user2.user.uId);

    requestStandupStartV1(token.token, globalPrivateChannel.channelId, 1);
    requestStandupStartV1(token.token, globalPublicChannel.channelId, 1);
    expect(requestChannelLeaveV2(token.token, globalPrivateChannel.channelId)).toEqual(400);
    expect(requestChannelLeaveV2(token.token, globalPublicChannel.channelId)).toEqual(400);
  });
});

describe('channel/removeowner/v1 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Successful removal of a regular owner by the global owner who is also the channel creator', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);
    requestChannelJoinV3(token2.token, globalPublicChannel.channelId);
    requestChannelInviteV3(token.token, globalPrivateChannel.channelId, user2.user.uId);

    requestChannelAddOwnerV2(token.token, globalPublicChannel.channelId, user2.user.uId);
    requestChannelAddOwnerV2(token.token, globalPrivateChannel.channelId, user2.user.uId);
    expect(requestChannelRemoveOwnerV2(token.token, globalPublicChannel.channelId, user2.user.uId)).toStrictEqual({});
    expect(requestChannelRemoveOwnerV2(token.token, globalPrivateChannel.channelId, user2.user.uId)).toStrictEqual({});
  });

  test('Successful removal of the original channel owner by the global owner who is not the channel creator', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);
    const globalOwner = requestUserProfileV3(token.token, token.authUserId);
    const token3 = requestRegisterV3('user2@gmail.com', 'Crunchies3', 'user3First', 'user3Last');
    const user3 = requestUserProfileV3(token3.token, token3.authUserId);

    const userPublicChannel = requestChannelsCreateV3(token2.token, 'user2PublicChannel', true);
    const userPrivateChannel = requestChannelsCreateV3(token2.token, 'user2PrivateChannel', false);
    requestChannelJoinV3(token.token, userPublicChannel.channelId);
    requestChannelInviteV3(token2.token, userPrivateChannel.channelId, globalOwner.user.uId);
    requestChannelJoinV3(token3.token, userPublicChannel.channelId);
    requestChannelInviteV3(token2.token, userPrivateChannel.channelId, user3.user.uId);

    requestChannelAddOwnerV2(token2.token, userPublicChannel.channelId, user3.user.uId);
    requestChannelAddOwnerV2(token2.token, userPrivateChannel.channelId, user3.user.uId);
    expect(requestChannelRemoveOwnerV2(token.token, userPublicChannel.channelId, user2.user.uId)).toStrictEqual({});
    expect(requestChannelRemoveOwnerV2(token.token, userPrivateChannel.channelId, user2.user.uId)).toStrictEqual({});
  });

  test('Successful removal of a channel owner by the global owner who is not the channel creator', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const globalOwner = requestUserProfileV3(token.token, token.authUserId);
    const token3 = requestRegisterV3('user2@gmail.com', 'Crunchies3', 'user3First', 'user3Last');
    const user3 = requestUserProfileV3(token3.token, token3.authUserId);

    const userPublicChannel = requestChannelsCreateV3(token2.token, 'user2PublicChannel', true);
    const userPrivateChannel = requestChannelsCreateV3(token2.token, 'user2PrivateChannel', false);
    requestChannelJoinV3(token.token, userPublicChannel.channelId);
    requestChannelInviteV3(token2.token, userPrivateChannel.channelId, globalOwner.user.uId);
    requestChannelJoinV3(token3.token, userPublicChannel.channelId);
    requestChannelInviteV3(token2.token, userPrivateChannel.channelId, user3.user.uId);

    requestChannelAddOwnerV2(token2.token, userPublicChannel.channelId, user3.user.uId);
    requestChannelAddOwnerV2(token2.token, userPrivateChannel.channelId, user3.user.uId);
    expect(requestChannelRemoveOwnerV2(token.token, userPublicChannel.channelId, user3.user.uId)).toStrictEqual({});
    expect(requestChannelRemoveOwnerV2(token.token, userPrivateChannel.channelId, user3.user.uId)).toStrictEqual({});
  });

  test('Successful removal of the global owner by a regular owner ', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const globalOwner = requestUserProfileV3(token.token, token.authUserId);
    const token3 = requestRegisterV3('user2@gmail.com', 'Crunchies3', 'user3First', 'user3Last');
    const user3 = requestUserProfileV3(token3.token, token3.authUserId);

    const userPublicChannel = requestChannelsCreateV3(token2.token, 'user2PublicChannel', true);
    const userPrivateChannel = requestChannelsCreateV3(token2.token, 'user2PrivateChannel', false);
    // Add the global owner to the channel
    requestChannelJoinV3(token.token, userPublicChannel.channelId);
    requestChannelInviteV3(token2.token, userPrivateChannel.channelId, globalOwner.user.uId);
    // Add a third user to the channel and make them an owner
    requestChannelJoinV3(token3.token, userPublicChannel.channelId);
    requestChannelInviteV3(token2.token, userPrivateChannel.channelId, user3.user.uId);
    requestChannelAddOwnerV2(token2.token, userPublicChannel.channelId, user3.user.uId);
    requestChannelAddOwnerV2(token2.token, userPrivateChannel.channelId, user3.user.uId);

    expect(requestChannelRemoveOwnerV2(token.token, userPublicChannel.channelId, user3.user.uId)).toStrictEqual({});
    expect(requestChannelRemoveOwnerV2(token.token, userPrivateChannel.channelId, user3.user.uId)).toStrictEqual({});
  });

  test('Successful removal of a regular owner by a regular owner ', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const token3 = requestRegisterV3('user2@gmail.com', 'Crunchies3', 'user3First', 'user3Last');
    const user3 = requestUserProfileV3(token3.token, token3.authUserId);
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalPublicChannel', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalPrivateChannel', false);
    requestChannelJoinV3(token2.token, globalPublicChannel.channelId);
    requestChannelInviteV3(token.token, globalPrivateChannel.channelId, user2.user.uId);
    requestChannelJoinV3(token3.token, globalPublicChannel.channelId);
    requestChannelInviteV3(token2.token, globalPrivateChannel.channelId, user3.user.uId);
    requestChannelAddOwnerV2(token.token, globalPublicChannel.channelId, user2.user.uId);
    requestChannelAddOwnerV2(token.token, globalPrivateChannel.channelId, user2.user.uId);
    requestChannelAddOwnerV2(token2.token, globalPublicChannel.channelId, user3.user.uId);
    requestChannelAddOwnerV2(token2.token, globalPrivateChannel.channelId, user3.user.uId);

    expect(requestChannelRemoveOwnerV2(token2.token, globalPublicChannel.channelId, user3.user.uId)).toStrictEqual({});
    expect(requestChannelRemoveOwnerV2(token2.token, globalPrivateChannel.channelId, user3.user.uId)).toStrictEqual({});
  });

  test('Invalid channelId', () => {
    const invalidId = -1;
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    requestChannelJoinV3(token2.token, globalPublicChannel.channelId);
    requestChannelInviteV3(token.token, globalPrivateChannel.channelId, user2.user.uId);
    requestChannelAddOwnerV2(token.token, globalPublicChannel.channelId, user2.user.uId);
    requestChannelAddOwnerV2(token.token, globalPrivateChannel.channelId, user2.user.uId);
    expect(requestChannelRemoveOwnerV2(token.token, invalidId, user2.user.uId)).toEqual(400);
  });

  test('Invalid authuser / token', () => {
    const invalidToken = '-1';
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    requestChannelJoinV3(token2.token, globalPublicChannel.channelId);
    requestChannelInviteV3(token.token, globalPrivateChannel.channelId, user2.user.uId);
    requestChannelAddOwnerV2(token.token, globalPublicChannel.channelId, user2.user.uId);
    requestChannelAddOwnerV2(token.token, globalPrivateChannel.channelId, user2.user.uId);
    expect(requestChannelRemoveOwnerV2(invalidToken, globalPublicChannel.channelId, user2.user.uId)).toEqual(403);
    expect(requestChannelRemoveOwnerV2(invalidToken, globalPrivateChannel.channelId, user2.user.uId)).toEqual(403);
  });

  test('Invalid uId', () => {
    const invalidId = -1;
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    expect(requestChannelRemoveOwnerV2(token.token, globalPublicChannel.channelId, invalidId)).toEqual(400);
    expect(requestChannelRemoveOwnerV2(token.token, globalPrivateChannel.channelId, invalidId)).toEqual(400);
  });

  test('The authUser does not have owner permissions in the channel', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const globalOwner = requestUserProfileV3(token.token, token.authUserId);
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    requestChannelJoinV3(token2, globalPublicChannel.channelId);
    expect(requestChannelRemoveOwnerV2(token2.token, globalPublicChannel.channelId, globalOwner.user.uId)).toEqual(403);
    requestChannelInviteV3(token, globalPrivateChannel.channelId, user2.user.uId);
    expect(requestChannelRemoveOwnerV2(token2.token, globalPrivateChannel.channelId, globalOwner.user.uId)).toEqual(403);
  });

  test('uId refers to a user who is not an owner of the channel', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    requestChannelJoinV3(token2.token, globalPublicChannel.channelId);
    expect(requestChannelRemoveOwnerV2(token.token, globalPublicChannel.channelId, user2.user.uId)).toEqual(400);
    requestChannelInviteV3(token.token, globalPrivateChannel.channelId, user2.user.uId);
    expect(requestChannelRemoveOwnerV2(token.token, globalPrivateChannel.channelId, user2.user.uId)).toEqual(400);
  });

  test('uId refers to a user who is the only owner of the channel', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const globalOwner = requestUserProfileV3(token.token, token.authUserId);

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    expect(requestChannelRemoveOwnerV2(token.token, globalPublicChannel.channelId, globalOwner.user.uId)).toEqual(400);
    expect(requestChannelRemoveOwnerV2(token.token, globalPrivateChannel.channelId, globalOwner.user.uId)).toEqual(400);
  });

  test("authUser doesn't have owner permissions", () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const globalOwner = requestUserProfileV3(token.token, token.authUserId);
    const token2 = requestRegisterV3('global1@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token3 = requestRegisterV3('global2@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const user3 = requestUserProfileV3(token3.token, token.authUserId);
    const userPublicChannel = requestChannelsCreateV3(token2.token, 'userChannel1', true);
    const userPrivateChannel = requestChannelsCreateV3(token2.token, 'userChannel2', false);

    requestChannelJoinV3(token.token, userPublicChannel.channelId);
    requestChannelInviteV3(token2.token, userPrivateChannel.channelId, globalOwner.user.uId);
    requestChannelJoinV3(token3.token, userPublicChannel.channelId);
    requestChannelInviteV3(token2.token, userPrivateChannel.channelId, user3.user.uId);

    expect(requestChannelAddOwnerV2(token3.token, userPublicChannel.channelId, globalOwner.user.uId)).toEqual(403);
    expect(requestChannelAddOwnerV2(token3.token, userPrivateChannel.channelId, globalOwner.user.uId)).toEqual(403);
  });

  test('uId refers to a user who is not a member of the channel', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);
    const token3 = requestRegisterV3('user2@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user3 = requestUserProfileV3(token3.token, token3.authUserId);

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    requestChannelJoinV3(token2.token, globalPublicChannel.channelId);
    expect(requestChannelRemoveOwnerV2(token.token, globalPublicChannel.channelId, user3.user.uId)).toEqual(400);
    requestChannelInviteV3(token.token, globalPrivateChannel.channelId, user2.user.uId);
    expect(requestChannelRemoveOwnerV2(token.token, globalPrivateChannel.channelId, user3.user.uId)).toEqual(400);
  });
});

describe('channel/addowner/v1 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Successful addition of an owner', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    requestChannelJoinV3(token2.token, globalPublicChannel.channelId);
    requestChannelInviteV3(token.token, globalPrivateChannel.channelId, user2.user.uId);
    expect(requestChannelAddOwnerV2(token.token, globalPublicChannel.channelId, user2.user.uId)).toStrictEqual({});
    expect(requestChannelAddOwnerV2(token.token, globalPrivateChannel.channelId, user2.user.uId)).toStrictEqual({});
  });

  test('Global Owner makes themselves an owner', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const globalOwner = requestUserProfileV3(token.token, token.authUserId);

    const userPublicChannel = requestChannelsCreateV3(token2.token, 'globalChannel1', true);
    const userPrivateChannel = requestChannelsCreateV3(token2.token, 'globalChannel2', false);

    requestChannelJoinV3(token.token, userPublicChannel.channelId);
    requestChannelInviteV3(token2.token, userPrivateChannel.channelId, globalOwner.user.uId);
    expect(requestChannelAddOwnerV2(token.token, userPublicChannel.channelId, globalOwner.user.uId)).toStrictEqual({});
    expect(requestChannelAddOwnerV2(token.token, userPrivateChannel.channelId, globalOwner.user.uId)).toStrictEqual({});
  });

  test('Successful addition of an owner by the global owner ', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const globalOwner = requestUserProfileV3(token.token, token.authUserId);
    const token3 = requestRegisterV3('user2@gmail.com', 'Crunchies3', 'user3First', 'user3Last');
    const user3 = requestUserProfileV3(token3.token, token3.authUserId);

    const userPublicChannel = requestChannelsCreateV3(token2.token, 'user2PublicChannel', true);
    const userPrivateChannel = requestChannelsCreateV3(token2.token, 'user2PrivateChannel', false);
    // Add the global owner to the channel
    requestChannelJoinV3(token.token, userPublicChannel.channelId);
    requestChannelInviteV3(token2.token, userPrivateChannel.channelId, globalOwner.user.uId);
    // Add a third user to the channel and make them an owner by the global owner
    requestChannelJoinV3(token3.token, userPublicChannel.channelId);
    requestChannelInviteV3(token2.token, userPrivateChannel.channelId, user3.user.uId);
    expect(requestChannelAddOwnerV2(token.token, userPublicChannel.channelId, user3.user.uId)).toStrictEqual({});
    expect(requestChannelAddOwnerV2(token.token, userPrivateChannel.channelId, user3.user.uId)).toStrictEqual({});
  });

  test('Invalid channelId', () => {
    const invalidId = -1;
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    requestChannelJoinV3(token2.token, globalPublicChannel.channelId);
    requestChannelInviteV3(token.token, globalPrivateChannel.channelId, user2.user.uId);
    expect(requestChannelAddOwnerV2(token.token, invalidId, user2.user.uId)).toEqual(400);
    expect(requestChannelAddOwnerV2(token.token, invalidId, user2.user.uId)).toEqual(400);
  });

  test('Invalid authuser / token', () => {
    const invalidToken = '-1';
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);
    requestChannelJoinV3(token2.token, globalPublicChannel.channelId);
    requestChannelInviteV3(token.token, globalPrivateChannel.channelId, user2.user.uId);

    expect(requestChannelAddOwnerV2(invalidToken, globalPublicChannel.channelId, user2.user.uId)).toEqual(403);
    expect(requestChannelAddOwnerV2(invalidToken, globalPrivateChannel.channelId, user2.user.uId)).toEqual(403);
  });

  test('Invalid uId', () => {
    const invalidId = -1;
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    expect(requestChannelAddOwnerV2(token.token, globalPublicChannel.channelId, invalidId)).toEqual(400);
    expect(requestChannelAddOwnerV2(token.token, globalPrivateChannel.channelId, invalidId)).toEqual(400);
  });

  test('The authUser does not have owner permissions in the channel', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token2 = requestRegisterV3('user1@gmail.com', 'Crunchies2', 'user2First', 'user2Last');
    const user2 = requestUserProfileV3(token2.token, token2.authUserId);
    const token3 = requestRegisterV3('user3@gmail.com', 'Crunchies3', 'user3First', 'user3Last');

    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    requestChannelJoinV3(token2.token, globalPublicChannel.channelId);
    requestChannelInviteV3(token.token, globalPrivateChannel.channelId, user2.user.uId);
    // Authorised user isn't in a channel
    expect(requestChannelAddOwnerV2(token3.token, globalPublicChannel.channelId, user2.user.uId)).toEqual(403);
    expect(requestChannelAddOwnerV2(token3.token, globalPrivateChannel.channelId, user2.user.uId)).toEqual(403);
    // Authorised user is a channel member, but not an owner
    requestChannelJoinV3(token3, globalPublicChannel.channeId);
    expect(requestChannelAddOwnerV2(token3.token, globalPublicChannel.channelId, user2.user.uId)).toEqual(403);
    expect(requestChannelAddOwnerV2(token3.token, globalPrivateChannel.channelId, user2.user.uId)).toEqual(403);
  });

  test('uId refers to a user who is not a member of the channel', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token3 = requestRegisterV3('user3@gmail.com', 'Crunchies3', 'user3First', 'user3Last');
    const user3 = requestUserProfileV3(token3.token, token3.authUserId);
    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    expect(requestChannelAddOwnerV2(token.token, globalPublicChannel.channelId, user3.user.uId)).toEqual(400);
    expect(requestChannelAddOwnerV2(token.token, globalPrivateChannel.channelId, user3.user.uId)).toEqual(400);
  });

  test('uId refers to a user who is already an owner of the channel', () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const globalOwner = requestUserProfileV3(token.token, token.authUserId);
    const globalPublicChannel = requestChannelsCreateV3(token.token, 'globalChannel1', true);
    const globalPrivateChannel = requestChannelsCreateV3(token.token, 'globalChannel2', false);

    expect(requestChannelAddOwnerV2(token.token, globalPublicChannel.channelId, globalOwner.user.uId)).toEqual(400);
    expect(requestChannelAddOwnerV2(token.token, globalPrivateChannel.channelId, globalOwner.user.uId)).toEqual(400);
  });
  test("authUser doesn't have owner permissions", () => {
    const token = requestRegisterV3('global@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const globalOwner = requestUserProfileV3(token.token, token.authUserId);
    const token2 = requestRegisterV3('global1@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const token3 = requestRegisterV3('global2@gmail.com', 'Crunchies', 'userFirst', 'userLast');
    const user3 = requestUserProfileV3(token3.token, token.authUserId);
    const userPublicChannel = requestChannelsCreateV3(token2.token, 'userChannel1', true);
    const userPrivateChannel = requestChannelsCreateV3(token2.token, 'userChannel2', false);

    requestChannelJoinV3(token.token, userPublicChannel.channelId);
    requestChannelInviteV3(token2.token, userPrivateChannel.channelId, globalOwner.user.uId);
    requestChannelJoinV3(token3.token, userPublicChannel.channelId);
    requestChannelInviteV3(token2.token, userPrivateChannel.channelId, user3.user.uId);

    expect(requestChannelRemoveOwnerV2(token3.token, userPublicChannel.channelId, globalOwner.user.uId)).toEqual(403);
    expect(requestChannelRemoveOwnerV2(token3.token, userPrivateChannel.channelId, globalOwner.user.uId)).toEqual(403);
  });
});
