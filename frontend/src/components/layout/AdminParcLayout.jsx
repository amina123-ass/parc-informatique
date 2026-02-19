// src/components/layout/AdminParcLayout.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Popover,
  Paper,
  Button,
  Collapse,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  Assignment as AssignmentIcon,
  RequestPage as RequestPageIcon,
  RemoveCircle as RemoveCircleIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  AccountCircle,
  Circle as CircleIcon,
  ChevronLeft,
  ChevronRight,
  Inventory as InventoryIcon,
  BarChart as BarChartIcon,
  ExpandLess,
  ExpandMore,
  Settings as SettingsIcon,
  ViewModule as ViewModuleIcon,
  SwapHoriz as SwapHorizIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const drawerWidth = 280;
const collapsedDrawerWidth = 80;

// Icônes pour les catégories
const CATEGORY_ICONS = {
  'Informatique': <InventoryIcon />,
  'Impression': <AssignmentIcon />,
  'Réseau': <SwapHorizIcon />,
  'Sécurité': <RemoveCircleIcon />,
};

const AdminParcLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedItems, setExpandedItems] = useState({});
  
  // États pour les catégories dynamiques
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Badges pour les besoins et pannes
  const [besoinsEnAttente, setBesoinsEnAttente] = useState(0);
  const [pannesDeclarees, setPannesDeclarees] = useState(0);

  // Charger les catégories au montage
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/admin-parc/categories');
        setCategories(response.data || []);
      } catch (error) {
        console.error('Erreur chargement catégories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Charger les notifications
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Charger le nombre de besoins en attente
  useEffect(() => {
    const fetchBesoinsCount = async () => {
      try {
        const response = await api.get('/admin-parc/besoins?statut=en_attente&per_page=1');
        setBesoinsEnAttente(response.data.total || 0);
      } catch (error) {
        console.error('Erreur chargement besoins:', error);
      }
    };

    fetchBesoinsCount();
    const interval = setInterval(fetchBesoinsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Charger le nombre de pannes déclarées
  useEffect(() => {
    const fetchPannesCount = async () => {
      try {
        const response = await api.get('/admin-parc/pannes?statut=declaree&per_page=1');
        setPannesDeclarees(response.data.total || 0);
      } catch (error) {
        console.error('Erreur chargement pannes:', error);
      }
    };

    fetchPannesCount();
    const interval = setInterval(fetchPannesCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      // Si vous avez un service de notifications
      // const [notifs, countData] = await Promise.all([
      //   notificationService.getNotifications(false),
      //   notificationService.getUnreadCount(),
      // ]);
      // setNotifications(notifs.slice(0, 5));
      // setUnreadCount(countData.count);
      
      // Temporaire (à remplacer par votre service)
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

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

  const handleNotificationOpen = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotifAnchorEl(null);
  };

  const handleMarkAsRead = async (id) => {
    try {
      // await notificationService.markAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // await notificationService.markAllAsRead();
      loadNotifications();
      handleNotificationClose();
    } catch (error) {
      console.error('Erreur:', error);
    }
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

  const toggleExpand = (label) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isParentActive = (children) => {
    return children?.some((child) => {
      if (child.id) {
        return location.pathname.includes(`/sub-categories/${child.id}`);
      }
      return location.pathname === child.path;
    });
  };

  // Construire le menu dynamique avec les catégories
  const buildDynamicMenu = () => {
    const dashboardItem = {
      label: 'Tableau de bord',
      icon: <DashboardIcon />,
      path: '/admin-parc/dashboard',
    };

    const categoryMenuItems = categories.map((cat) => ({
      label: cat.nom,
      icon: CATEGORY_ICONS[cat.nom] || <CategoryIcon />,
      path: `/admin-parc/categories/${cat.id}`,
      children: cat.sous_categories?.map((subCat) => ({
        id: subCat.id,
        label: subCat.nom,
        icon: <ViewModuleIcon />,
        path: `/admin-parc/sub-categories/${subCat.id}/materiels`,
        count: subCat.materiels_count || 0,
      })) || [],
    }));

    const staticMenuItems = [
      {
        label: 'Gestion',
        icon: <SettingsIcon />,
        children: [
          {
            label: 'Catégories',
            icon: <CategoryIcon />,
            path: '/admin-parc/categories',
          },
          {
            label: 'Sous-catégories',
            icon: <ViewModuleIcon />,
            path: '/admin-parc/sous-categories/manage',
          },
        ],
      },
      {
        label: 'Consultation Matériel',
        icon: <AssignmentIcon />,
        path: '/admin-parc/affectations',
      },
      {
        label: 'Besoins',
        icon: <RequestPageIcon />,
        badge: besoinsEnAttente,
        children: [
          {
            label: 'Liste des besoins',
            icon: <AssignmentIcon />,
            path: '/admin-parc/besoins',
            badge: besoinsEnAttente,
          },
          {
            label: 'Dashboard Besoins',
            icon: <BarChartIcon />,
            path: '/admin-parc/besoins/dashboard',
          },
        ],
      },
      {
        label: 'Pannes',
        icon: <BuildIcon />,
        badge: pannesDeclarees,
        children: [
          {
            label: 'Liste des pannes',
            icon: <BuildIcon />,
            path: '/admin-parc/pannes',
            badge: pannesDeclarees,
          },
          {
            label: 'Dashboard Pannes',
            icon: <BarChartIcon />,
            path: '/admin-parc/pannes/dashboard',
          },
        ],
      },
      {
        label: 'Archives',
        icon: <InventoryIcon />,
        children: [
          {
            label: 'Matériels Réformés',
            icon: <RemoveCircleIcon />,
            path: '/admin-parc/reforme',
          },
          {
            label: 'Corbeille',
            icon: <DeleteIcon />,
            path: '/admin-parc/corbeille',
          },
        ],
      },
    ];

    return [dashboardItem, ...categoryMenuItems, ...staticMenuItems];
  };

  const menuItems = buildDynamicMenu();

  const getPageTitle = () => {
    // Pannes
    if (location.pathname === '/admin-parc/pannes/dashboard') {
      return 'Dashboard Pannes';
    }
    if (location.pathname === '/admin-parc/pannes/new') {
      return 'Déclarer une panne';
    }
    if (location.pathname.match(/\/pannes\/\d+$/)) {
      return 'Détails de la panne';
    }
    if (location.pathname === '/admin-parc/pannes') {
      return 'Gestion des Pannes';
    }

    // Matériels
    if (location.pathname.includes('/materiels/') && location.pathname.includes('/edit')) {
      return 'Modifier le matériel';
    }
    if (location.pathname.includes('/materiels/new')) {
      return 'Nouveau matériel';
    }
    if (location.pathname.match(/\/materiels\/\d+$/)) {
      return 'Détails du matériel';
    }
    if (location.pathname.includes('/materiels')) {
      return 'Liste des matériels';
    }

    // Catégories
    if (location.pathname.includes('/categories/') && !location.pathname.includes('/sous-categories')) {
      return 'Sous-catégories';
    }
    if (location.pathname.includes('/sous-categories/manage')) {
      return 'Gestion des sous-catégories';
    }

    // Besoins
    if (location.pathname === '/admin-parc/besoins/dashboard') {
      return 'Dashboard Besoins';
    }
    if (location.pathname === '/admin-parc/besoins') {
      return 'Gestion des Besoins';
    }

    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : 'Gestion du Parc';
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar 
        sx={{ 
          justifyContent: isDrawerCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fafafa'
        }}
      >
        {!isDrawerCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ 
              bgcolor: '#1976d2', 
              width: 32, 
              height: 32, 
              mr: 1,
              fontSize: '0.8rem'
            }}>
              <InventoryIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              Parc Matériel
            </Typography>
          </Box>
        )}
        
        <IconButton 
          onClick={handleDrawerCollapse}
          sx={{ 
            display: { xs: 'none', sm: 'flex' },
            ml: isDrawerCollapsed ? 0 : 'auto'
          }}
        >
          {isDrawerCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Toolbar>

      {/* Navigation */}
      <List sx={{ flexGrow: 1, px: 1, py: 2, overflow: 'auto' }}>
        {loadingCategories ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} sx={{ color: '#1976d2' }} />
          </Box>
        ) : (
          menuItems.map((item) => {
            // Items avec sous-menu
            if (item.children && item.children.length > 0) {
              const isExpanded = expandedItems[item.label];
              const hasActiveChild = isParentActive(item.children);

              return (
                <Box key={item.label}>
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => toggleExpand(item.label)}
                      sx={{
                        borderRadius: 2,
                        mx: 1,
                        minHeight: 48,
                        justifyContent: isDrawerCollapsed ? 'center' : 'initial',
                        backgroundColor: hasActiveChild ? '#1976d2' : 'transparent',
                        color: hasActiveChild ? 'white' : 'inherit',
                        '&:hover': {
                          backgroundColor: hasActiveChild ? '#1565c0' : '#f0f0f0',
                        },
                        '& .MuiListItemIcon-root': {
                          color: hasActiveChild ? 'white' : 'inherit',
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
                        {item.badge && item.badge > 0 ? (
                          <Badge badgeContent={item.badge} color="error">
                            {item.icon}
                          </Badge>
                        ) : (
                          item.icon
                        )}
                      </ListItemIcon>
                      {!isDrawerCollapsed && (
                        <>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontSize: '0.9rem',
                              fontWeight: hasActiveChild ? 600 : 500,
                            }}
                          />
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </>
                      )}
                    </ListItemButton>
                  </ListItem>

                  {/* Sous-menu */}
                  {!isDrawerCollapsed && (
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.children.map((child) => {
                          const childActive = isActive(child.path) ||
                            (child.id && location.pathname.includes(`/sub-categories/${child.id}`));

                          return (
                            <ListItem key={child.path || child.id} disablePadding sx={{ mb: 0.5 }}>
                              <ListItemButton
                                onClick={() => handleNavigate(child.path)}
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
                                <ListItemIcon
                                  sx={{
                                    minWidth: 0,
                                    mr: 3,
                                    justifyContent: 'center',
                                  }}
                                >
                                  {child.badge && child.badge > 0 ? (
                                    <Badge badgeContent={child.badge} color="error">
                                      {child.icon}
                                    </Badge>
                                  ) : (
                                    child.icon
                                  )}
                                </ListItemIcon>
                                <ListItemText
                                  primary={child.label}
                                  primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                    fontWeight: childActive ? 600 : 500,
                                  }}
                                />
                                {child.count !== undefined && (
                                  <Box
                                    sx={{
                                      bgcolor: childActive ? 'white' : '#e0e0e0',
                                      color: childActive ? '#1976d2' : 'text.secondary',
                                      borderRadius: '12px',
                                      px: 1,
                                      py: 0.25,
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      minWidth: '24px',
                                      textAlign: 'center',
                                    }}
                                  >
                                    {child.count}
                                  </Box>
                                )}
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Collapse>
                  )}
                </Box>
              );
            }

            // Items sans sous-menu
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
                      primary={item.label} 
                      primaryTypographyProps={{
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })
        )}
      </List>

      {/* User Info */}
      {!isDrawerCollapsed && (
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#fafafa'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ 
              bgcolor: '#1976d2', 
              width: 40, 
              height: 40,
              mr: 2 
            }}>
              {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {user?.prenom} {user?.nom}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.fonction || 'Admin Parc'}
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

          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={handleNotificationOpen}
            sx={{ mr: 1 }}
          >
            <Badge 
              badgeContent={unreadCount} 
              color="error"
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Notifications Popover */}
          <Popover
            open={Boolean(notifAnchorEl)}
            anchorEl={notifAnchorEl}
            onClose={handleNotificationClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                width: 380,
                maxHeight: 480,
                mt: 1,
              },
            }}
          >
            <Paper>
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid #e0e0e0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#fafafa',
                }}
              >
                <Typography variant="h6" fontWeight="600">
                  Notifications
                </Typography>
                {unreadCount > 0 && (
                  <Button
                    size="small"
                    onClick={handleMarkAllAsRead}
                    sx={{ textTransform: 'none' }}
                  >
                    Tout marquer comme lu
                  </Button>
                )}
              </Box>
              {notifications.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Aucune notification
                  </Typography>
                </Box>
              ) : (
                notifications.map((notif) => (
                  <Box
                    key={notif.id}
                    sx={{
                      p: 2,
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: notif.lu ? 'transparent' : '#f0f8ff',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#fafafa',
                      },
                    }}
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    <Box display="flex" alignItems="flex-start" gap={1}>
                      {!notif.lu && (
                        <CircleIcon sx={{ fontSize: 8, color: '#1976d2', mt: 0.5 }} />
                      )}
                      <Box flex={1}>
                        <Typography
                          variant="body2"
                          fontWeight={notif.lu ? 'normal' : 600}
                          sx={{ mb: 0.5 }}
                        >
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notif.date_creation).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
            </Paper>
          </Popover>

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
                }
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
                <LogoutIcon sx={{ mr: 1 }} />
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
              width: drawerWidth 
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
};

export default AdminParcLayout;