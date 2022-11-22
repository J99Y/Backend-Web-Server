import {
  requestRegisterV3,
  requestLoginV3,
  requestDmCreateV2,
  requestDmDetailsV2,
  requestDmLeaveV2,
  requestDmListV2,
  requestDmRemoveV2,
  requestSendDm,
  requestMessagesDm,
  requestUserProfileV3,
  requestClearV1,
  requestAdminUserRemoveV1
} from './testRequestRoutes';
import { getTime } from '../other';

// alison
describe('/dm/create/v2 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('uId in Uids does not refer to valid user', () => {
    const uIds: number[] = [2, 3];
    // register to get token
    const user = requestRegisterV3('someemail@gmail.com', 'RandomPa@ssword', 'Carl', 'Lenny');
    // const token = requestLoginV3('test12@test.com', 'password');
    const dm = requestDmCreateV2(user.token, uIds);

    expect(dm).toEqual(400);
  });

  test('duplicate uIds in uIds', () => {
    const user1 = requestRegisterV3('someemail@gmail.com', 'RandomPa@ssword', 'Carl', 'Lenny');
    const user2 = requestRegisterV3('westeros@gmail.com', 'RandomPa@ssword', 'Aegon', 'Targaryen');
    const dm = requestDmCreateV2(user1.token, [user2.authUserId, user2.authUserId]);
    expect(dm).toEqual(400);
  });

  test('token is not valid', () => {
    const uIds: number[] = [];
    const dm = requestDmCreateV2('abc', uIds);
    expect(dm).toEqual(403);
  });

  test('inactive user create channel', () => {
    // register to get token
    const user1 = requestRegisterV3('someemail1@gmail.com', 'RandomPa@ssword', 'Carl1', 'Lenny1');
    const user2 = requestRegisterV3('someemail2@gmail.com', 'RandomPa@ssword', 'Carl2', 'Lenny2');
    const user3 = requestRegisterV3('someemail3@gmail.com', 'RandomPa@ssword', 'Carl3', 'Lenny3');
    const uIds: number[] = [user2.authUserId, user3.authUserId];
    expect(requestAdminUserRemoveV1(user1.token, user2.authUserId)).toEqual({});
    const dm = requestDmCreateV2(user2.token, uIds);
    expect(dm).toStrictEqual(403);
  });

  test('successful create', () => {
    // register to get token
    requestRegisterV3('someemail1@gmail.com', 'RandomPa@ssword', 'Carl1', 'Lenny1');
    const user2 = requestRegisterV3('someemail2@gmail.com', 'RandomPa@ssword', 'Carl2', 'Lenny2');
    const user3 = requestRegisterV3('someemail3@gmail.com', 'RandomPa@ssword', 'Carl3', 'Lenny3');
    const token = requestLoginV3('someemail1@gmail.com', 'RandomPa@ssword');
    const uIds: number[] = [user2.authUserId, user3.authUserId];
    const dm = requestDmCreateV2(token.token, uIds);
    expect(dm).toStrictEqual({ dmId: expect.any(Number) });
  });

  test('successful create 2 dm', () => {
    // register to get token
    const user1 = requestRegisterV3('someemail1@gmail.com', 'RandomPa@ssword', 'Carl1', 'Lenny1');
    const user2 = requestRegisterV3('someemail2@gmail.com', 'RandomPa@ssword', 'Carl2', 'Lenny2');
    const user3 = requestRegisterV3('someemail3@gmail.com', 'RandomPa@ssword', 'Carl3', 'Lenny3');
    // const token = requestLoginV3('test12@test.com', 'password');
    const uIds: number[] = [user2.authUserId, user3.authUserId];
    const uIds2: number[] = [user2.authUserId];
    const dm = requestDmCreateV2(user1.token, uIds);
    const dm2 = requestDmCreateV2(user1.token, uIds2);
    expect(dm).toStrictEqual({ dmId: expect.any(Number) });
    expect(dm2).toStrictEqual({ dmId: expect.any(Number) });
  });
});

