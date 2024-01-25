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
    'manageTags',
  ],
  branch_manager: [
    'getRooms',
    'manageRooms',
    'getFranchise',
    'manageFranchise',
    'getUsers',
    'manageUsers',
    'manageVisitors',
    'getVisitors',
  ],
  receptionist: [
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
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
