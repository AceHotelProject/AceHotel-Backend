const allRoles = {
  owner: ['getFranchise', 'manageFranchise', 'getUsers', 'manageUsers', 'manageVisitors', 'getVisitors'],
  branch_manager: ['getFranchise', 'manageFranchise', 'getUsers', 'manageUsers', 'manageVisitors', 'getVisitors'],
  receptionist: ['getFranchise', 'getUsers', 'manageUsers', 'manageVisitors', 'getVisitors'],
  admin: ['getFranchise', 'manageFranchise', 'getUsers', 'manageUsers', 'manageVisitors', 'getVisitors'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
