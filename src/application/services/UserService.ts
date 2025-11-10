/**
 * User Service
 * Application service for User business logic and workflows
 */

import {
  type IUserRepository,
  User,
  type UserCreationData,
  type UserPreferences,
  type UserUpdateData,
} from '@/domain/models/User';
import { logError, logOperation, logSecurityEvent } from '@/server/lib/logger';

export interface UserServiceDependencies {
  userRepository: IUserRepository;
}

export class UserService {
  constructor(private dependencies: UserServiceDependencies) {}

  /**
   * Get user by ID with security logging
   */
  async getUserById(id: string, requestorId?: string): Promise<User | null> {
    try {
      // Security check: users can only access their own data
      if (requestorId && requestorId !== id) {
        logSecurityEvent('unauthorized_user_access_attempt', requestorId, {
          targetUserId: id,
          operation: 'getUserById',
        });
        throw new Error('Unauthorized: Cannot access other user data');
      }

      const user = await this.dependencies.userRepository.findById(id);

      if (!user && requestorId) {
        logOperation('user_not_found', requestorId, 'user', id, {
          operation: 'getUserById',
        });
      }

      return user;
    } catch (error) {
      logError('user_service_get_by_id', id, error as Error, {
        operation: 'getUserById',
        requestorId,
      });
      throw error;
    }
  }

  /**
   * Get user by email (for authentication purposes)
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.dependencies.userRepository.findByEmail(email);
      return user;
    } catch (error) {
      logError('user_service_get_by_email', email, error as Error, {
        operation: 'getUserByEmail',
      });
      throw error;
    }
  }

  /**
   * Create a new user with validation and business rules
   */
  async createUser(userData: UserCreationData, requestorId?: string): Promise<User> {
    try {
      // Validate email uniqueness
      const existingUser = await this.dependencies.userRepository.findByEmail(userData.email);
      if (existingUser) {
        logSecurityEvent('duplicate_user_creation_attempt', requestorId || 'system', {
          email: userData.email,
          operation: 'createUser',
        });
        throw new Error('User with this email already exists');
      }

      // Validate user data
      this.validateUserCreationData(userData);

      // Create user
      const user = User.create(userData);
      const createdUser = await this.dependencies.userRepository.create(user);

      logOperation('user_creation_success', createdUser.id, 'user', createdUser.id, {
        email: createdUser.email,
        fullName: createdUser.fullName,
        autonomyLevel: createdUser.autonomyLevel,
      });

      return createdUser;
    } catch (error) {
      logError('user_service_create_user', userData.email, error as Error, {
        operation: 'createUser',
        userData: {
          email: userData.email,
          fullName: userData.fullName,
        },
      });
      throw error;
    }
  }

