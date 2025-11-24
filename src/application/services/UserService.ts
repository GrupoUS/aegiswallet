/**
 * User Service
 * Application service for User business logic and workflows
 */

import type { User as DomainUser } from '@/domain/models/User';
import * as UserModel from '@/domain/models/User';
import { logger } from '@/lib/logging/logger';
import userValidation from './userValidation';

const { User } = UserModel;
const {
  applyBusinessRules,
  validateUserCreationData,
  validateUserPreferences,
  validateUserUpdateData,
} = userValidation;

type IUserRepository = UserModel.IUserRepository;
type UserCreationData = UserModel.UserCreationData;
type UserPreferences = UserModel.UserPreferences;
type UserUpdateData = UserModel.UserUpdateData;

export interface UserServiceDependencies {
  userRepository: IUserRepository;
}

interface SelfOperationGuardParams {
  errorMessage: string;
  event: string;
  operation: string;
  requestorId: string;
  targetUserId: string;
}

class UserService {
  constructor(private dependencies: UserServiceDependencies) {}

  static create(dependencies: UserServiceDependencies): UserService {
    return new UserService(dependencies);
  }

  /**
   * Get user by ID with security logging
   */
  async getUserById(id: string, requestorId?: string): Promise<DomainUser | null> {
    try {
      // Security check: users can only access their own data
      if (requestorId && requestorId !== id) {
        logger.warn('Unauthorized user access attempt', {
          event: 'unauthorized_user_access_attempt',
          operation: 'getUserById',
          targetUserId: id,
          userId: requestorId,
        });
        throw new Error('Unauthorized: Cannot access other user data');
      }

      const user = await this.dependencies.userRepository.findById(id);

      if (!user && requestorId) {
        logger.info('User not found', {
          operation: 'user_not_found',
          resource: 'user',
          resourceId: id,
          userId: requestorId,
        });
      }

      return user;
    } catch (error) {
      logger.error('Failed to get user by id', {
        error: (error as Error).message,
        operation: 'getUserById',
        requestorId,
        userId: id,
      });
      throw error;
    }
  }

  /**
   * Get user by email (for authentication purposes)
   */
  async getUserByEmail(email: string): Promise<DomainUser | null> {
    try {
      const user = await this.dependencies.userRepository.findByEmail(email);
      return user;
    } catch (error) {
      logger.error('Failed to get user by email', {
        email,
        error: (error as Error).message,
        operation: 'getUserByEmail',
      });
      throw error;
    }
  }

  /**
   * Create a new user with validation and business rules
   */
  async createUser(userData: UserCreationData, requestorId?: string): Promise<DomainUser> {
    try {
      // Validate email uniqueness
      const existingUser = await this.dependencies.userRepository.findByEmail(userData.email);
      if (existingUser) {
        logger.warn('Duplicate user creation attempt', {
          email: userData.email,
          event: 'duplicate_user_creation_attempt',
          operation: 'createUser',
          userId: requestorId || 'system',
        });
        throw new Error('User with this email already exists');
      }

      // Validate user data
      validateUserCreationData(userData);

      // Create user
      const user = User.create(userData);
      const createdUser = await this.dependencies.userRepository.create(user);

      logger.info('User created successfully', {
        autonomyLevel: createdUser.autonomyLevel,
        email: createdUser.email,
        fullName: createdUser.fullName,
        operation: 'user_creation_success',
        resource: 'user',
        userId: createdUser.id,
      });

      return createdUser;
    } catch (error) {
      logger.error('Failed to create user', {
        email: userData.email,
        error: (error as Error).message,
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
  ): Promise<DomainUser> {
    try {
      ensureSelfOperation({
        errorMessage: 'Unauthorized: Cannot update other user profile',
        event: 'unauthorized_user_update_attempt',
        operation: 'updateUserProfile',
        requestorId,
        targetUserId: userId,
      });

      const existingUser = await this.getUserOrThrow(userId);
      validateUserUpdateData(updateData);

      const validatedUpdateData = applyBusinessRules(updateData, existingUser);
      const updatedUser = existingUser.update(validatedUpdateData);
      const savedUser = await this.dependencies.userRepository.update(updatedUser);

      logger.info('User profile updated successfully', {
        operation: 'user_profile_update_success',
        resource: 'user',
        updatedFields: Object.keys(validatedUpdateData),
        userId,
      });

      return savedUser;
    } catch (error) {
      logger.error('Failed to update user profile', {
        error: (error as Error).message,
        operation: 'updateUserProfile',
        requestorId,
        userId,
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
  ): Promise<DomainUser> {
    try {
      ensureSelfOperation({
        errorMessage: 'Unauthorized: Cannot update other user preferences',
        event: 'unauthorized_preferences_update_attempt',
        operation: 'updateUserPreferences',
        requestorId,
        targetUserId: userId,
      });

      // Validate preferences
      validateUserPreferences(preferences);

      // Update preferences
      const updatedUser = await this.dependencies.userRepository.updatePreferences(
        userId,
        preferences
      );

      logger.info('User preferences updated successfully', {
        operation: 'user_preferences_update_success',
        resource: 'user',
        updatedPreferences: Object.keys(preferences),
        userId,
      });

      return updatedUser;
    } catch (error) {
      logger.error('Failed to update user preferences', {
        error: (error as Error).message,
        operation: 'updateUserPreferences',
        requestorId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Delete user account with confirmation
   */
  async deleteUser(userId: string, confirmation: string, requestorId: string): Promise<void> {
    try {
      ensureSelfOperation({
        errorMessage: 'Unauthorized: Cannot delete other user account',
        event: 'unauthorized_user_deletion_attempt',
        operation: 'deleteUser',
        requestorId,
        targetUserId: userId,
      });

      // Validate confirmation
      if (confirmation !== 'EXCLUIR') {
        throw new Error('Invalid confirmation. Type "EXCLUIR" to confirm.');
      }

      // Get user for logging
      const user = await this.getUserOrThrow(userId);

      // Delete user
      await this.dependencies.userRepository.delete(userId);

      logger.info('User deleted successfully', {
        email: user.email,
        fullName: user.fullName,
        operation: 'user_deletion_success',
        resource: 'user',
        userId,
      });
    } catch (error) {
      logger.error('Failed to delete user', {
        error: (error as Error).message,
        operation: 'deleteUser',
        requestorId,
        userId,
      });
      throw error;
    }
  }

  private async getUserOrThrow(userId: string): Promise<DomainUser> {
    const existingUser = await this.dependencies.userRepository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }
    return existingUser;
  }
}

const ensureSelfOperation = ({
  errorMessage,
  event,
  operation,
  requestorId,
  targetUserId,
}: SelfOperationGuardParams): void => {
  if (requestorId !== targetUserId) {
    logger.warn('Unauthorized user operation attempt', {
      event,
      operation,
      targetUserId,
      userId: requestorId,
    });
    throw new Error(errorMessage);
  }
};

export { UserService };
