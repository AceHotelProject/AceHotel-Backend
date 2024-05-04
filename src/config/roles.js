const allRoles = {
  owner: [
    'getAllBookings',
    'manageFinances',
    'getAllRooms',
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
    'manageTags',
    'getInventory',
    'manageInventory',
    'manageReaders',
    'uploadFiles',
    'recap',
    'manageNotes',
    'getNotes',
  ],
  branch_manager: [
    'manageFinances',
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
    'manageTags',
    'getInventory',
    'manageInventory',
    'manageReaders',
    'uploadFiles',
    'recap',
  ],
  receptionist: [
    'manageFinances',
    'manageTags',
    'getRooms',
    'manageRooms',
    'getInventory',
    'manageInventory',
    'getRoom',
    'manageRoom',
    'getNotes',
    'manageNotes',
    'getFranchise',
    'manageFranchise',
    'getUsers',
    'manageUsers',
    'manageVisitors',
    'getVisitors',
    'manageReaders',
    'getBookings',
    'manageBookings',
    'uploadFiles',
    'recap',
  ],
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
    'manageReaders',
    'uploadFiles',
    'recap',
  ],

  inventory_staff: [
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
    'uploadFiles',
    'recap',
  ],
  cleaning_staff: [
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
    'uploadFiles',
    'recap',
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
