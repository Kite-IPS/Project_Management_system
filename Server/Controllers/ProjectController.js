import Project from "../Models/ProjectModel.js";
import User from "../Models/UserModel.js"; // Updated import path
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";

// Simplified validation rules for project creation/update
export const validateProject = [
  body("projectName")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Project name is required"),

  body("status")
    .isIn(["Planning", "In Progress", "Completed", "On Hold"])
    .withMessage("Invalid status"),

  body("teamMembers")
    .isArray({ min: 1 })
    .withMessage("At least one team member is required")
    .custom((value) => {
      // Check if all team members are valid ObjectIds
      for (const member of value) {
        if (!mongoose.Types.ObjectId.isValid(member)) {
          throw new Error(`Invalid team member ID: ${member}`);
        }
      }
      return true;
    }),

  body("startDate")
    .notEmpty()
    .withMessage("Start date is required"),

  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .custom((value, { req }) => {
      // Simple string comparison for YYYY-MM-DD format
      if (value <= req.body.startDate) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("paperWork")
    .optional({ nullable: true, checkFalsy: true }),

  body("projectTrack")
    .optional({ nullable: true, checkFalsy: true }),

  body("repository")
    .optional({ nullable: true, checkFalsy: true }),
];

// Role-based access control helper (updated for your system)
const checkPermissions = (userRole, action) => {
  const permissions = {
    Admin: { read: true, write: true, update: true, delete: true, view: true },
    Manager: {
      read: true,
      write: true,
      update: true,
      delete: false,
      view: true,
    },
    SPOC: {
      read: true,
      write: true,
      update: true,
      delete: false,
      view: true,
    },
    Member: {
      read: true,
      write: false,
      update: false,
      delete: false,
      view: true,
    },
  };

  const userPermissions = permissions[userRole] || permissions.Member;
  return userPermissions[action] || false;
};

// Get all projects
export const getProjects = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Check if user has view permission
    if (!checkPermissions(userRole, "view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view projects",
      });
    }

    const projects = await Project.find()
      .populate("teamMembers", "displayName email") // Updated to match your User model
      .populate("createdBy", "displayName email")
      .populate("updatedBy", "displayName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: projects,
      message: "Projects retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching projects",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get single project by ID
export const getProjectById = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Check if user has view permission
    if (!checkPermissions(userRole, "view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view projects",
      });
    }

    const project = await Project.findById(req.params.id)
      .populate("teamMembers", "displayName email") // Updated to match your User model
      .populate("createdBy", "displayName email")
      .populate("updatedBy", "displayName email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      data: project,
      message: "Project retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Create new project
export const createProject = async (req, res) => {
  try {
    console.log("Request body:", JSON.stringify(req.body, null, 2)); // Pretty print the request body
    const userRole = req.user.role;
    console.log("User role:", userRole); // Add this for debugging

    // Log team members specifically
    console.log("Team members:", req.body.teamMembers);

    // Check if user has write permission
    if (!checkPermissions(userRole, "write")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create projects",
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errArray = errors.array();
      console.log("Validation errors:", errArray);
      return res.status(400).json({
        success: false,
        message: errArray.map((err) => `${err.path}: ${err.msg}`).join(", "),
        errors: errArray,
      });
    }

    const {
      projectName,
      status,
      teamMembers,
      startDate,
      endDate,
      paperWork,
      projectTrack,
      repository,
    } = req.body;

    // Create new project without verifying team members first
    const newProject = new Project({
      projectName,
      status,
      teamMembers,
      startDate,
      endDate,
      paperWork: paperWork || "",
      projectTrack: projectTrack || "",
      repository: repository || "",
      createdBy: req.user.userId,
    });

    await newProject.save();

    // Populate the created project
    const populatedProject = await Project.findById(newProject._id)
      .populate("teamMembers", "displayName email")
      .populate("createdBy", "displayName email");

    res.status(201).json({
      success: true,
      data: populatedProject,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Error creating project:", error);

    res.status(500).json({
      success: false,
      message: "Error creating project",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update project
// Update project - Simple version that should work
export const updateProject = async (req, res) => {
  try {
    console.log("Update request received");
    console.log("Body:", req.body);
    
    const userRole = req.user.role;

    // Check if user has update permission
    if (!checkPermissions(userRole, "update")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update projects",
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const projectId = req.params.id;

    // Check if project exists
    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Prepare update data
    const updateData = {
      ...req.body,
      updatedBy: req.user.userId,
      updatedAt: new Date(),
    };

    // Remove undefined or null values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    // Update project
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $set: updateData },
      { new: true, runValidators: false } // Disable Mongoose validators for now
    )
      .populate("teamMembers", "displayName email")
      .populate("createdBy", "displayName email")
      .populate("updatedBy", "displayName email");

    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found after update",
      });
    }

    console.log("Project updated successfully");

    res.status(200).json({
      success: true,
      data: updatedProject,
      message: "Project updated successfully",
    });
  } catch (error) {
    console.error("Error updating project:", error);

    // Handle duplicate project name
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A project with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating project",
      error: error.message,
    });
  }
};

// Delete project (only for Admin)
export const deleteProject = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Only Admin can delete projects
    if (userRole !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete projects",
      });
    }

    const projectId = req.params.id;

    // Check if project exists
    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await Project.findByIdAndDelete(projectId);

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting project",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get project statistics
export const getProjectStats = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Check if user has view permission
    if (!checkPermissions(userRole, "view")) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view project statistics",
      });
    }

    const stats = await Project.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({
      status: { $in: ["Planning", "In Progress"] },
    });

    const formattedStats = {
      total: totalProjects,
      active: activeProjects,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id.toLowerCase().replace(" ", "_")] = stat.count;
        return acc;
      }, {}),
    };

    res.status(200).json({
      success: true,
      data: formattedStats,
      message: "Project statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching project statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
