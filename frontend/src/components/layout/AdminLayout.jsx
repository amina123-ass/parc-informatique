import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, Avatar, Menu, MenuItem, Collapse,
  ListItem,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, People, Security, Business, Book,
  Logout, ExpandLess, ExpandMore, ChevronLeft, ChevronRight, AccountCircle,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 280;
const collapsedDrawerWidth = 80;

const DICO_TYPES = [
  { slug: 'marques', label: 'Marques' },
  { slug: 'cartouches', label: 'Cartouches' },
  { slug: 'categories', label: 'Catégories' },
  { slug: 'sous-categories', label: 'Sous-catégories' },
  { slug: 'entites', label: 'Entités' },
  { slug: 'communes', label: 'Communes' },
  { slug: 'structures', label: 'Structures' },
  { slug: 'system-exploitations', label: 'Systèmes d\'exploitation' },
  { slug: 'type-connexions', label: 'Types de connexion' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [dicoOpen, setDicoOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    setIsDrawerCollapsed(!isDrawerCollapsed);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  const isDicoActive = () => {
    return DICO_TYPES.some((d) => location.pathname === `/admin/dictionnaire/${d.slug}`);
  };

  const menuItems = [
    { text: 'Tableau de bord', icon: <Dashboard />, path: '/admin/dashboard' },
    { text: 'Utilisateurs', icon: <People />, path: '/admin/users' },
    { text: 'Rôles', icon: <Security />, path: '/admin/roles' },
    { text: 'Services', icon: <Business />, path: '/admin/services' },
  ];

  const getPageTitle = () => {
    if (location.pathname.includes('/dictionnaire/')) {
      const dicoType = DICO_TYPES.find((d) => location.pathname.includes(d.slug));
      return dicoType ? `Dictionnaire - ${dicoType.label}` : 'Dictionnaire';
    }
    const currentItem = menuItems.find((item) => item.path === location.pathname);
    return currentItem ? currentItem.text : 'Administration SI';
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar
        sx={{
          justifyContent: isDrawerCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
        }}
      >
        {!isDrawerCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1,
              }}
            >
              <Typography variant="h6" color="white" fontWeight={800} fontSize="0.8rem">
                PI
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                Parc Info
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Administration SI
              </Typography>
            </Box>
          </Box>
        )}

        <IconButton
          onClick={handleDrawerCollapse}
          sx={{
            display: { xs: 'none', sm: 'flex' },
            ml: isDrawerCollapsed ? 0 : 'auto',
          }}
        >
          {isDrawerCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Toolbar>

      {/* Navigation */}
      <List sx={{ flexGrow: 1, px: 1, py: 2, overflow: 'auto' }}>
        {menuItems.map((item) => {
          const itemActive = isActive(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={itemActive}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  minHeight: 48,
                  justifyContent: isDrawerCollapsed ? 'center' : 'initial',
                  '&.Mui-selected': {
                    backgroundColor: '#1976d2',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#1565c0',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    backgroundColor: '#f0f0f0',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isDrawerCollapsed ? 0 : 3,
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!isDrawerCollapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: 500,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}

        {/* Dictionnaire collapse */}
        <Box>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => setDicoOpen(!dicoOpen)}
              sx={{
                borderRadius: 2,
                mx: 1,
                minHeight: 48,
                justifyContent: isDrawerCollapsed ? 'center' : 'initial',
                backgroundColor: isDicoActive() ? '#1976d2' : 'transparent',
                color: isDicoActive() ? 'white' : 'inherit',
                '&:hover': {
                  backgroundColor: isDicoActive() ? '#1565c0' : '#f0f0f0',
                },
                '& .MuiListItemIcon-root': {
                  color: isDicoActive() ? 'white' : 'inherit',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: isDrawerCollapsed ? 0 : 3,
                  justifyContent: 'center',
                }}
              >
                <Book />
              </ListItemIcon>
              {!isDrawerCollapsed && (
                <>
                  <ListItemText
                    primary="Dictionnaire"
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isDicoActive() ? 600 : 500,
                    }}
                  />
                  {dicoOpen ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </ListItem>

          {/* Sous-menu Dictionnaire */}
          {!isDrawerCollapsed && (
            <Collapse in={dicoOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {DICO_TYPES.map((d) => {
                  const childActive = location.pathname === `/admin/dictionnaire/${d.slug}`;
                  return (
                    <ListItem key={d.slug} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => handleNavigate(`/admin/dictionnaire/${d.slug}`)}
                        sx={{
                          borderRadius: 2,
                          mx: 1,
                          pl: 4,
                          minHeight: 48,
                          backgroundColor: childActive ? '#1976d2' : 'transparent',
                          color: childActive ? 'white' : 'inherit',
                          '&:hover': {
                            backgroundColor: childActive ? '#1565c0' : '#f0f0f0',
                          },
                          '& .MuiListItemIcon-root': {
                            color: childActive ? 'white' : 'inherit',
                          },
                        }}
                      >
                        <ListItemText
                          primary={d.label}
                          primaryTypographyProps={{
                            fontSize: '0.9rem',
                            fontWeight: childActive ? 600 : 500,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          )}
        </Box>
      </List>

      {/* User Info */}
      {!isDrawerCollapsed && (
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#fafafa',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: '#1976d2',
                width: 40,
                height: 40,
                mr: 2,
              }}
            >
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {user?.prenom} {user?.nom}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.role || 'Administrateur'}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  const currentDrawerWidth = isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth;

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getPageTitle()}
          </Typography>

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleProfileMenuOpen} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                {user?.prenom?.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                },
              }}
            >
              <MenuItem disabled>
                <AccountCircle sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="subtitle2">
                    {user?.prenom} {user?.nom}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Déconnexion
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: currentDrawerWidth,
              transition: 'width 0.3s ease',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}