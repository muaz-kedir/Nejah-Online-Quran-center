/** Fields allowed by CreateTeacherDto — keeps POST/PATCH bodies free of extras like confirmPassword or countryIsoCode. */
const CREATE_TEACHER_KEYS = [
  'fullName',
  'email',
  'password',
  'gender',
  'phoneNumber',
  'qualification',
  'specialization',
  'experience',
  'country',
  'city',
  'streetAddress',
  'dateOfBirth',
  'languages',
  'internetConnectionType',
  'qiratEducationLevel',
  'islamicEducationLevel',
  'teachingTimeAvailability',
  'marketingSource',
  'additionalComments',
  'status',
  'avatarUrl',
  'weeklySchedule',
  'hourlyRate',
  'monthlySalary',
  'teachingTopics',
  'notes',
] as const;

export type TeacherFormValues = Record<string, unknown>;

export type TeacherOtherFields = {
  languages?: string;
  internetConnectionType?: string;
  qiratEducationLevel?: string;
  islamicEducationLevel?: string;
  marketingSource?: string;
};

function applyOtherFieldOverrides(
  data: TeacherFormValues,
  otherStates?: TeacherOtherFields,
): TeacherFormValues {
  const result = { ...data };
  const languages = result.languages as string[] | undefined;

  if (result.internetConnectionType === 'Other' && otherStates?.internetConnectionType) {
    result.internetConnectionType = otherStates.internetConnectionType;
  }
  if (result.qiratEducationLevel === 'Other' && otherStates?.qiratEducationLevel) {
    result.qiratEducationLevel = otherStates.qiratEducationLevel;
  }
  if (result.islamicEducationLevel === 'Other' && otherStates?.islamicEducationLevel) {
    result.islamicEducationLevel = otherStates.islamicEducationLevel;
  }
  if (result.marketingSource === 'Other' && otherStates?.marketingSource) {
    result.marketingSource = otherStates.marketingSource;
  }
  if (languages?.includes('Other') && otherStates?.languages) {
    result.languages = [...languages.filter((l) => l !== 'Other'), otherStates.languages];
  }

  return result;
}

export function buildCreateTeacherPayload(
  formData: TeacherFormValues,
  options?: { otherStates?: TeacherOtherFields; includePassword?: boolean },
): Record<string, unknown> {
  const includePassword = options?.includePassword ?? true;
  const merged = applyOtherFieldOverrides({ ...formData }, options?.otherStates);

  const payload: Record<string, unknown> = {};
  for (const key of CREATE_TEACHER_KEYS) {
    if (!includePassword && key === 'password') continue;
    if (!(key in merged)) continue;
    const value = merged[key];
    if (value === undefined || value === null) continue;
    if (value === '' && key !== 'experience') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    payload[key] = value;
  }

  // Required for create — ensure they are present when provided in form state
  if (includePassword) {
    const password = merged.password;
    if (typeof password === 'string' && password) payload.password = password;
    if (typeof merged.fullName === 'string' && merged.fullName) payload.fullName = merged.fullName;
    if (typeof merged.email === 'string' && merged.email) payload.email = merged.email;
  }

  if (merged.experience === 0 || merged.experience) {
    payload.experience = merged.experience;
  }

  return payload;
}

/** For updates: same whitelist, never send password unless explicitly provided. */
export function buildUpdateTeacherPayload(
  formData: TeacherFormValues,
  options?: { otherStates?: TeacherOtherFields },
): Record<string, unknown> {
  return buildCreateTeacherPayload(formData, { ...options, includePassword: false });
}
