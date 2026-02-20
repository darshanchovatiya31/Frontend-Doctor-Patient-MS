import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, Shield, UserCircle, LogOut, Building2, Stethoscope, Users, ChevronDown, MoreVertical } from 'lucide-react';
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import swal from '../utils/swalHelper';

// Patients-MS Logo Component
const PatientsMSLogo = () => (
  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
    <span className="text-white font-bold text-sm sm:text-base">P</span>
  </div>
);

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  onClick?: () => void;
};

const getNavItems = (handleLogout: () => void, userRole?: string): NavItem[] => {
  const items: NavItem[] = [
    {
      icon: <LayoutDashboard />,
      name: "Dashboard",
      path: userRole && ['SUPER_ADMIN', 'super_admin', 'HOSPITAL', 'CLINIC', 'DOCTOR'].includes(userRole) ? "/hospital/dashboard" : "/",
    },
  ];

  // Admin panel items (for admin role)
  if (!userRole || userRole === 'admin' || userRole === 'super_admin') {
    items.push({
      icon: <Shield />,
      name: "Admins",
      path: "/admins",
    });
  }

  // Hospital Management items based on role
  // super_admin (from Admin model) should have same access as SUPER_ADMIN (from User model)
  if (userRole === 'SUPER_ADMIN' || userRole === 'super_admin') {
    items.push(
      {
        icon: <Building2 />,
        name: "Hospitals",
        path: "/hospital/hospitals",
      },
      {
        icon: <Building2 />,
        name: "Clinics",
        path: "/hospital/clinics",
      },
      {
        icon: <Stethoscope />,
        name: "Doctors",
        path: "/hospital/doctors",
      },
      {
        icon: <Users />,
        name: "Patients",
        path: "/hospital/patients",
      }
    );
  } else if (userRole === 'HOSPITAL') {
    items.push(
      {
        icon: <Building2 />,
        name: "Clinics",
        path: "/hospital/clinics",
      },
      {
        icon: <Stethoscope />,
        name: "Doctors",
        path: "/hospital/doctors",
      },
      {
        icon: <Users />,
        name: "Patients",
        path: "/hospital/patients",
      }
    );
  } else if (userRole === 'CLINIC') {
    items.push(
      {
        icon: <Stethoscope />,
        name: "Doctors",
        path: "/hospital/doctors",
      },
      {
        icon: <Users />,
        name: "Patients",
        path: "/hospital/patients",
      }
    );
  } else if (userRole === 'DOCTOR') {
    items.push({
      icon: <Users />,
      name: "Patients",
      path: "/hospital/patients",
    });
  }

  // Common items
  items.push(
    {
      icon: <UserCircle />,
      name: "Profile Settings",
      path: "/profile",
    },
    {
      icon: <LogOut />,
      name: "Logout",
      onClick: handleLogout,
    }
  );

  return items;
};

const othersItems: NavItem[] = [
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get user role from user object or localStorage
  const getUserRole = (): string | undefined => {
    if (user) {
      return (user as any).role;
    }
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        return userData.role;
      }
    } catch (e) {
      console.error('Error parsing user:', e);
    }
    return undefined;
  };
  
  // Close sidebar on mobile when clicking a link
  const handleLinkClick = () => {
    if (window.innerWidth < 1024 && isMobileOpen) {
      toggleMobileSidebar();
    }
  };
  
  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024 && isMobileOpen) {
      toggleMobileSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLogout = async () => {
    const result = await swal.confirm('Are you sure?', "You will be logged out of your account", 'Yes, logout!');

    if (result.isConfirmed) {
      try {
        await logout();
        navigate('/signin');
      } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if API call fails
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        navigate('/signin');
      }
    }
  };

  const userRole = getUserRole();
  const navItems = getNavItems(handleLogout, userRole);
  
  // Debug: Log user role to console
  useEffect(() => {
    console.log('🔍 Sidebar Debug:', {
      userRole,
      user,
      navItemsCount: navItems.length,
      navItems: navItems.map(item => ({ name: item.name, path: item.path }))
    });
  }, [userRole, user, navItems]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-2 sm:gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDown
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path ? (
              <Link
                to={nav.path}
                onClick={handleLinkClick}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            ) : nav.onClick ? (
              <button
                onClick={() => {
                  nav.onClick?.();
                  handleLinkClick();
                }}
                className={`menu-item group menu-item-inactive`}
              >
                <span className="menu-item-icon-size menu-item-icon-inactive">
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </button>
            ) : null
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-6 sm:ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      onClick={handleLinkClick}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 shadow-lg lg:shadow-none
        ${
          isExpanded || isMobileOpen
            ? "w-[290px] px-4 sm:px-5"
            : isHovered
            ? "w-[290px] px-4 sm:px-5"
            : "w-[90px] px-3 lg:px-5"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && window.innerWidth >= 1024 && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-6 sm:py-8 flex items-center gap-3 ${
          !isExpanded && !isHovered && !isMobileOpen ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/" onClick={handleLinkClick} className="flex items-center gap-3">
          <PatientsMSLogo />
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
              Patients-MS
            </span>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar pb-6">
        <nav className="mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <h2
                className={`mb-3 sm:mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered && !isMobileOpen
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <MoreVertical className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
