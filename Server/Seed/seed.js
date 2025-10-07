import mongoose from 'mongoose';
import Role from '../Models/RoleModel.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const seedRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const roles = [
      { name: 'Yogesh Venugopal', email: 'yogeshvenugopal875@gmail.com', role: 'Admin', batch: 2023 },
      { name: 'Mitun Kumar', email: 'mitun.7557@gmail.com', role: 'Admin', batch: 2023 },
      { name: 'Ranjith', email: 'mranjith2506@gmail.com', role: 'Admin', batch: 2023 },
    ];
    
    await Role.insertMany(roles);
    console.log('Roles seeded successfully');
  } catch (error) {
    console.error('Error seeding roles:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedRoles();