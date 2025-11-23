/**
 * User Repository Implementation
 * Data access layer for User entity using Supabase
 */

import type { IUserRepository, UserPreferences } from '@/domain/models/User';
import { User } from '@/domain/models/User';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging/logger';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_preferences(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Failed to find user by id', {
          error: error.message,
          operation: 'findById',
          userId: id,
        });
        throw new Error(`Failed to find user: ${error.message}`);
      }

      return User.fromDatabase(data);
    } catch (error) {
      logger.error('Unexpected error in findById', {
        error: (error as Error).message,
        operation: 'findById',
        userId: id,
      });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_preferences(*)
        `)
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Failed to find user by email', {
          email,
          error: error.message,
          operation: 'findByEmail',
        });
        throw new Error(`Failed to find user by email: ${error.message}`);
      }

      return User.fromDatabase(data);
    } catch (error) {
      logger.error('Unexpected error in findByEmail', {
        email,
        error: (error as Error).message,
        operation: 'findByEmail',
      });
      throw error;
    }
  }

  async create(user: User): Promise<User> {
    try {
      const userData = user.toJSON();
      const { preferences, ...userFields } = userData;

      // Insert user
      const { error: userError } = await supabase
        .from('users')
        .insert({
          avatar_url: userFields.avatarUrl,
          birth_date: userFields.birthDate?.toISOString(),
          cpf: userFields.cpf,
          created_at: userFields.createdAt.toISOString(),
          email: userFields.email,
          full_name: userFields.fullName,
          id: userFields.id,
          phone: userFields.phone,
          updated_at: userFields.updatedAt.toISOString(),
        })
        .select()
        .single();

      if (userError) {
        logger.error('Failed to create user', {
          error: userError.message,
          operation: 'create',
          userId: user.id,
        });
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      // Insert user preferences if provided
      if (preferences) {
        const { error: preferencesError } = await supabase.from('user_preferences').insert({
          autonomy_level: preferences.autonomyLevel,
          created_at: user.createdAt.toISOString(),
          currency: preferences.currency,
          email_notifications: preferences.emailNotifications,
          language: preferences.language,
          notifications_enabled: preferences.notificationsEnabled,
          push_notifications: preferences.pushNotifications,
          theme: preferences.theme,
          timezone: preferences.timezone,
          updated_at: user.updatedAt.toISOString(),
          user_id: user.id,
          voice_commands_enabled: preferences.voiceCommandsEnabled,
        });

        if (preferencesError) {
          logger.error('Failed to create user preferences', {
            error: preferencesError.message,
            operation: 'create',
            userId: user.id,
          });
          // Don't throw error here, user was created successfully
        }
      }

      logger.info('User created successfully', {
        email: user.email,
        operation: 'user_repository_create_success',
        resource: 'user',
        userId: user.id,
      });

      // Fetch complete user with preferences
      return (await this.findById(user.id)) as User;
    } catch (error) {
      logger.error('Unexpected error in create user', {
        error: (error as Error).message,
        operation: 'create',
        userId: user.id,
      });
      throw error;
    }
  }

  async update(user: User): Promise<User> {
    try {
      const userData = user.toJSON();
      const { preferences: _unusedPreferences, ...userFields } = userData;

      // Update user
      const { error: userError } = await supabase
        .from('users')
        .update({
          avatar_url: userFields.avatarUrl,
          birth_date: userFields.birthDate?.toISOString(),
          cpf: userFields.cpf,
          full_name: userFields.fullName,
          phone: userFields.phone,
          updated_at: userFields.updatedAt.toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (userError) {
        logger.error('Failed to update user', {
          error: userError.message,
          operation: 'update',
          userId: user.id,
        });
        throw new Error(`Failed to update user: ${userError.message}`);
      }

      logger.info('User updated successfully', {
        operation: 'user_repository_update_success',
        resource: 'user',
        updatedFields: Object.keys(userFields),
        userId: user.id,
      });

      // Fetch complete user with preferences
      return (await this.findById(user.id)) as User;
    } catch (error) {
      logger.error('Unexpected error in update user', {
        error: (error as Error).message,
        operation: 'update',
        userId: user.id,
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);

      if (error) {
        logger.error('Failed to delete user', {
          error: error.message,
          operation: 'delete',
          userId: id,
        });
        throw new Error(`Failed to delete user: ${error.message}`);
      }

      logger.info('User deleted successfully', {
        operation: 'user_repository_delete_success',
        resource: 'user',
        userId: id,
      });
    } catch (error) {
      logger.error('Unexpected error in delete user', {
        error: (error as Error).message,
        operation: 'delete',
        userId: id,
      });
      throw error;
    }
  }

  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to update user preferences', {
          error: error.message,
          operation: 'updatePreferences',
          userId,
        });
        throw new Error(`Failed to update user preferences: ${error.message}`);
      }

      logger.info('User preferences updated successfully', {
        operation: 'user_repository_update_preferences_success',
        resource: 'user',
        updatedFields: Object.keys(preferences),
        userId,
      });

      // Fetch complete user with updated preferences
      return (await this.findById(userId)) as User;
    } catch (error) {
      logger.error('Unexpected error in update user preferences', {
        error: (error as Error).message,
        operation: 'updatePreferences',
        userId,
      });
      throw error;
    }
  }

  /**
   * Find users with filters
   */
  async findMany(options: {
    limit?: number;
    offset?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ users: User[]; totalCount: number }> {
    try {
      let query = supabase.from('users').select(
        `
          *,
          user_preferences(*)
        `,
        { count: 'exact' }
      );

      if (options.search) {
        query = query.or(`full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to find users', {
          component: 'system',
          error: error.message,
          operation: 'findMany',
          options,
        });
        throw new Error(`Failed to find users: ${error.message}`);
      }

      const users = (data || []).map((userData) => User.fromDatabase(userData));

      return {
        totalCount: count || 0,
        users,
      };
    } catch (error) {
      logger.error('Unexpected error in findMany', {
        component: 'system',
        error: (error as Error).message,
        operation: 'findMany',
        options,
      });
      throw error;
    }
  }
}

/**
 * User Repository Factory
 */
export function createUserRepository(): IUserRepository {
  return new UserRepository();
}
