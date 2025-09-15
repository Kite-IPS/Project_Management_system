import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../Models/RoleModel.js';

dotenv.config();

async function normalizeEmails() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all roles
    const roles = await Role.find({});
    console.log('Found roles:', roles);

    // Update each role to ensure email is normalized
    for (const role of roles) {
      const normalizedEmail = role.email.toLowerCase().trim();
      if (normalizedEmail !== role.email) {
        console.log(`Normalizing email: ${role.email} -> ${normalizedEmail}`);
        role.email = normalizedEmail;
        await role.save();
      }
    }

    console.log('Email normalization complete');
    
    // Show final state
    const updatedRoles = await Role.find({});
    console.log('Current roles:', updatedRoles);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

normalizeEmails();