// Auth service for handling authentication
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  authenticated: boolean;
}

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

interface RegisterRequest {
  userName: string;
  password: string;
  email: string;
}

interface RegisterResponse {
  userId: number;
  userName: string;
  email: string;
  profile: string | null;
  roles: string[];
}

export const register = async (credentials: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const response = await fetch('/api/users/register', {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('Register response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Register error response:', errorText);
      throw new Error(errorText || 'Registration failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

interface UploadProfileResponse {
  url: string;
}

export const uploadProfile = async (userId: number, file: File): Promise<UploadProfileResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/users/upload-profile/${userId}`, {
      method: 'POST',
      credentials: 'omit',
      body: formData,
    });

    console.log('Upload profile response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Upload profile error response:', errorText);
      throw new Error(errorText || 'Profile upload failed');
    }

    const url = await response.text();
    return { url };
  } catch (error) {
    console.error('Upload profile error:', error);
    throw error;
  }
};