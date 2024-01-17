const allRoles = {
  owner: [
    'getRooms',
    'manageRooms',
    'getFranchise',
    'manageFranchise',
    'getUsers',
    'manageUsers',
    'manageVisitors',
    'getVisitors',
    'getBookings',
    'manageBookings',
  ],
  branch_manager: [
    'getRooms',
    'manageRooms',
    'getFranchise',
    'manageFranchise',
    'getUsers',
    'manageVisitors',
    'getVisitors',
    'getBookings',
    'manageBookings',
  ],
  receptionist: ['getRooms', 'getFranchise', 'getUsers', 'manageVisitors', 'getVisitors', 'getBookings', 'manageBookings'],
  admin: [
    'getRooms',
    'manageRooms',
    'getFranchise',
    'manageFranchise',
    'getUsers',
    'manageUsers',
    'manageVisitors',
    'getVisitors',
    'getBookings',
    'manageBookings',
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
