const Datastore = require('@seald-io/nedb');
const path = require('path');

const usersDB = new Datastore({ filename: path.join(__dirname, 'users.db'), autoload: true });
const rolesDB = new Datastore({ filename: path.join(__dirname, 'roles.db'), autoload: true });

// Ensure unique index on email
usersDB.ensureIndex({ fieldName: 'email', unique: true });
rolesDB.ensureIndex({ fieldName: 'role', unique: true });

// Default role permissions — insert if not exist
const defaultRoles = [
  { role: 'admin',    categories: ['holiday','payday','birthday','meeting','company','deadline','personal','vacation'], label: 'Administrator' },
  { role: 'hr',       categories: ['holiday','payday','birthday','company','vacation'],                                 label: 'HR' },
  { role: 'manager',  categories: ['holiday','meeting','company','deadline','payday','vacation'],                       label: 'Manager' },
  { role: 'employee', categories: ['holiday','company','vacation'],                                                     label: 'Employee' },
];

defaultRoles.forEach(r => {
  rolesDB.findOne({ role: r.role }, (err, doc) => {
    if (!doc) rolesDB.insert(r);
  });
});

// Promisified helpers
const db = {
  users: {
    findByEmail: (email) => new Promise((res, rej) =>
      usersDB.findOne({ email }, (e, d) => e ? rej(e) : res(d))
    ),
    findById: (id) => new Promise((res, rej) =>
      usersDB.findOne({ _id: id }, (e, d) => e ? rej(e) : res(d))
    ),
    findAll: () => new Promise((res, rej) =>
      usersDB.find({}).sort({ name: 1 }).exec((e, d) => e ? rej(e) : res(d))
    ),
    upsert: (email, name) => new Promise((res, rej) => {
      usersDB.findOne({ email }, (err, existing) => {
        if (err) return rej(err);
        if (existing) {
          // User exists — update name and last_login only
          usersDB.update({ email }, { $set: { name, last_login: new Date() } }, { returnUpdatedDocs: true }, (e, _n, doc) => e ? rej(e) : res(doc));
        } else {
          // New user — insert with default employee role
          const newUser = { email, name, role: 'employee', created_at: new Date(), last_login: new Date() };
          usersDB.insert(newUser, (e, doc) => e ? rej(e) : res(doc));
        }
      });
    }),
    setRole: (id, role) => new Promise((res, rej) =>
      usersDB.update({ _id: id }, { $set: { role } }, {}, e => e ? rej(e) : res())
    ),
    delete: (id) => new Promise((res, rej) =>
      usersDB.remove({ _id: id }, {}, e => e ? rej(e) : res())
    ),
  },
  roles: {
    findAll: () => new Promise((res, rej) =>
      rolesDB.find({}).exec((e, d) => e ? rej(e) : res(d))
    ),
    findByRole: (role) => new Promise((res, rej) =>
      rolesDB.findOne({ role }, (e, d) => e ? rej(e) : res(d))
    ),
    updateCategories: (role, categories) => new Promise((res, rej) =>
      rolesDB.update({ role }, { $set: { categories } }, {}, e => e ? rej(e) : res())
    ),
  },
};

module.exports = db;