// Anthony
describe('dm/list/v2 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Invalid token ', () => {
    expect(requestDmListV2('Invalid Token')).toEqual(403);
  });

  test('Valid token', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'p@ssThew0rd', 'Aemond', 'Targaryen');
    const dm = requestDmCreateV2(user.token, []);
    const result = requestDmListV2(user.token);
    expect(result).toStrictEqual({
      dms: [
        {
          dmId: dm.dmId,
          name: expect.any(String),
        }
      ]
    }
    );
  });

  test('Valid token - mulitple channels', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'p@ssThew0rd', 'Aemond', 'Targaryen');
    const user2 = requestRegisterV3('someoneElsesemail@gmail.com', 'pasteP0tPie', 'Visenya', 'Targaryen');
    const dm1 = requestDmCreateV2(user.token, []);
    const dm2 = requestDmCreateV2(user2.token, [user.authUserId]);
    const result = requestDmListV2(user.token);
    expect(result).toStrictEqual({
      dms: [
        {
          dmId: dm1.dmId,
          name: expect.any(String),
        },
        {
          dmId: dm2.dmId,
          name: expect.any(String),
        }
      ]
    }
    );
  });
});

// Ant
describe('message/senddm/v2 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('token invalid', () => {
    expect(requestSendDm('invalidToken', 1, 'so sleepy')).toEqual(403);
  });
  test('dmId not valid', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    expect(requestSendDm(user.token, 1, 'when will this be over?')).toEqual(400);
  });
  test('dmId valid, user not a member', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const user2 = requestRegisterV3('someotheremail@gmail.com', 'PassTheWord', 'Baelor', 'Targaryen');
    const dm = requestDmCreateV2(user.token, []);
    expect(requestSendDm(user2.token, dm.dmId, 'I gotta studdyt for math')).toEqual(403);
  });
  test('Empty message', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const user2 = requestRegisterV3('someotheremail@gmail.com', 'PassTheWord', 'Baelor', 'Targaryen');
    const dm = requestDmCreateV2(user.token, [user2.authUserId]);
    expect(requestSendDm(user.token, dm.dmId, '')).toEqual(400);
  });
  test('message greater than 1000 characters', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const user2 = requestRegisterV3('someotheremail@gmail.com', 'PassTheWord', 'Baelor', 'Targaryen');
    const dm = requestDmCreateV2(user.token, [user2.authUserId]);
    expect(requestSendDm(user.token, dm.dmId, 'BLAHHHHHHHHH'.repeat(110))).toEqual(400);
  });
  test('Valid input', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const user2 = requestRegisterV3('someotheremail@gmail.com', 'PassTheWord', 'Baelor', 'Targaryen');
    const dm = requestDmCreateV2(user.token, [user2.authUserId]);
    expect(requestSendDm(user.token, dm.dmId, 'BLAHHHHHHHHH')).toStrictEqual({ messageId: expect.any(Number) });
  });
});

