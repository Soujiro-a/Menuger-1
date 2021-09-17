const {
  Schema,
  model,
  Types: { ObjectId },
} = require('mongoose');

const bcrypt = require('bcrypt');
let saltRound = 3; //salt를 돌리는 횟수

const userSchema = new Schema(
  {
    type: { type: String, default: 'user', enum: ['user', 'admin'] },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nickname: { type: String, required: true, unique: true },
    image_url: String,
    subscription: { type: ObjectId, ref: 'user' },
  },
  { timestamps: true },
);

userSchema.pre('save', function (next) {
  const user = this;

  if (user.isModified('password')) {
    bcrypt.genSalt(saltRound, (err, salt) => {
      if (err) {
        return next(err);
      }
      bcrypt.hash(user.password, salt, (err, hashedPassword) => {
        if (err) {
          return next(err);
        }
        user.password = hashedPassword;
        next();
      });
    });
  } else {
    next();
  }
});

const User = model('user', userSchema);

module.exports = { User };
