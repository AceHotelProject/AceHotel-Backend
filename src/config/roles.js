const allRoles = {
  owner: ['getUsers', 'manageUsers', 'manageVisitors', 'getVisitors'],
  branch_manager: ['getUsers', 'manageUsers', 'manageVisitors', 'getVisitors'],
  receptionist: ['getUsers', 'manageUsers', 'manageVisitors', 'getVisitors'],
  admin: ['getUsers', 'manageUsers', 'manageVisitors', 'getVisitors'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