// Alison
describe('dm/remove/v1 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test(' dmId does not refer to a valid DM ', () => {
    requestRegisterV3('someemail@gmail.com', 'RandomPa@ssword', 'Carl', 'Lenny');
    const user2 = requestRegisterV3('someemail2@gmail.com', 'RandomPassword', 'Carl2', 'Lenny2');
    const token = requestLoginV3('someemail@gmail.com', 'RandomPa@ssword');
    requestDmCreateV2(token.token, [user2.authUserId]);
    const result = requestDmRemoveV2(token.token, 42);
    expect(result).toStrictEqual(400);
  });

  test('dmId is valid but not the origin dm creator ', () => {
    requestRegisterV3('someemail@gmail.com', 'RandomPa@ssword', 'Carl', 'Lenny');
    const user2 = requestRegisterV3('someemail2@gmail.com', 'RandomPassword', 'Carl2', 'Lenny2');
    const user3 = requestRegisterV3('someemail3@gmail.com', 'RandomPassword', 'Carl3', 'Lenny3');
    const token = requestLoginV3('someemail@gmail.com', 'RandomPa@ssword');
    const dm = requestDmCreateV2(token.token, [user2.authUserId, user3.authUserId]);
    // creator is user1.token, not user2.token
    const result = requestDmRemoveV2(user2.token, dm.dmId);
    expect(result).toStrictEqual(403);
  });

  test(' dmId is valid but authorised user is no longer in the DM', () => {
    requestRegisterV3('someemail@gmail.com', 'RandomPa@ssword', 'Carl', 'Lenny');
    const user2 = requestRegisterV3('someemail2@gmail.com', 'RandomPassword', 'Carl2', 'Lenny2');
    const user3 = requestRegisterV3('someemail3@gmail.com', 'RandomPassword', 'Carl3', 'Lenny3');
    const token = requestLoginV3('someemail@gmail.com', 'RandomPa@ssword');
    const dm = requestDmCreateV2(token.token, [user2.authUserId, user3.authUserId]);
    // auhotised is remove from the dm here
    requestDmLeaveV2(token.token, dm.dmId);
    const result = requestDmRemoveV2(token.token, dm.dmId);
    expect(result).toStrictEqual(403);
  });

  test(' token is not valid', () => {
    requestRegisterV3('someemail@gmail.com', 'RandomPa@ssword', 'Carl', 'Lenny');
    const user2 = requestRegisterV3('someemail2@gmail.com', 'RandomPassword', 'Carl2', 'Lenny2');
    const token = requestLoginV3('someemail@gmail.com', 'RandomPa@ssword');
    const dm = requestDmCreateV2(token.token, [user2.authUserId]);
    const result = requestDmRemoveV2('abc', dm.dmId);
    expect(result).toStrictEqual(403);
  });

  test(' success delete owner with only 1 dms inside dms[]', () => {
    // register to get token
    requestRegisterV3('someemail1@gmail.com', 'RandomPa@ssword', 'Carl1', 'Lenny1');
    const user2 = requestRegisterV3('someemail2@gmail.com', 'RandomPa@ssword', 'Carl2', 'Lenny2');
    const user3 = requestRegisterV3('someemail3@gmail.com', 'RandomPa@ssword', 'Carl3', 'Lenny3');
    const token = requestLoginV3('someemail1@gmail.com', 'RandomPa@ssword');
    const uIds = [user2.authUserId, user3.authUserId];
    const dm = requestDmCreateV2(token.token, uIds);
    const result = requestDmRemoveV2(token.token, dm.dmId);
    expect(result).toStrictEqual({});
  });

  test(' success delete owner with 2 dms inside dms[]', () => {
    // register to get token
    requestRegisterV3('someemail1@gmail.com', 'RandomPa@ssword', 'Carl1', 'Lenny1');
    const user2 = requestRegisterV3('someemail2@gmail.com', 'RandomPa@ssword', 'Carl2', 'Lenny2');
    const user3 = requestRegisterV3('someemail3@gmail.com', 'RandomPa@ssword', 'Carl3', 'Lenny3');
    const token = requestLoginV3('someemail1@gmail.com', 'RandomPa@ssword');
    const uIds = [user2.authUserId, user3.authUserId];
    requestDmCreateV2(token.token, uIds);
    const dm = requestDmCreateV2(token.token, uIds);
    const result = requestDmRemoveV2(token.token, dm.dmId);
    expect(result).toStrictEqual({});
  });
});

