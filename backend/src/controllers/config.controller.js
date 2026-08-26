import configService from '../services/config.service.js';

export const getPublicConfig = async (req, res, next) => {
  try {
    const config = await configService.getPublicConfig();
    return res.status(200).json({
      success: true,
      config,
    });
  } catch (error) {
    next(error);
  }
};

export const getFullConfig = async (req, res, next) => {
  try {
    const config = await configService.getFullConfig();
    return res.status(200).json({
      success: true,
      config,
    });
  } catch (error) {
    next(error);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const updated = await configService.updateConfig(req.body, req.user, req);
    return res.status(200).json({
      success: true,
      message: `System configuration updated to v${updated.version}.`,
      config: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const restoreConfigVersion = async (req, res) => {
  try {
    const restored = await configService.restoreConfigVersion(
      req.params.version,
      req.user,
      req
    );
    return res.status(200).json({
      success: true,
      message: `Restored configuration to state v${req.params.version}.`,
      config: restored,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
