// services/userService.ts

export const userService = {
  // Tạo user mới
  createUser: async (request: { userName: string; password: string; email: string }): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Creating new user, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      });

      console.log('[API] Create user response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Create user error:', response.status, errorText);
        throw new Error(`Failed to create user: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Create user data:', data);
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Lấy tất cả users
  getAllUsers: async (): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching all users, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] All users response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] All users error:', response.status, errorText);
        throw new Error(`Failed to fetch all users: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] All users data:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  },

  // Tìm kiếm users theo keyword (name hoặc email)
  searchUsers: async (keyword: string): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Searching users with keyword:', keyword, 'token:', token ? 'present' : 'missing');
      
      const response = await fetch(`/api/users/search?keyword=${encodeURIComponent(keyword)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Search users response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Search users error:', response.status, errorText);
        throw new Error(`Failed to search users: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Search users data:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  },

  // Cập nhật user
  updateUser: async (userId: number, request: { 
    userName: string; 
    email: string; 
    password?: string;  // Optional - only send when changing password
    profile?: string 
  }): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Updating user', userId, 'token:', token ? 'present' : 'missing');
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      });

      console.log('[API] Update user response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Update user error:', response.status, errorText);
        throw new Error(`Failed to update user: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Update user data:', data);
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Xóa user
  deleteUser: async (userId: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Deleting user', userId, 'token:', token ? 'present' : 'missing');
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Delete user response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Delete user error:', response.status, errorText);
        throw new Error(`Failed to delete user: ${response.status} ${errorText}`);
      }

      console.log('[API] User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Lấy tổng số users
  getTotalUsers: async (): Promise<number> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching total users, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/users/counts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Total users response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Total users error:', response.status, errorText);
        throw new Error(`Failed to fetch total users: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Total users data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching total users:', error);
      return 0;
    }
  },

  // Lấy số users đăng ký tuần này
  getNewUsersThisWeek: async (): Promise<number> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching new users this week, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/users/counts-register', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] New users this week response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] New users this week error:', response.status, errorText);
        throw new Error(`Failed to fetch new users this week: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] New users this week data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching new users this week:', error);
      return 0;
    }
  }
};