  /**
   * Update user profile with validation
   */
  async updateUserProfile(
    userId: string,
    updateData: UserUpdateData,
    requestorId: string
  ): Promise<User> {
    try {
      // Security check: users can only update their own profile
      if (requestorId !== userId) {
        logSecurityEvent('unauthorized_user_update_attempt', requestorId, {
          targetUserId: userId,
          operation: 'updateUserProfile',
        });
        throw new Error('Unauthorized: Cannot update other user profile');
      }

      // Get existing user
      const existingUser = await this.dependencies.userRepository.findById(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Validate update data
      this.validateUserUpdateData(updateData);

      // Apply business rules
      const validatedUpdateData = this.applyBusinessRules(updateData, existingUser);

      // Update user
      const updatedUser = existingUser.update(validatedUpdateData);
      const savedUser = await this.dependencies.userRepository.update(updatedUser);

      logOperation('user_profile_update_success', userId, 'user', userId, {
        updatedFields: Object.keys(validatedUpdateData),
      });

      return savedUser;
    } catch (error) {
      logError('user_service_update_user_profile', userId, error as Error, {
        operation: 'updateUserProfile',
        requestorId,
      });
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>,
    requestorId: string
  ): Promise<User> {
    try {
      // Security check: users can only update their own preferences
      if (requestorId !== userId) {
        logSecurityEvent('unauthorized_preferences_update_attempt', requestorId, {
          targetUserId: userId,
          operation: 'updateUserPreferences',
        });
        throw new Error('Unauthorized: Cannot update other user preferences');
      }

      // Validate preferences
      this.validateUserPreferences(preferences);

      // Update preferences
      const updatedUser = await this.dependencies.userRepository.updatePreferences(
        userId,
        preferences
      );

      logOperation('user_preferences_update_success', userId, 'user', userId, {
        updatedPreferences: Object.keys(preferences),
      });

      return updatedUser;
    } catch (error) {
      logError('user_service_update_preferences', userId, error as Error, {
        operation: 'updateUserPreferences',
        requestorId,
      });
      throw error;
    }
  }

  /**
   * Delete user account with confirmation
   */
  async deleteUser(userId: string, confirmation: string, requestorId: string): Promise<void> {
    try {
      // Security check: users can only delete their own account
      if (requestorId !== userId) {
        logSecurityEvent('unauthorized_user_deletion_attempt', requestorId, {
          targetUserId: userId,
          operation: 'deleteUser',
        });
        throw new Error('Unauthorized: Cannot delete other user account');
      }

      // Validate confirmation
      if (confirmation !== 'EXCLUIR') {
        throw new Error('Invalid confirmation. Type "EXCLUIR" to confirm.');
      }

      // Get user for logging
      const user = await this.dependencies.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Delete user
      await this.dependencies.userRepository.delete(userId);

      logOperation('user_deletion_success', userId, 'user', userId, {
        email: user.email,
        fullName: user.fullName,
      });
    } catch (error) {
      logError('user_service_delete_user', userId, error as Error, {
        operation: 'deleteUser',
        requestorId,
      });
      throw error;
    }
  }

  /**
   * Validate user creation data
   */
  private validateUserCreationData(userData: UserCreationData): void {
    if (!userData.email || !userData.email.includes('@')) {
      throw new Error('Valid email is required');
    }

    if (!userData.fullName || userData.fullName.trim().length < 2) {
      throw new Error('Full name must be at least 2 characters long');
    }

    if (!userData.password || userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (userData.phone && !this.validatePhone(userData.phone)) {
      throw new Error('Invalid phone number format');
    }
  }

  /**
   * Validate user update data
   */
  private validateUserUpdateData(updateData: UserUpdateData): void {
    if (updateData.fullName && updateData.fullName.trim().length < 2) {
      throw new Error('Full name must be at least 2 characters long');
    }

    if (updateData.cpf && !this.validateCPF(updateData.cpf)) {
      throw new Error('Invalid CPF format');
    }

    if (updateData.phone && !this.validatePhone(updateData.phone)) {
      throw new Error('Invalid phone number format');
    }
  }

  /**
   * Validate user preferences
   */
  private validateUserPreferences(preferences: Partial<UserPreferences>): void {
    if (preferences.autonomyLevel !== undefined) {
      if (preferences.autonomyLevel < 50 || preferences.autonomyLevel > 95) {
        throw new Error('Autonomy level must be between 50 and 95');
      }
    }

    if (preferences.language && preferences.language.length < 2) {
      throw new Error('Invalid language code');
    }

    if (preferences.currency && preferences.currency.length !== 3) {
      throw new Error('Invalid currency code');
    }
  }

  /**
   * Apply business rules to user updates
   */
  private applyBusinessRules(updateData: UserUpdateData, existingUser: User): UserUpdateData {
    const validatedData = { ...updateData };

    // Business rule: CPF can only be set once
    if (updateData.cpf && existingUser.cpf && updateData.cpf !== existingUser.cpf) {
      throw new Error('CPF cannot be changed once set');
    }

    // Business rule: Email updates are not allowed through this method
    // Email is not included in UserUpdateData interface, so no validation needed

    return validatedData;
  }

  /**
   * Validate CPF (Brazilian tax ID)
   */
  private validateCPF(cpf: string): boolean {
    // Remove non-digits
    cpf = cpf.replace(/\D/g, '');

    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Check length
    if (cpf.length !== 11) return false;

    // Calculate first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i], 10) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    if (digit !== parseInt(cpf[9], 10)) return false;

    // Calculate second digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i], 10) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    if (digit !== parseInt(cpf[10], 10)) return false;

    return true;
  }

  /**
   * Validate phone number
   */
  private validatePhone(phone: string): boolean {
    // Brazilian phone format validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }
}

/**
 * User Service Factory
 */
export function createUserService(dependencies: UserServiceDependencies): UserService {
  return new UserService(dependencies);
}
