import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['Super Admin', 'Operations', 'Finance', 'Support'],
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  permissions: [{
    module: {
      type: String,
      required: true
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'approve']
    }]
  }],
  profileImage: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  }
}, {
  timestamps: true
});

// Hash password before saving
adminUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminUserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
adminUserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model('AdminUser', adminUserSchema);