// Alison
describe('dm/leave/v1 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test(' dmId does not refer to a valid DM ', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'RandomPa@ssword', 'Carl', 'Lenny');
    const result = requestDmLeaveV2(user.token, 42);
    expect(result).toEqual(400);
  });
  test(' dmId is valid, but token refer to id not member of dm ', () => {
    requestRegisterV3('someemail1@gmail.com', 'RandomPassword', 'Carl1', 'Lenny1');
    const user2 = requestRegisterV3('someemail2@gmail.com', 'RandomPassword', 'Carl2', 'Lenny2');
    const notMember = requestRegisterV3('someemail3@gmail.com', 'RandomPassword', 'Carl3', 'Lenny3');
    const token = requestLoginV3('someemail1@gmail.com', 'RandomPassword');
    const uIds = [user2.authUserId];
    const dm = requestDmCreateV2(token.token, uIds);
    const result = requestDmLeaveV2(notMember.token, dm.dmId);
    expect(result).toEqual(403);
  });
  test('token is not valid ', () => {
    requestRegisterV3('someemail1@gmail.com', 'RandomPassword', 'Carl1', 'Lenny1');
    const user2 = requestRegisterV3('someemail2@gmail.com', 'RandomPassword', 'Carl2', 'Lenny2');
    const token = requestLoginV3('someemail1@gmail.com', 'RandomPassword');
    const uIds = [user2.authUserId];
    const dm = requestDmCreateV2(token.token, uIds);
    const result = requestDmLeaveV2('abc', dm.dmId);
    expect(result).toEqual(403);
  });
  test('success deletemember', () => {
    // register to get token
    requestRegisterV3('someemail1@gmail.com', 'RandomPa@ssword', 'Carl1', 'Lenny1');
    const user2 = requestRegisterV3('someemail2@gmail.com', 'RandomPa@ssword', 'Carl2', 'Lenny2');
    const user3 = requestRegisterV3('someemail3@gmail.com', 'RandomPa@ssword', 'Carl3', 'Lenny3');
    const token = requestLoginV3('someemail1@gmail.com', 'RandomPa@ssword');
    const uIds = [user2.authUserId, user3.authUserId];
    const dm = requestDmCreateV2(token.token, uIds);
    const result = requestDmLeaveV2(user2.token, dm.dmId);
    expect(result).toStrictEqual({});
  });
  test(' success delete owner', () => {
    // register to get token
    requestRegisterV3('someemail1@gmail.com', 'RandomPa@ssword', 'Carl1', 'Lenny1');
    const user2 = requestRegisterV3('someemail2@gmail.com', 'RandomPa@ssword', 'Carl2', 'Lenny2');
    const user3 = requestRegisterV3('someemail3@gmail.com', 'RandomPa@ssword', 'Carl3', 'Lenny3');
    const token = requestLoginV3('someemail1@gmail.com', 'RandomPa@ssword');
    const uIds = [user2.authUserId, user3.authUserId];
    const dm = requestDmCreateV2(token.token, uIds);
    const result = requestDmLeaveV2(token.token, dm.dmId);
    expect(result).toStrictEqual({});
  });

  test(' success delete owner with 2 dms inside dms[]', () => {
    // register to get token
    requestRegisterV3('someemail1@gmail.com', 'RandomPa@ssword', 'Carl1', 'Lenny1');
    const user2 = requestRegisterV3('someemail2@gmail.com', 'RandomPa@ssword', 'Carl2', 'Lenny2');
    const user3 = requestRegisterV3('someemail3@gmail.com', 'RandomPa@ssword', 'Carl3', 'Lenny3');
    const token = requestLoginV3('someemail1@gmail.com', 'RandomPa@ssword');
    const uIds = [user2.authUserId, user3.authUserId];
    requestDmCreateV2(token.token, uIds);
    const dm = requestDmCreateV2(token.token, uIds);
    const result = requestDmLeaveV2(token.token, dm.dmId);
    expect(result).toStrictEqual({});
  });
});

