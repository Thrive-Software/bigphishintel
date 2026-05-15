import SenderProfile from '../models/SenderProfile.js';
import { verifySMTP } from '../services/smtpService.js';

const stripPassword = (profile) => {
  if (!profile) return profile;
  const obj = profile.toObject ? profile.toObject() : { ...profile };
  delete obj.password;
  return obj;
};

// Create a new Sender Profile
export const createSenderProfile = async (req, res) => {
  try {
    const { senderName, email, host, port, secure, password, fromAddress, replyTo } = req.body;

    // Verify SMTP details before proceeding
    await verifySMTP({ host, port, secure, email, password });

    // Create a new sender profile with plain text password
    const senderProfile = new SenderProfile({
      senderName,
      email,
      host,
      port,
      secure,
      password, // Store password as plain text for now
      fromAddress,
      replyTo,
    });

    await senderProfile.save();

    res.status(201).json({
      success: true,
      message: 'Sender profile created successfully',
      data: stripPassword(senderProfile),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all Sender Profiles
export const getAllSenderProfiles = async (req, res) => {
  try {
    const senderProfiles = await SenderProfile.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: senderProfiles.map(stripPassword),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a specific Sender Profile by ID
export const getSenderProfileById = async (req, res) => {
  try {
    const senderProfile = await SenderProfile.findById(req.params.id);
    if (!senderProfile) {
      return res.status(404).json({
        success: false,
        message: 'Sender profile not found',
      });
    }
    res.status(200).json({
      success: true,
      data: stripPassword(senderProfile),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a Sender Profile
export const updateSenderProfile = async (req, res) => {
  try {
    const { senderName, email, host, port, secure, password, fromAddress, replyTo } = req.body;

    const existing = await SenderProfile.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Sender profile not found',
      });
    }

    // If no new password supplied, keep the stored one for both SMTP verification and persistence
    const effectivePassword = password && password.length > 0 ? password : existing.password;

    // Verify SMTP details before saving any changes
    await verifySMTP({ host, port, secure, email, password: effectivePassword });

    existing.senderName = senderName;
    existing.email = email;
    existing.host = host;
    existing.port = port;
    existing.secure = secure;
    existing.password = effectivePassword;
    existing.fromAddress = fromAddress;
    existing.replyTo = replyTo;

    await existing.save();

    res.status(200).json({
      success: true,
      message: 'Sender profile updated successfully',
      data: stripPassword(existing),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a Sender Profile
export const deleteSenderProfile = async (req, res) => {
  try {
    const senderProfile = await SenderProfile.findByIdAndDelete(req.params.id);
    if (!senderProfile) {
      return res.status(404).json({
        success: false,
        message: 'Sender profile not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Sender profile deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
