import { useState, useEffect, useCallback } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { ChevronLeft, ChevronRight, Edit, Trash2, Plus, Search } from 'lucide-react'
import { User, UserFormDialog } from './UserFormDialog'
import { ConfirmDialog } from './ConfirmDialog'
import { userService } from '../services/userService'

export function AdminUsersView() {
  const [currentPage, setCurrentPage] = useState(0)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [creatingUser, setCreatingUser] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [searchKeyword, setSearchKeyword] = useState('')

  const usersPerPage = 10

  // Build page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i)
    } else {
      pages.push(0)
      if (currentPage > 2) pages.push('ellipsis')
      const start = Math.max(1, currentPage - 1)
      const end = Math.min(totalPages - 2, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 3) pages.push('ellipsis')
      pages.push(totalPages - 1)
    }
    return pages
  }

  // Fetch users từ API theo page
  const fetchUsers = useCallback(async (page: number) => {
    try {
      setLoading(true)
      const data = await userService.getAllUsers(page, usersPerPage)
      const mappedUsers: User[] = (data.users || []).map((u: any) => ({
        userId: u.userId,
        userName: u.userName,
        email: u.email,
        profile: u.profile || null,
        createdAt: u.createdAt || null,
        roles: u.roles || []
      }))
      setUsers(mappedUsers)
      setTotalElements(data.totalElements)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [usersPerPage])

  // Page change: fetch users (only when not searching)
  useEffect(() => {
    if (!searchKeyword) {
      fetchUsers(currentPage)
    }
  }, [currentPage, searchKeyword, fetchUsers])

  // Debounce search: only trigger on keyword changes
  useEffect(() => {
    if (!searchKeyword.trim()) {
      return
    }
    const timer = setTimeout(async () => {
      const data = await userService.searchUsers(searchKeyword)
      const mappedUsers: User[] = data.map((u: any) => ({
        userId: u.userId,
        userName: u.userName,
        email: u.email,
        profile: u.profile || null,
        createdAt: u.createdAt || null,
        roles: u.roles || []
      }))
      setUsers(mappedUsers)
      setTotalElements(mappedUsers.length)
      setTotalPages(Math.max(1, Math.ceil(mappedUsers.length / usersPerPage)))
      setCurrentPage(0)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchKeyword])

  const handleSaveUser = async () => {
    await fetchUsers(currentPage)
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
        await fetchUsers(currentPage)
        setDeletingUserId(null)
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  const handleUpdateClick = (user: User) => {
    setEditingUser(user)
  }

  const startIndex = currentPage * usersPerPage

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Quản lý người dùng</h1>
          <p className="text-gray-500">Quản lý tất cả người dùng đã đăng ký</p>
        </div>
        <Button
          onClick={() => setCreatingUser(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo người dùng
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-gray-500">Đang tải người dùng...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-gray-500">
                {searchKeyword ? 'Không tìm thấy người dùng phù hợp với tìm kiếm' : 'Không tìm thấy người dùng'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Ảnh đại diện</TableHead>
                    <TableHead>Tên người dùng</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Thời điểm tạo</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium">{user.userId}</TableCell>
                      <TableCell>
                        {user.profile ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                            <img
                              src={user.profile}
                              alt={user.userName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                            <img
                              src="/profile_picture.png"
                              alt={user.userName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{user.userName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
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
                            Cập nhật
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(user.userId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Xóa
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
            Hiển thị {users.length > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + usersPerPage, totalElements)} của {totalElements} người dùng
          </div>
          <div className="flex items-center space-x-1 overflow-x-auto max-w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 select-none">…</span>
                ) : (
                  <Button
                    key={p}
                    variant={currentPage === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(p as number)}
                    className={currentPage === p ? 'bg-purple-600 hover:bg-purple-700 min-w-[2rem]' : 'min-w-[2rem]'}
                  >
                    {(p as number) + 1}
                  </Button>
                )
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
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
        title="Xác nhận xóa"
        description="Bạn có chắc muốn xóa người dùng này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        variant="destructive"
      />
    </div>
  )
}