// Ant
// token, dmId
//  name, members
describe('dm/details/v2 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('token Invalid ', () => {
    // nothing in datastore so any token is invalid
    expect(requestDmDetailsV2('notValid', 1)).toEqual(403);
  });

  test('dmId invalid', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    expect(requestDmDetailsV2(user.token, 1)).toEqual(400);
  });
  test('dmId valid, user not part of dm', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const user2 = requestRegisterV3('someotheremail@gmail.com', 'PassTheWord', 'Baelor', 'Targaryen');
    const dm = requestDmCreateV2(user.token, []);
    expect(requestDmDetailsV2(user2.token, dm.dmId)).toEqual(403);
  });

  test('Valid dmId and token', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const userDetails = requestUserProfileV3(user.token, user.authUserId);
    const dm = requestDmCreateV2(user.token, []);
    const result = requestDmDetailsV2(user.token, dm.dmId);
    expect(result).toStrictEqual({
      name: expect.any(String),
      members: [
        userDetails.user,
      ]
    });
  });

  test('Valid dmId and token - 2 members', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const user2 = requestRegisterV3('someotheremail@gmail.com', 'PassTheWord', 'Baelor', 'Targaryen');

    const userDetails = requestUserProfileV3(user.token, user.authUserId);
    const userDetails2 = requestUserProfileV3(user2.token, user2.authUserId);

    const dm = requestDmCreateV2(user.token, [user2.authUserId]);
    const result = requestDmDetailsV2(user2.token, dm.dmId);
    expect(result).toStrictEqual({
      name: expect.any(String),
      members: [
        userDetails.user,
        userDetails2.user,
      ]
    });
  });
});

