import type { User, UserCreationData, UserPreferences, UserUpdateData } from '@/domain/models/User';
import { validateCPF as validateCpfFromLib } from '@/lib/security/financial-validator';

const MIN_PASSWORD_LENGTH = 8;
const MIN_AUTONOMY_LEVEL = 50;
const MAX_AUTONOMY_LEVEL = 95;
const DEFAULT_CURRENCY_CODE_LENGTH = 3;
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

const sanitizePhone = (phone: string): string => phone.replace(/\D/g, '');

const validatePhone = (phone: string): boolean => PHONE_REGEX.test(sanitizePhone(phone));

const validateUserCreationData = (userData: UserCreationData): void => {
  if (!userData.email || !userData.email.includes('@')) {
    throw new Error('Valid email is required');
  }

  if (!userData.fullName || userData.fullName.trim().length < 2) {
    throw new Error('Full name must be at least 2 characters long');
  }

  if (!userData.password || userData.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  if (userData.phone && !validatePhone(userData.phone)) {
    throw new Error('Invalid phone number format');
  }
};

const validateUserUpdateData = (updateData: UserUpdateData): void => {
  if (updateData.fullName && updateData.fullName.trim().length < 2) {
    throw new Error('Full name must be at least 2 characters long');
  }

  if (updateData.cpf && !validateCpfFromLib(updateData.cpf)) {
    throw new Error('Invalid CPF format');
  }

  if (updateData.phone && !validatePhone(updateData.phone)) {
    throw new Error('Invalid phone number format');
  }
};

const validateUserPreferences = (preferences: Partial<UserPreferences>): void => {
  const autonomyLevelIsNumber = typeof preferences.autonomyLevel === 'number';

  if (autonomyLevelIsNumber) {
    const autonomyLevel = preferences.autonomyLevel as number;

    if (autonomyLevel < MIN_AUTONOMY_LEVEL || autonomyLevel > MAX_AUTONOMY_LEVEL) {
      throw new Error(
        `Autonomy level must be between ${MIN_AUTONOMY_LEVEL} and ${MAX_AUTONOMY_LEVEL}`
      );
    }
  }

  if (preferences.language && preferences.language.length < 2) {
    throw new Error('Invalid language code');
  }

  if (preferences.currency && preferences.currency.length !== DEFAULT_CURRENCY_CODE_LENGTH) {
    throw new Error(`Invalid currency code (use ${DEFAULT_CURRENCY_CODE_LENGTH} letters)`);
  }
};

const applyBusinessRules = (updateData: UserUpdateData, existingUser: User): UserUpdateData => {
  const validatedData = { ...updateData };

  if (updateData.cpf && existingUser.cpf && updateData.cpf !== existingUser.cpf) {
    throw new Error('CPF cannot be changed once set');
  }

  return validatedData;
};

const userValidation = {
  applyBusinessRules,
  validateUserCreationData,
  validateUserPreferences,
  validateUserUpdateData,
};

export default userValidation;