const allRoles = {
  owner: ['getUsers', 'manageUsers'],
  franchise: ['getUsers', 'manageUsers'],
  receptionist: ['getUsers', 'manageUsers', 'addInventory', 'getInventory', 'manageInventory'],
  admin: ['getUsers', 'manageUsers'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
