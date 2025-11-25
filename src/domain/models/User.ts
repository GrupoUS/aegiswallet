/**
 * User Domain Model
 * Business logic and validation for User entity
 */

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  currency: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  voiceCommandsEnabled: boolean;
  autonomyLevel: number; // 50-95
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  cpf?: string;
  birthDate?: Date;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences?: UserPreferences;
}

export interface UserCreationData {
  email: string;
  fullName: string;
  password: string;
  phone?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UserUpdateData {
  email?: string;
  fullName?: string;
  phone?: string;
  cpf?: string;
  birthDate?: Date;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}

/**
 * User Domain Model Class
 */
export class User {
  constructor(private readonly data: UserProfile) {}

  // Getters
  get id(): string {
    return this.data.id;
  }

  get email(): string {
    return this.data.email;
  }

  get fullName(): string {
    return this.data.fullName;
  }

  get phone(): string | undefined {
    return this.data.phone;
  }

  get cpf(): string | undefined {
    return this.data.cpf;
  }

  get birthDate(): Date | undefined {
    return this.data.birthDate;
  }

  get avatarUrl(): string | undefined {
    return this.data.avatarUrl;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  get preferences(): UserPreferences | undefined {
    return this.data.preferences;
  }

  // Business logic methods
  get age(): number | undefined {
    if (!this.data.birthDate) {
      return undefined;
    }

    const today = new Date();
    const birthDate = new Date(this.data.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  get isValidCPF(): boolean {
    if (!this.data.cpf) {
      return false;
    }
    return this.validateCPF(this.data.cpf);
  }

  get isValidPhone(): boolean {
    if (!this.data.phone) {
      return true;
    } // Phone is optional
    return this.validatePhone(this.data.phone);
  }

  get displayName(): string {
    return this.data.fullName || this.data.email;
  }

  get initials(): string {
    const name = this.data.fullName || this.data.email;
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  get autonomyLevel(): number {
    return this.data.preferences?.autonomyLevel || 50;
  }

  canPerformHighRiskOperation(): boolean {
    return this.autonomyLevel >= 75;
  }

  requiresConfirmationForOperation(amount: number): boolean {
    const riskThreshold = this.autonomyLevel * 1000; // Example: autonomy level * 1000
    return amount > riskThreshold;
  }

  // Validation methods
  private validateCPF(cpf: string): boolean {
    // Remove non-digits
    cpf = cpf.replace(/\D/g, '');

    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    // Check length
    if (cpf.length !== 11) {
      return false;
    }

    // Calculate first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i], 10) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit > 9) {
      digit = 0;
    }
    if (digit !== parseInt(cpf[9], 10)) {
      return false;
    }

    // Calculate second digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i], 10) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit > 9) {
      digit = 0;
    }
    if (digit !== parseInt(cpf[10], 10)) {
      return false;
    }

    return true;
  }

  private validatePhone(phone: string): boolean {
    // Brazilian phone format validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  // Factory methods
  static create(data: UserCreationData): User {
    const now = new Date();
    const userProfile: UserProfile = {
      createdAt: now,
      email: data.email,
      fullName: data.fullName,
      id: crypto.randomUUID(),
      phone: data.phone,
      preferences: {
        theme: 'system',
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        notificationsEnabled: true,
        emailNotifications: true,
        pushNotifications: true,
        voiceCommandsEnabled: true,
        autonomyLevel: 50,
        ...data.preferences,
      },
      updatedAt: now,
    };

    return new User(userProfile);
  }

  static fromDatabase(data: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    cpf: string | null;
    birth_date: string | null;
    profile_image_url?: string | null;
    created_at: string | null;
    updated_at: string | null;
    user_preferences?: {
      theme?: string | null;
      language?: string | null;
      timezone?: string | null;
      currency?: string | null;
      notifications_enabled?: boolean | null;
      email_notifications?: boolean | null;
      push_notifications?: boolean | null;
      voice_command_enabled?: boolean | null;
      autonomy_level?: number | null;
      // Additional fields from actual database schema
      accessibility_high_contrast?: boolean | null;
      accessibility_large_text?: boolean | null;
      accessibility_screen_reader?: boolean | null;
      auto_categorize?: boolean | null;
      budget_alerts?: boolean | null;
      weekly_summary?: boolean | null;
      voice_feedback?: boolean | null;
      analytics_consent?: boolean | null;
      marketing_consent?: boolean | null;
      data_retention_months?: number | null;
      [key: string]: unknown; // Allow additional fields
    } | null;
  }): User {
    // Transform database user_preferences to domain UserPreferences
    let preferences: UserPreferences | undefined;
    if (data.user_preferences) {
      preferences = {
        theme: (data.user_preferences.theme as 'light' | 'dark' | 'system') || 'system',
        language: data.user_preferences.language || 'pt-BR',
        timezone: data.user_preferences.timezone || 'America/Sao_Paulo',
        currency: data.user_preferences.currency || 'BRL',
        notificationsEnabled: data.user_preferences.notifications_enabled ?? true,
        emailNotifications: data.user_preferences.email_notifications ?? true,
        pushNotifications: data.user_preferences.push_notifications ?? true,
        voiceCommandsEnabled: data.user_preferences.voice_command_enabled ?? true,
        autonomyLevel: data.user_preferences.autonomy_level ?? 50,
      };
    }

    return new User({
      avatarUrl: data.profile_image_url ?? undefined,
      birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
      cpf: data.cpf ?? undefined,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      email: data.email,
      fullName: data.full_name || '',
      id: data.id,
      phone: data.phone ?? undefined,
      preferences,
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
    });
  }

  toJSON(): UserProfile {
    return { ...this.data };
  }

  update(data: UserUpdateData): User {
    const updatedData: UserProfile = {
      ...this.data,
      updatedAt: new Date(),
    };

    // Handle preferences separately to avoid type conflicts
    if (data.preferences) {
      const currentPrefs = this.data.preferences;
      const newPrefs: UserPreferences = {
        autonomyLevel: data.preferences.autonomyLevel ?? currentPrefs?.autonomyLevel ?? 50,
        currency: data.preferences.currency ?? currentPrefs?.currency ?? 'BRL',
        emailNotifications:
          data.preferences.emailNotifications ?? currentPrefs?.emailNotifications ?? true,
        language: data.preferences.language ?? currentPrefs?.language ?? 'pt-BR',
        notificationsEnabled:
          data.preferences.notificationsEnabled ?? currentPrefs?.notificationsEnabled ?? true,
        pushNotifications:
          data.preferences.pushNotifications ?? currentPrefs?.pushNotifications ?? true,
        theme: data.preferences.theme ?? currentPrefs?.theme ?? 'system',
        timezone: data.preferences.timezone ?? currentPrefs?.timezone ?? 'America/Sao_Paulo',
        voiceCommandsEnabled:
          data.preferences.voiceCommandsEnabled ?? currentPrefs?.voiceCommandsEnabled ?? true,
      };

      updatedData.preferences = newPrefs;
    }

    // Apply other updates (excluding preferences which is handled separately)
    const { preferences: _, ...otherUpdates } = data;
    Object.assign(updatedData, otherUpdates);

    return new User(updatedData);
  }

  updatePreferences(preferences: Partial<UserPreferences>): User {
    const currentPrefs: UserPreferences = this.data.preferences || {
      autonomyLevel: 50,
      currency: 'BRL',
      emailNotifications: true,
      language: 'pt-BR',
      notificationsEnabled: true,
      pushNotifications: true,
      theme: 'system',
      timezone: 'America/Sao_Paulo',
      voiceCommandsEnabled: true,
    };

    const updatedData: UserProfile = {
      ...this.data,
      preferences: {
        ...currentPrefs,
        ...preferences,
      },
      updatedAt: new Date(),
    };

    return new User(updatedData);
  }
}

/**
 * User Repository Interface
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User>;
}
