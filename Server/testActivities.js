import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Activity from './Models/ActivityModel.js';

dotenv.config();

const createTestActivities = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project_management');

    // Create some test activities
    const testActivities = [
      {
        user: '507f1f77bcf86cd799439011', // Mock user ID
        action: 'created',
        entityType: 'meeting',
        entityId: '507f1f77bcf86cd799439012',
        entityTitle: 'Team Standup Meeting',
        description: 'Created meeting notes: "Team Standup Meeting"'
      },
      {
        user: '507f1f77bcf86cd799439011',
        action: 'updated',
        entityType: 'blog',
        entityId: '507f1f77bcf86cd799439013',
        entityTitle: 'Project Update Blog',
        description: 'Updated blog post: "Project Update Blog"'
      },
      {
        user: '507f1f77bcf86cd799439011',
        action: 'completed',
        entityType: 'project',
        entityId: '507f1f77bcf86cd799439014',
        entityTitle: 'Website Redesign',
        description: 'Completed project: "Website Redesign"'
      }
    ];

    await Activity.insertMany(testActivities);
    console.log('Test activities created successfully');

    // Close connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error creating test activities:', error);
    process.exit(1);
  }
};

createTestActivities();