import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  HighlightOff as HighlightOffIcon,
  LockReset as LockResetIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { jwtDecode } from 'jwt-decode';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  adminResetPassword,
} from '../../services/userService';
import { getToken } from '../../utils/tokenManager';
import { formatDataGridDate } from '../../utils/dateUtils';
import UserFormDialog from './UserFormDialog';
import ResetPasswordDialog from './ResetPasswordDialog';
import ConfirmDialog from './ConfirmDialog';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [resetTarget, setResetTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const currentUser = (() => {
    try { return jwtDecode(getToken()); } catch { return null; }
  })();

  const fetchUsers = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await listUsers();
      if (res.success) setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => { setEditingUser(null); setFormOpen(true); };
  const openEdit = (user) => { setEditingUser(user); setFormOpen(true); };

  const handleSubmitForm = async (payload) => {
    if (editingUser) {
      const res = await updateUser(editingUser._id, payload);
      if (res.success) {
        setToast({ severity: 'success', message: 'User updated.' });
        setFormOpen(false);
        fetchUsers();
      }
    } else {
      const res = await createUser(payload);
      if (res.success) {
        setToast({ severity: 'success', message: 'User created.' });
        setFormOpen(false);
        fetchUsers();
      }
    }
  };

  const handleToggleLock = async (user) => {
    try {
      const res = await updateUser(user._id, { accountLocked: !user.accountLocked });
      if (res.success) {
        setToast({
          severity: 'success',
          message: user.accountLocked ? 'Account unlocked.' : 'Account locked.',
        });
        fetchUsers();
      }
    } catch (err) {
      setToast({
        severity: 'error',
        message: err.response?.data?.error || err.message || 'Failed to update lock state',
      });
    }
  };

  const handleConfirmReset = async (newPassword) => {
    if (!resetTarget) return;
    const res = await adminResetPassword(resetTarget._id, newPassword);
    if (res.success) {
      setToast({ severity: 'success', message: `Password reset for ${resetTarget.username}.` });
      setResetTarget(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteUser(deleteTarget._id);
      if (res.success) {
        setToast({ severity: 'success', message: `Deleted ${deleteTarget.username}.` });
        setDeleteTarget(null);
        fetchUsers();
      }
    } catch (err) {
      setToast({
        severity: 'error',
        message: err.response?.data?.error || err.message || 'Failed to delete user',
      });
      setDeleteTarget(null);
    }
  };

  const renderRow = (user) => {
    const isSelf = currentUser && String(currentUser._id) === String(user._id);
    const isRoot = !!user.isRoot;
    return (
      <TableRow key={user._id} hover>
        <TableCell>
          <Typography sx={{ fontWeight: 500 }}>
            {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
          </Typography>
        </TableCell>
        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {user.username}
          {isRoot && (
            <Chip size="small" label="root" color="warning" sx={{ ml: 1, fontSize: '0.65rem', height: 18 }} />
          )}
        </TableCell>
        <TableCell sx={{ fontSize: '0.85rem' }}>{user.email || '—'}</TableCell>
        <TableCell>
          <Chip
            size="small"
            label={user.role === 'admin' ? 'Admin' : 'User'}
            color={user.role === 'admin' ? 'primary' : 'default'}
            sx={{ fontSize: '0.7rem' }}
          />
        </TableCell>
        <TableCell>
          <Chip
            size="small"
            label={user.accountLocked ? 'Locked' : 'Active'}
            color={user.accountLocked ? 'error' : 'success'}
            sx={{ fontSize: '0.7rem' }}
          />
        </TableCell>
        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          {formatDataGridDate(user.createdAt)}
        </TableCell>
        <TableCell align="center">
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            <Tooltip title="Edit">
              <IconButton size="small" color="primary" onClick={() => openEdit(user)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset password">
              <IconButton size="small" color="primary" onClick={() => setResetTarget(user)}>
                <LockResetIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={user.accountLocked ? 'Unlock account' : 'Lock account'}>
              <span>
                <IconButton
                  size="small"
                  color={user.accountLocked ? 'success' : 'warning'}
                  onClick={() => handleToggleLock(user)}
                  disabled={isRoot || isSelf}
                >
                  {user.accountLocked ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={isRoot ? 'Root admin cannot be deleted' : isSelf ? 'You cannot delete yourself' : 'Delete'}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setDeleteTarget(user)}
                  disabled={isRoot || isSelf}
                >
                  <HighlightOffIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Container maxWidth="lg" sx={{ flexGrow: 1, mt: '110px', mb: 2 }}>
          <Grid container spacing={2}>
            <Grid sx={{ pl: 2, pb: 2 }} xs={12} md={8} lg={8}>
              <Typography
                sx={{
                  mb: 1,
                  fontWeight: 500,
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1rem', md: '1.5rem' },
                }}
                variant="h4"
                color="primary"
              >
                Users
              </Typography>
              <Typography sx={{ fontSize: '0.8rem' }} color="text.secondary">
                Create and manage accounts that can log in to PhishIntel and run campaigns, templates, and senders.
              </Typography>
            </Grid>
            <Grid sx={{ p: 2 }} xs={12} md={4} lg={4}>
              <Grid container justifyContent="flex-end">
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={openCreate}>
                  Create User
                </Button>
              </Grid>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Paper sx={{ width: '100%', mt: 1, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6, gap: 2 }}>
                <CircularProgress />
                <Typography>Loading users…</Typography>
              </Box>
            ) : users.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No users yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click “Create User” to add the first account.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafafa' }}>
                      {['Name', 'Username', 'Email', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                        <TableCell
                          key={h}
                          align={h === 'Actions' ? 'center' : 'left'}
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: '2px solid rgba(224,224,224,1)',
                          }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>{users.map(renderRow)}</TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Container>
        <Footer />
      </Box>

      <UserFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitForm}
        user={editingUser}
      />

      <ResetPasswordDialog
        open={!!resetTarget}
        username={resetTarget?.username}
        onClose={() => setResetTarget(null)}
        onSubmit={handleConfirmReset}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete user?"
        body={deleteTarget ? `This permanently deletes ${deleteTarget.username}. This cannot be undone.` : ''}
        confirmLabel="Delete"
        confirmColor="error"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toast ? (
          <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

export default Users;
