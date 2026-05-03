import { Router, Request, Response } from 'express';
import DeviceToken from '../models/DeviceToken';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Register (or refresh) an Expo push token for the current user.
// Idempotent: token is unique, so a second call from the same device just
// rebinds it to whoever is now signed in.
router.post('/', async (req: Request, res: Response) => {
  const { expo_push_token, platform } = req.body || {};
  if (!expo_push_token || !platform) {
    return res.status(400).json({ message: 'expo_push_token and platform are required' });
  }
  if (!['ios', 'android'].includes(platform)) {
    return res.status(400).json({ message: 'platform must be ios or android' });
  }

  const existing = await DeviceToken.findOne({ where: { expo_push_token } });
  if (existing) {
    await existing.update({ user_id: req.user!.userId, platform });
    return res.json({ device: existing });
  }
  const created = await DeviceToken.create({
    user_id: req.user!.userId,
    expo_push_token,
    platform,
  });
  return res.status(201).json({ device: created });
});

router.delete('/:token', async (req: Request, res: Response) => {
  const row = await DeviceToken.findOne({
    where: { expo_push_token: req.params.token, user_id: req.user!.userId },
  });
  if (!row) return res.status(404).json({ message: 'Not found' });
  await row.destroy();
  return res.json({ ok: true });
});

export default router;
