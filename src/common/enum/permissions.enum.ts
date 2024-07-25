export const PERMISSIONS = {
  CREATE_USERS: { name: 'CREATE_USERS', group: 'usuarios', action: 'create' },
  EDIT_USERS: { name: 'EDIT_USERS', group: 'usuarios', action: 'edit' },
  DELETE_USERS: { name: 'DELETE_USERS', group: 'usuarios', action: 'delete' },

  CREATE_COMPANY: {
    name: 'CREATE_COMPANY',
    group: 'empresa',
    action: 'create',
  },
  EDIT_COMPANY: { name: 'EDIT_COMPANY', group: 'empresa', action: 'edit' },
  DELETE_COMPANY: {
    name: 'DELETE_COMPANY',
    group: 'empresa',
    action: 'delete',
  },

  CREATE_BRANCH: { name: 'CREATE_BRANCH', group: 'sucursal', action: 'create' },
  EDIT_BRANCH: { name: 'EDIT_BRANCH', group: 'sucursal', action: 'edit' },
  DELETE_BRANCH: { name: 'DELETE_BRANCH', group: 'sucursal', action: 'delete' },

  CREATE_PURCHASE_ORDER: {
    name: 'CREATE_PURCHASE_ORDER',
    group: 'orden de compra',
    action: 'create',
  },
  EDIT_PURCHASE_ORDER: {
    name: 'EDIT_PURCHASE_ORDER',
    group: 'orden de compra',
    action: 'edit',
  },
  DELETE_PURCHASE_ORDER: {
    name: 'DELETE_PURCHASE_ORDER',
    group: 'orden de compra',
    action: 'delete',
  },

  CREATE_AUCTION: {
    name: 'CREATE_AUCTION',
    group: 'subasta',
    action: 'create',
  },
  EDIT_AUCTION: { name: 'EDIT_AUCTION', group: 'subasta', action: 'edit' },
  DELETE_AUCTION: {
    name: 'DELETE_AUCTION',
    group: 'subasta',
    action: 'delete',
  },

  CREATE_PRODUCTS_LIST: {
    name: 'CREATE_PRODUCTS_LIST',
    group: 'lista de productos',
    action: 'create',
  },
  EDIT_PRODUCTS_LIST: {
    name: 'EDIT_PRODUCTS_LIST',
    group: 'lista de productos',
    action: 'edit',
  },
  DELETE_PRODUCTS_LIST: {
    name: 'DELETE_PRODUCTS_LIST',
    group: 'lista de productos',
    action: 'delete',
  },

  CREATE_PRODUCTS_BLACK_LIST: {
    name: 'CREATE_PRODUCTS_BLACK_LIST',
    group: 'lista negra de productos',
    action: 'create',
  },
  EDIT_PRODUCTS_BLACK_LIST: {
    name: 'EDIT_PRODUCTS_BLACK_LIST',
    group: 'lista negra de productos',
    action: 'edit',
  },
  DELETE_PRODUCTS_BLACK_LIST: {
    name: 'DELETE_PRODUCTS_BLACK_LIST',
    group: 'lista negra de productos',
    action: 'delete',
  },

  CREATE_BRANDS_BLACK_LIST: {
    name: 'CREATE_BRANDS_BLACK_LIST',
    group: 'lista negra de marcas',
    action: 'create',
  },
  EDIT_BRANDS_BLACK_LIST: {
    name: 'EDIT_BRANDS_BLACK_LIST',
    group: 'lista negra de marcas',
    action: 'edit',
  },
  DELETE_BRANDS_BLACK_LIST: {
    name: 'DELETE_BRANDS_BLACK_LIST',
    group: 'lista negra de marcas',
    action: 'delete',
  },

  CREATE_FAVORITES: {
    name: 'CREATE_FAVORITES',
    group: 'favoritos',
    action: 'create',
  },
  EDIT_FAVORITES: {
    name: 'EDIT_FAVORITES',
    group: 'favoritos',
    action: 'edit',
  },
  DELETE_FAVORITES: {
    name: 'DELETE_FAVORITES',
    group: 'favoritos',
    action: 'delete',
  },
};

export type PermissionKey = keyof typeof PERMISSIONS;
export type Permission = (typeof PERMISSIONS)[PermissionKey];
