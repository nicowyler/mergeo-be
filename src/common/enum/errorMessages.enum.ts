export enum ErrorMessages {
  // USER
  USER_NOT_FOUND = 'No se encontro ningun usuario con el email',
  USER_EMAIL_EXISTS = 'El email ya existe!',
  USER_EMAIL_NOT_VERIFIED = 'El email no ha sido verificado!',
  USER_NOT_AUTH = 'El email o la contraseña son invalidos!',
  USER_PASSWORD_RESET_LINK_EXPIRED = 'El link de reseteo de password ha expirado!',
  USER_PASSWORD_RESET_LINK_NOT_VALID = 'El link de reseteo de password no es valido!',
  USER_DELETE_OWN_ACCOUNT = 'No puede borrar su propia cuenta!',

  // COMPANY
  COMPANY_NOT_FOUND = 'No se encontro ninguna compania con el id',
  COMPANY_NAME_TAKEN = 'Ya existe una Compania con ese nombre',
  COMPANY_BUSINESS_NAME_TAKEN = 'Ya existe una Compania con esa Razon Social',
  COMPANY_CUIT_TAKEN = 'Ya existe una Compania con ese CUIT',
  // COMPANY / BRANCH
  BRANCH_NOT_FOUND = 'No se encontro ninguna sucursak con el id',
  BRANCH_NAME_TAKEN = 'Ya existe una Sucursal con ese nombre',

  //PICK UP POINT
  PICK_UP_POINT_NOT_FOUND = 'No se encontro ningun punto de retiro con el id',
  PICK_UP_POINT_NAME_TAKEN = 'Ya existe un punto de retiro con ese nombre',

  //DROP ZONE
  DROP_ZONE_NOT_FOUND = 'No se encontro ninguna zona de entrega con el id',
  PDROP_ZONE_NAME_TAKEN = 'Ya existe una zona de entrega con ese nombre',

  // COMPANY
  ROLE_NAME_TAKEN = 'El rol ya existe',
  ROLE_NOT_FOUND = 'No se encontro ningun rol con el id',
  ROLE_HAS_USER = 'Hay un usuario asociado a este rol',

  // SEARCH LIST
  SEARCH_LIST_NAME_TAKEN = 'El nombre de la lista ya existe',
  SEARCH_LIST_NOT_FOUND = 'No se encontro ningua list con el id',

  // ACTIVATION CODE
  ACTIVATION_CODE_LENGTH = 'El codigo de activacion tine que ser de 6 caracteres',
  ACTIVATION_CODE_NOT_VALID = 'El codigo de validacion es incorrecto!',
  ACTIVATION_CODE_EXPIRED = 'El codido de verificacion expiro!',
  ACCOUNT_ALREADY_VALIDATED = 'La cuenta ya fue validada',

  // DTO VALIDATIONS
  IS_UUID = 'El ID de la compania es invalido',
  ACCOUNT_TYPE = 'Los tipos de cuenta permitidos son:',
  PHONE_FORMAT = 'El formato del telefono es invalido',
}
