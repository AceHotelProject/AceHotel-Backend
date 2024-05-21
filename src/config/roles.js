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
  receptionist: [
    'getInventory',
    'manageInventory',
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
    'getUsers',
    'manageUsers',
    'manageVisitors',
    'getVisitors',
    'manageReaders',
    'getBookings',
    'manageBookings',
    'uploadFiles',
  ],
  admin: [
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

  inventory_staff: [
    'getRooms',
    'getFranchise',
    'getUsers',
    'getVisitors',
    'getBookings',
    'uploadFiles',
    'getInventory',
    'manageInventory',
  ],
  cleaning_staff: [
    'getRooms',
    'getFranchise',
    'getUsers',
    'getVisitors',
    'getBookings',
    'uploadFiles',
    'getInventory',
    'manageInventory',
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
