const config = require('config');
// modify config for unit test
config.Database = config.Unittest.Database;

const App = require('../app');
const supertest = require('supertest');
const shortId = require('../api/helpers/shortId');
const logger = require('../logger');
logger('unittest.log').switchToFile();
require('should');
const v1BasePath = config.App.v1Path;

describe('UserService', async function () {
  let request;
  let port = Math.floor(Math.random() * 10000);
  before(async function () {
    // initialize middleware - DB connect
    await App.start();
    request = supertest.agent(App.app).host(`http://localhost:${port}`).set({
      'X-Correlation-Id': shortId.generate(),
      'Content-Type': 'application/json'
    });
  });

  after(async function () {
    await App.stop();
  });

  afterEach(async function () {
    // delete all resources
    await request
      .delete(v1BasePath + '/users')
      .set('Accept', 'application/json')
      .expect(200);
  });

  function createReq() {
    return {
      name: `name${Math.floor(Math.random() * 10000)}`,
      age: Math.floor(Math.random() * 100),
      address: `Address ${Math.floor(Math.random() * 10000)}`,
      country: 'USA'
    };
  }

  async function bulkCreateUsers(count) {
    // create n users
    let promises = [];
    for (let index = 0; index < count; index++) {
      const promise = request
        .post(v1BasePath + '/users')
        .set('Accept', 'application/json')
        .send(createReq())
        .expect(200);
      promises.push(promise);
    }
    // resolve all promises
    await Promise.all(promises);
  }

  describe('CreateUpdateDelete', async function () {
    describe('GetUsers', async function () {
      it('FailAdditionalQueryParameter', async function () {
        await request
          .get(v1BasePath + '/users?skip=20&unknown=test')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400);
      });

      it('FailGetUserRandomId', async function () {
        // get all users
        let users = await request
          .get(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .expect(200);

        users.body.should.have.property('count', 0);
        users.body.should.have.property('values');
        users.body.values.length.should.be.eql(0);

        await request
          .get(v1BasePath + '/users/' + 'randomId')
          .set('Accept', 'application/json')
          .expect(404);
      });

      it('getUser', async function () {
        // get all users
        let users = await request
          .get(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .expect(200);

        users.body.should.have.property('count', 0);
        users.body.should.have.property('values');
        users.body.values.length.should.be.eql(0);

        const req = createReq();
        const res = await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(200);
        res.body.should.have.property('name', req.name);
        res.body.should.have.property('age', req.age);
        res.body.should.have.property('address', req.address);
        res.body.should.have.property('id');
        const userId = res.body.id;

        // get user and check properties
        let user = await request
          .get(v1BasePath + '/users/' + userId)
          .set('Accept', 'application/json')
          .send(req)
          .expect(200);
        user.body.should.have.property('name', req.name);
        user.body.should.have.property('age', req.age);
        user.body.should.have.property('address', req.address);
        user.body.should.have.property('id', userId);
      });

      it('getAllUsers', async function () {
        // get all users
        let users = await request
          .get(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .expect(200);

        users.body.should.have.property('count', 0);
        users.body.should.have.property('values');
        users.body.values.length.should.be.eql(0);
        const count = 3;
        await bulkCreateUsers(count);
        // get user and check properties
        users = await request
          .get(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .expect(200);

        users.body.should.have.property('count', count);
        users.body.should.have.property('values');
        users.body.values.length.should.be.eql(count);
      });
    });

    describe('CreateUser', async function () {
      it('FailCreateNoName', async function () {
        const req = createReq();
        delete req.name;
        await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(400);

        let users = await request
          .get(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .expect(200);

        users.body.should.have.property('count', 0);
        users.body.should.have.property('values');
        users.body.values.length.should.be.eql(0);
      });

      it('FailCreateInvalidName', async function () {
        const req = createReq();
        req.name = '$*name';
        await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(400);

        let users = await request
          .get(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .expect(200);

        users.body.should.have.property('count', 0);
        users.body.should.have.property('values');
        users.body.values.length.should.be.eql(0);
      });

      it('FailCreateNoAddress', async function () {
        const req = createReq();
        delete req.address;
        await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(400);

        let users = await request
          .get(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .expect(200);

        users.body.should.have.property('count', 0);
        users.body.should.have.property('values');
        users.body.values.length.should.be.eql(0);
      });

      it('FailCreateRandomAddress', async function () {
        const req = createReq();
        req.address = '$%Address';
        await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(400);

        let users = await request
          .get(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .expect(200);

        users.body.should.have.property('count', 0);
        users.body.should.have.property('values');
        users.body.values.length.should.be.eql(0);
      });

      it('FailCreateNoAge', async function () {
        const req = createReq();
        delete req.age;
        await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(400);

        let users = await request
          .get(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .expect(200);

        users.body.should.have.property('count', 0);
        users.body.should.have.property('values');
        users.body.values.length.should.be.eql(0);
      });

      it('FailCreateRandomAge', async function () {
        const req = createReq();
        req.age = -1; // min age is 0
        await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(400);
        req.age = 151; //max age is 150
        await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(400);

        req.age = '150'; // age should be a string
        await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(400);

        let users = await request
          .get(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .expect(200);

        users.body.should.have.property('count', 0);
        users.body.should.have.property('values');
        users.body.values.length.should.be.eql(0);
      });

      it('createUser', async function () {
        const req = createReq();
        const res = await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(200);
        res.body.should.have.property('name', req.name);
        res.body.should.have.property('age', req.age);
        res.body.should.have.property('address', req.address);
        res.body.should.have.property('id');
        const userId = res.body.id;
        // get user and check properties
        const user = await request
          .get(v1BasePath + '/users/' + userId)
          .set('Accept', 'application/json')
          .send(req)
          .expect(200);
        user.body.should.have.property('name', req.name);
        user.body.should.have.property('age', req.age);
        user.body.should.have.property('address', req.address);
        user.body.should.have.property('id', userId);
      });

      it('createUserWithoutCountry', async function () {
        const req = createReq();
        delete req.country;
        const res = await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(200);
        res.body.should.have.property('name', req.name);
        res.body.should.have.property('age', req.age);
        res.body.should.not.have.property('country');
        res.body.should.have.property('id');
        const userId = res.body.id;
        // get user and check properties
        const user = await request
          .get(v1BasePath + '/users/' + userId)
          .set('Accept', 'application/json')
          .send(req)
          .expect(200);
        user.body.should.have.property('name', req.name);
        user.body.should.have.property('age', req.age);
        res.body.should.not.have.property('country');
        user.body.should.have.property('id', userId);
      });
    });

    describe('UpdateUser', async function () {
      it('FailUpdateRandomUser', async function () {
        const req = createReq();
        await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(200);

        const userNamePatchReq = {
          name: 'someRandomName'
        };
        await request
          .patch(v1BasePath + '/users/' + 'randomUserId')
          .set('Accept', 'application/json')
          .send(userNamePatchReq)
          .expect(404);
      });

      it('UpdateUser', async function () {
        const req = createReq();
        const res = await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(200);
        const userId = res.body.id;

        // update name
        const userNamePatchReq = {
          name: 'someRandomName'
        };
        await request
          .patch(v1BasePath + '/users/' + userId)
          .set('Accept', 'application/json')
          .send(userNamePatchReq)
          .expect(200);
        // get user and check name
        let user = await request
          .get(v1BasePath + '/users/' + userId)
          .set('Accept', 'application/json')
          .expect(200);
        user.body.should.have.property('name', userNamePatchReq.name);
        user.body.should.have.property('age', req.age);
        user.body.should.have.property('address', req.address);
        user.body.should.have.property('id', userId);

        // update age
        const userAgePatchReq = {
          age: 12
        };
        await request
          .patch(v1BasePath + '/users/' + userId)
          .set('Accept', 'application/json')
          .send(userAgePatchReq)
          .expect(200);
        // get user and check age
        user = await request
          .get(v1BasePath + '/users/' + userId)
          .set('Accept', 'application/json')
          .expect(200);
        user.body.should.have.property('name', userNamePatchReq.name);
        user.body.should.have.property('age', userAgePatchReq.age);
        user.body.should.have.property('address', req.address);
        user.body.should.have.property('id', userId);

        // update address
        const updateAddressPatchReq = {
          address: 'some Address'
        };
        await request
          .patch(v1BasePath + '/users/' + userId)
          .set('Accept', 'application/json')
          .send(updateAddressPatchReq)
          .expect(200);
        // get user and check address
        user = await request
          .get(v1BasePath + '/users/' + userId)
          .set('Accept', 'application/json')
          .expect(200);
        user.body.should.have.property('name', userNamePatchReq.name);
        user.body.should.have.property('age', userAgePatchReq.age);
        user.body.should.have.property(
          'address',
          updateAddressPatchReq.address
        );
        user.body.should.have.property('id', userId);
      });
    });

    describe('DeleteUsers', async function () {
      it('FailDeleteUserRandomId', async function () {
        const req = createReq();
        const res = await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(200);
        res.body.should.have.property('name', req.name);
        res.body.should.have.property('age', req.age);
        res.body.should.have.property('address', req.address);
        res.body.should.have.property('id');
        const userId = res.body.id;

        await request
          .delete(v1BasePath + '/users/' + 'randomId')
          .set('Accept', 'application/json')
          .expect(404);
        // get user again and check
        await request
          .get(v1BasePath + '/users/' + userId)
          .set('Accept', 'application/json')
          .expect(200);
      });

      it('DeleteUser', async function () {
        const req = createReq();
        let res = await request
          .post(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .send(req)
          .expect(200);
        res.body.should.have.property('name', req.name);
        res.body.should.have.property('age', req.age);
        res.body.should.have.property('address', req.address);
        res.body.should.have.property('id');
        const userId = res.body.id;

        await request
          .delete(v1BasePath + '/users/' + userId)
          .set('Accept', 'application/json')
          .expect(204);
        // get user and fail
        await request
          .get(v1BasePath + '/users/' + userId)
          .set('Accept', 'application/json')
          .expect(404);
        // get all users
        res = await request
          .get(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .expect(200);
        res.body.should.have.property('count', 0);
        res.body.should.have.property('values');
        res.body.values.length.should.be.eql(0);
      });

      it('DeleteAllUsers', async function () {
        const count = 3;
        await bulkCreateUsers(count);

        let res = await request
          .get(v1BasePath + '/users')
          .set('Accept', 'application/json')
          .expect(200);
        res.body.should.have.property('count', count);
        res.body.should.have.property('values');
        res.body.values.length.should.be.eql(count);
      });
    });
  });
});
