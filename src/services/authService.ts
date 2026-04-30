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
  profile: string;
}

interface RegisterResponse {
  message: string;
  userId?: number;
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
    console.log('Register response headers:', response.headers);

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