import Role from '../Models/RoleModel.js';
import User from '../Models/UserModel.js';

// Helper function to get ordinal suffix
function getOrdinalSuffix(num) {
  const j = num % 10,
        k = num % 100;
  if (j == 1 && k != 11) {
    return 'st';
  }
  if (j == 2 && k != 12) {
    return 'nd';
  }
  if (j == 3 && k != 13) {
    return 'rd';
  }
  return 'th';
}

// Get all students (using Role model)
export const getAllStudents = async (req, res) => {
  try {
    const roles = await Role.find().sort({ assignedAt: -1 });

    // Get user details for each role
    const studentsWithDetails = await Promise.all(
      roles.map(async (role) => {
        const user = await User.findOne({ email: role.email });
        const currentYear = new Date().getFullYear();
        const yearsSinceBatch = currentYear - role.batch;
        const year = yearsSinceBatch + 1;

        let yearString;
        if (year <= 4 && year > 0) {
          yearString = `${year}${getOrdinalSuffix(year)} Year`;
        } else if (year > 4) {
          yearString = 'Alumni';
        } else {
          yearString = 'Not Started';
        }

        return {
          id: role._id,
          email: role.email,
          name: user?.displayName || role.email.split('@')[0],
          role: role.role,
          batch: role.batch,
          year: yearString,
          assignedBy: role.assignedBy,
          assignedAt: role.assignedAt
        };
      })
    );

    res.status(200).json({
      success: true,
      data: studentsWithDetails,
      count: studentsWithDetails.length
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};

// Get student by ID (using Role model)
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const user = await User.findOne({ email: role.email });
    const currentYear = new Date().getFullYear();
    const yearsSinceBatch = currentYear - role.batch;
    const yearNum = yearsSinceBatch + 1;

    let yearString;
    if (yearNum <= 4 && yearNum > 0) {
      yearString = `${yearNum}${getOrdinalSuffix(yearNum)} Year`;
    } else if (yearNum > 4) {
      yearString = 'Alumni';
    } else {
      yearString = 'Not Started';
    }

    const memberData = {
      id: role._id,
      email: role.email,
      name: user?.displayName || role.email.split('@')[0],
      role: role.role,
      batch: role.batch,
      year: yearString,
      assignedBy: role.assignedBy,
      assignedAt: role.assignedAt
    };

    res.status(200).json({
      success: true,
      data: memberData
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching member',
      error: error.message
    });
  }
};

// Add new member (Admin only)
export const addMember = async (req, res) => {
  try {
    const { email, role, batch, name } = req.body;

    // For now, skip admin check for testing
    // TODO: Implement proper admin check
    
    // Check if member already exists
    const existingRole = await Role.findOne({ email });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Member already exists'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user entry
    const user = new User({
      email,
      displayName: name,
      role: 'Member'
    });
    await user.save();

    // Create role entry
    const roleEntry = new Role({
      name,
      email,
      role,
      batch,
      assignedBy: req.user?.email || 'system'
    });
    await roleEntry.save();

    // Calculate year for response
    const currentYear = new Date().getFullYear();
    const yearsSinceBatch = currentYear - batch;
    const yearNum = yearsSinceBatch + 1;
    let yearString;
    if (yearNum <= 4 && yearNum > 0) {
      yearString = `${yearNum}${getOrdinalSuffix(yearNum)} Year`;
    } else if (yearNum > 4) {
      yearString = 'Alumni';
    } else {
      yearString = 'Not Started';
    }

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: {
        id: roleEntry._id,
        email,
        name,
        role,
        batch,
        year: yearString,
        assignedBy: req.user?.email || 'system',
        assignedAt: roleEntry.assignedAt
      }
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding member',
      error: error.message
    });
  }
};

// Remove member (Admin only)
export const removeMember = async (req, res) => {
  try {
    const { email } = req.params;

    // Remove from Role collection
    await Role.findOneAndDelete({ email });

    // Remove from User collection
    await User.findOneAndDelete({ email });

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing member',
      error: error.message
    });
  }
};

// Update member role (Admin only)
export const updateMemberRole = async (req, res) => {
  try {
    const { email } = req.params;
    const { role } = req.body;

    // Update role in Role collection
    await Role.findOneAndUpdate({ email }, { role });

    // Get updated member data
    const updatedRole = await Role.findOne({ email });
    const user = await User.findOne({ email });

    const currentYear = new Date().getFullYear();
    const yearsSinceBatch = currentYear - updatedRole.batch;
    const yearNum = yearsSinceBatch + 1;
    let yearString;
    if (yearNum <= 4 && yearNum > 0) {
      yearString = `${yearNum}${getOrdinalSuffix(yearNum)} Year`;
    } else if (yearNum > 4) {
      yearString = 'Alumni';
    } else {
      yearString = 'Not Started';
    }

    const memberData = {
      id: updatedRole._id,
      email: updatedRole.email,
      name: user?.displayName || updatedRole.email.split('@')[0],
      role: updatedRole.role,
      batch: updatedRole.batch,
      year: yearString,
      assignedBy: updatedRole.assignedBy,
      assignedAt: updatedRole.assignedAt
    };

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: memberData
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating role',
      error: error.message
    });
  }
};
