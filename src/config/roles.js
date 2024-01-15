const allRoles = {
  owner: ['getRooms','manageRooms', 'getFranchise', 'manageFranchise', 'getUsers', 'manageUsers', 'manageVisitors', 'getVisitors',],
  branch_manager: ['getRooms', 'manageRooms', 'getFranchise', 'manageFranchise', 'getUsers', 'manageVisitors', 'getVisitors',],
  receptionist: [ 'getRooms', 'getFranchise', 'getUsers', 'manageVisitors', 'getVisitors',],
  admin: ['getRooms', 'manageRooms', 'getFranchise','manageFranchise', 'getUsers','manageUsers', 'manageVisitors','getVisitors', ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
