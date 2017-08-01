'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var UserSchema = new Schema({
	email: {
		type: String,
		lowercase: true,
		unique: true,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	profile: {
		firstName: { type: String },
		lastName: { type: String },
		status: { type: Number, enum: [5, 14, 40, 100, 200] },
		visible: { type: Boolean }
	},
	role: {
		type: String,
		enum: ['User', 'Admin'],
		default: 'User'
	},
	resetPasswordToken: { type: String },
	resetPasswordExpires: { type: Date }
}, {
	timestamps: true
});

// Pre-save of user to database, hash password if password is modified or new
UserSchema.pre('save', function (next) {
	const user = this;
	const SALT_FACTOR = 5;
	if (!user.isModified('password')) {
		return next();
	}

	bcrypt.genSalt(SALT_FACTOR, function (err, salt) {
		if (err) { return next(err); }

		bcrypt.hash(user.password, salt, null, function (err, hash) {
			if (err) { return next(err); }
			user.password = hash;
			next();
		});
	});
});

// Method to compare password for login
UserSchema.methods.comparePassword = function (candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
		if (err) { return cb(err); }
		cb(null, isMatch);
	});
};
module.exports = mongoose.model('User', UserSchema);
