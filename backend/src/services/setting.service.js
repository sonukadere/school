import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';

const SETTINGS_ID = 'school-settings';

const normalize = (data) => {
  const cleaned = { ...data };
  for (const key of Object.keys(cleaned)) {
    if (cleaned[key] === '') cleaned[key] = null;
  }
  return cleaned;
};

/**
 * Return the school settings record. Creates a default one on first access.
 */
export async function getSettings() {
  let settings = await prisma.setting.findFirst({ where: { deletedAt: null } });
  if (!settings) {
    settings = await prisma.setting.create({
      data: {
        id: SETTINGS_ID,
        schoolName: 'My School',
        academicYear: String(new Date().getFullYear()),
      },
    });
  }
  return settings;
}

export async function updateSettings(data) {
  const cleaned = normalize(data);
  const existing = await prisma.setting.findFirst({ where: { deletedAt: null } });
  if (!existing) {
    return prisma.setting.create({
      data: { id: SETTINGS_ID, schoolName: cleaned.schoolName ?? 'My School', ...cleaned },
    });
  }
  return prisma.setting.update({ where: { id: existing.id }, data: cleaned });
}

export async function updateLogo(logoPath) {
  const existing = await prisma.setting.findFirst({ where: { deletedAt: null } });
  if (!existing) {
    throw ApiError.notFound('Settings have not been created yet.');
  }
  return prisma.setting.update({ where: { id: existing.id }, data: { schoolLogo: logoPath } });
}
