import {
  requestRegisterV3,
  requestSetEmailV2,
  requestSetHandleV2,
  requestSetNameV2,
  requestClearV1
} from './testRequestRoutes';

describe('user/profile/sethandle/v2', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Length to Short Error', () => {
    const user1 = requestRegisterV3('test@test.com', 'password', 'Test', 'User');
    expect(requestSetHandleV2(user1.token, 'tt')).toEqual(400);
  });

  test('Length to Long Error', () => {
    const user1 = requestRegisterV3('test@test.com', 'password', 'Test', 'User');
    expect(requestSetHandleV2(user1.token, 't'.repeat(21))).toEqual(400);
  });

  test('Handle Not AlphaNumeric', () => {
    const user1 = requestRegisterV3('test@test.com', 'password', 'Test', 'User');
    expect(requestSetHandleV2(user1.token, '-----')).toEqual(400);
  });

  test('Handle already Taken', () => {
    const user1 = requestRegisterV3('test@test.com', 'password', 'Test', 'User');
    const user2 = requestRegisterV3('test2@test.com', 'password', 'Test', 'User2');
    expect(requestSetHandleV2(user2.token, 'testHandle')).toStrictEqual({});
    expect(requestSetHandleV2(user1.token, 'testHandle')).toEqual(400);
  });

  test('Token Invalid', () => {
    expect(requestSetHandleV2('token', 'testHandle')).toEqual(403);
  });

  test('Handle Set Success', () => {
    const user1 = requestRegisterV3('test@test.com', 'password', 'Test', 'User');
    expect(requestSetHandleV2(user1.token, 'testHandle')).toStrictEqual({});
  });
});

describe('user/profile/setemail/v2', () => {
  beforeEach(() => {
    requestClearV1();
  });

  afterEach(() => {
    requestClearV1();
  });

  test('Token Invalid', () => {
    expect(requestSetEmailV2('token', 'test@test.com')).toEqual(403);
  });

  test('Email Already Being Used', () => {
    requestRegisterV3('test@test.com', 'password', 'Test', 'User');
    const user2 = requestRegisterV3('test2@test.com', 'password', 'Test', 'User2');
    expect(requestSetEmailV2(user2.token, 'test@test.com')).toEqual(400);
  });

  test('Not an Email', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'Test', 'User');
    expect(requestSetEmailV2(user1.token, 'notanemail')).toEqual(400);
  });

  test('Success Email Set', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'Test', 'User');
    expect(requestSetEmailV2(user1.token, 'test@test.com')).toStrictEqual({ });
  });
});

describe('user/profile/setname/v2', () => {
  beforeEach(() => {
    requestClearV1();
  });

  test('Token Invalid', () => {
    expect(requestSetNameV2('Token', 'first', 'last')).toEqual(403);
  });

  test('First Name Length Short', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'Test', 'User');
    expect(requestSetNameV2(user1.token, '', 'NewName')).toEqual(400);
  });

  test('First Name Length Long', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'Test', 'User');
    expect(requestSetNameV2(user1.token, 'N'.repeat(51), 'NewName')).toEqual(400);
  });

  test('Last Name Length Short', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'Test', 'User');
    expect(requestSetNameV2(user1.token, 'NewName', '')).toEqual(400);
  });

  test('Last Name Length Long', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'Test', 'User');
    expect(requestSetNameV2(user1.token, 'NewName', 'N'.repeat(51))).toEqual(400);
  });

  test('Success Set', () => {
    const user1 = requestRegisterV3('test1@test.com', 'password', 'Test', 'User');
    expect(requestSetNameV2(user1.token, 'NewName', 'NewName')).toStrictEqual({});
  });
});
