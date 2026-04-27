import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronLeft, ChevronRight, Edit, Trash2, Plus, Search } from 'lucide-react'
import { User, UserFormDialog } from '@/components/UserFormDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { userService } from '@/services/userService'

export function AdminUsersView() {
  const [currentPage, setCurrentPage] = useState(1)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [creatingUser, setCreatingUser] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const usersPerPage = 10

  // Fetch users từ API
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await userService.getAllUsers()
      const mappedUsers: User[] = data.map((u: any) => ({
        userId: u.userId,
        userName: u.userName,
        email: u.email,
        profile: u.profile || 'Default profile',
        roles: u.roles || []
      }))
      setUsers(mappedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Search users by keyword
  const searchUsers = async (keyword: string) => {
    if (!keyword.trim()) {
      fetchUsers()
      return
    }

    try {
      setIsSearching(true)
      const data = await userService.searchUsers(keyword)
      const mappedUsers: User[] = data.map((u: any) => ({
        userId: u.userId,
        userName: u.userName,
        email: u.email,
        profile: u.profile || 'Default profile',
        roles: u.roles || []
      }))
      setUsers(mappedUsers)
      setCurrentPage(1) // Reset to first page
    } catch (error) {
      console.error('Error searching users:', error)
      setUsers([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchKeyword)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [searchKeyword])

  useEffect(() => {
    fetchUsers()
  }, [])

  const totalPages = Math.ceil(users.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const currentUsers = users.slice(startIndex, startIndex + usersPerPage)

  const handleUpdateClick = (user: User) => {
    setEditingUser(user)
  }

  const handleSaveUser = async () => {
    // Refresh user list after save
    await fetchUsers()
    setEditingUser(null)
    setCreatingUser(false)
  }

  const handleDeleteClick = (userId: number) => {
    setDeletingUserId(userId)
  }

  const handleConfirmDelete = async () => {
    if (deletingUserId) {
      try {
        await userService.deleteUser(deletingUserId)
        await fetchUsers()
        setDeletingUserId(null)
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">User Management</h1>
          <p className="text-gray-500">Manage all registered users</p>
        </div>
        <Button
          onClick={() => setCreatingUser(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-gray-500">
                {searchKeyword ? 'No users found matching your search' : 'No users found'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Avatar</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsers.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium">{user.userId}</TableCell>
                      <TableCell>
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {user.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{user.userName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className="text-gray-400 text-sm">{user.profile}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateClick(user)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(user.userId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(startIndex + usersPerPage, users.length)} of {users.length} users
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Create User Dialog */}
      <UserFormDialog
        open={creatingUser}
        onClose={() => setCreatingUser(false)}
        onSave={handleSaveUser}
      />

      {/* Update User Dialog */}
      {editingUser && (
        <UserFormDialog
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
          user={editingUser}
        />
      )}

      {/* Update Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingUserId}
        onClose={() => setDeletingUserId(null)}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}