// Anthony
describe('dm/messages/v2 Tests', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('token invalid', () => {
    expect(requestMessagesDm('invalidToken', 1, 3)).toEqual(403);
  });
  test('dmId invalid', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const result = requestMessagesDm(user.token, 1, 10);
    expect(result).toEqual(400);
  });
  test('start greater than total number of messages in channel ', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const user2 = requestRegisterV3('someotheremail@gmail.com', 'PassTheWord', 'Baelor', 'Targaryen');
    const dm = requestDmCreateV2(user.token, [user2.authUserId]);
    requestSendDm(user.token, dm.dmId, 'BLAHHAHAHH');
    const result = requestMessagesDm(user.token, dm.dmId, 4);
    expect(result).toEqual(400);
  });
  test('dmId is valid, user not member of dm', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const user2 = requestRegisterV3('someotheremail@gmail.com', 'PassTheWord', 'Baelor', 'Targaryen');
    const dm = requestDmCreateV2(user.token, []);
    requestSendDm(user.token, dm.dmId, 'BLAHHAHAHH');
    requestSendDm(user.token, dm.dmId, 'oaindiandiolaldalkkl');
    const result = requestMessagesDm(user2.token, dm.dmId, 0);
    expect(result).toEqual(403);
  });

  test('valid input - 10 message', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const user2 = requestRegisterV3('someotheremail@gmail.com', 'PassTheWord', 'Baelor', 'Targaryen');
    const dm = requestDmCreateV2(user.token, [user2.authUserId]);

    requestSendDm(user.token, dm.dmId, 'Is this how its supposed to look?');
    requestSendDm(user2.token, dm.dmId, 'How do you mean?');
    requestSendDm(user.token, dm.dmId, 'Like, do most recent messages start from the top or bottom');
    requestSendDm(user2.token, dm.dmId, 'You mean like in lab05 forum?');
    requestSendDm(user.token, dm.dmId, 'Yeah');
    requestSendDm(user2.token, dm.dmId, 'I dunno, ask Rahul or on the forum');
    requestSendDm(user.token, dm.dmId, 'ok');
    requestSendDm(user2.token, dm.dmId, 'If this passes then my part of the project will be finished');
    requestSendDm(user.token, dm.dmId, 'Great. What else is there to do');
    requestSendDm(user2.token, dm.dmId, 'I dunno');
    const result = requestMessagesDm(user.token, dm.dmId, 0);
    for (let i = 0; i < 10; i++) {
      expect(result.messages[i].messageId).toStrictEqual(expect.any(Number));
      expect(result.messages[i].uId).toStrictEqual(expect.any(Number));
      expect(result.messages[i].message).toStrictEqual(expect.any(String));
    }
    expect(result.start).toStrictEqual(0);
    expect(result.end).toStrictEqual(-1);
  });

  test('valid input - 10 message, different start index', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const user2 = requestRegisterV3('someotheremail@gmail.com', 'PassTheWord', 'Baelor', 'Targaryen');
    const dm = requestDmCreateV2(user.token, [user2.authUserId]);

    requestSendDm(user.token, dm.dmId, 'Is this how its supposed to look?');
    requestSendDm(user2.token, dm.dmId, 'How do you mean?');
    requestSendDm(user.token, dm.dmId, 'Like, do most recent messages start from the top or bottom');
    requestSendDm(user2.token, dm.dmId, 'You mean like in lab05 forum?');
    requestSendDm(user.token, dm.dmId, 'Yeah');
    requestSendDm(user.token, dm.dmId, 'Is this how its supposed to look?');
    requestSendDm(user2.token, dm.dmId, 'I dunno, ask Rahul or on the forum');
    requestSendDm(user.token, dm.dmId, 'ok');
    requestSendDm(user2.token, dm.dmId, 'If this passes then my part of the project will be finished');
    requestSendDm(user.token, dm.dmId, 'Great. What else is there to do');
    requestSendDm(user2.token, dm.dmId, 'I dunno');
    const result = requestMessagesDm(user.token, dm.dmId, 6);
    for (let i = 0; i < (10 - 6); i++) {
      expect(result.messages[i].messageId).toStrictEqual(expect.any(Number));
      expect(result.messages[i].uId).toStrictEqual(expect.any(Number));
      expect(result.messages[i].message).toStrictEqual(expect.any(String));
    }
    expect(result.start).toStrictEqual(6);
    expect(result.end).toStrictEqual(-1);
  });

  test('valid input - 60 messages, different start index at 15', () => {
    const user = requestRegisterV3('someemail@gmail.com', 'PassTheWord', 'Daeron', 'Targaryen');
    const user2 = requestRegisterV3('someotheremail@gmail.com', 'PassTheWord', 'Baelor', 'Targaryen');
    const dm = requestDmCreateV2(user.token, [user2.authUserId]);

    const messageArray = [];
    const timeArray = [];
    const result1 = [];
    const result2 = [];
    for (let i = 59; i >= 0; i--) {
      messageArray.unshift(requestSendDm(user.token, dm.dmId, `Should appear in position #${59 - i}`));
      timeArray.unshift(getTime());
      if (i < 50) {
        result1.unshift({
          messageId: messageArray[0].messageId,
          uId: user.authUserId,
          message: `Should appear in position #${59 - i}`,
          timeSent: timeArray[0],
          reacts: [{
            reactId: 1,
            uIds: [],
            isThisUserReacted: false,

          }],

        });
      }
      if (i >= 10 && i < 60) {
        result2.unshift({
          messageId: messageArray[0].messageId,
          uId: user.authUserId,
          message: `Should appear in position #${59 - i}`,
          timeSent: timeArray[0],
          reacts: [{
            reactId: 1,
            uIds: [],
            isThisUserReacted: false,
          }],
        });
      }
    }

    const input1 = requestMessagesDm(user.token, dm.dmId, 0);
    for (let i = 0; i < input1.messages.length; i++) {
      expect(input1.messages[i].timeSent).toBeGreaterThanOrEqual(result1[i].timeSent - 1);
      expect(input1.messages[i].timeSent).toBeLessThanOrEqual(result1[i].timeSent + 3);
      expect(input1.messages[i].messageId).toStrictEqual(result1[i].messageId);
      expect(input1.messages[i].message).toStrictEqual(result1[i].message);
      expect(input1.messages[i].uId).toStrictEqual(result1[i].uId);
    }
    expect(input1.start).toStrictEqual(0);
    expect(input1.end).toStrictEqual(50);

    const input2 = requestMessagesDm(user.token, dm.dmId, 10);
    for (let i = 0; i < input2.messages.length; i++) {
      expect(input2.messages[i].timeSent).toBeGreaterThanOrEqual(result2[i].timeSent - 1);
      expect(input2.messages[i].timeSent).toBeLessThanOrEqual(result2[i].timeSent + 3);
      expect(input2.messages[i].messageId).toStrictEqual(result2[i].messageId);
      expect(input2.messages[i].message).toStrictEqual(result2[i].message);
      expect(input2.messages[i].uId).toStrictEqual(result2[i].uId);
    }
    expect(input2.start).toStrictEqual(10);
    expect(input2.end).toStrictEqual(-1);
  });
});
