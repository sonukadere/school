import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { notDeleted } from '../utils/helpers.js';

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
  let settings = await prisma.setting.findFirst({ where: notDeleted() });
  if (!settings) {
    settings = await prisma.setting.create({
      data: {
        id: SETTINGS_ID,
        schoolName: 'Daily Day Academy',
        academicYear: String(new Date().getFullYear()),
        timetableStartTime: '08:00',
        timetableEndTime: '14:00',
        periodDuration: 45,
        totalPeriods: 7,
        breakStartTime: '10:15',
        breakEndTime: '10:30',
        workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      },
    });
  }
  return {
    ...settings,
    timetableStartTime: settings.timetableStartTime || '08:00',
    timetableEndTime: settings.timetableEndTime || '14:00',
    periodDuration: settings.periodDuration || 45,
    totalPeriods: settings.totalPeriods || 7,
    breakStartTime: settings.breakStartTime || '10:15',
    breakEndTime: settings.breakEndTime || '10:30',
    workingDays: settings.workingDays?.length ? settings.workingDays : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
  };
}

export async function updateSettings(data) {
  const cleaned = normalize(data);
  const existing = await prisma.setting.findFirst({ where: notDeleted() });
  if (!existing) {
    return prisma.setting.create({
      data: { id: SETTINGS_ID, schoolName: cleaned.schoolName ?? 'Daily Day Academy', ...cleaned },
    });
  }
  return prisma.setting.update({ where: { id: existing.id }, data: cleaned });
}

export async function updateLogo(logoPath) {
  const existing = await prisma.setting.findFirst({ where: notDeleted() });
  if (!existing) {
    throw ApiError.notFound('Settings have not been created yet.');
  }
  return prisma.setting.update({ where: { id: existing.id }, data: { schoolLogo: logoPath } });
}
